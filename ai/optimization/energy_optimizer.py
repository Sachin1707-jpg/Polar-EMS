"""
Energy Optimization using Mixed-Integer Linear Programming (MILP)
Optimizes energy dispatch to minimize fuel consumption while meeting constraints
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pulp import *
import logging

logger = logging.getLogger(__name__)


class EnergyOptimizer:
    """
    Energy dispatch optimizer using MILP
    
    Objectives:
    - Minimize diesel fuel consumption
    - Maximize renewable energy utilization
    - Ensure critical load protection
    - Manage battery state of charge
    
    Constraints:
    - Power balance at each time step
    - Equipment capacity limits
    - Battery SOC limits
    - Generator minimum runtime
    - Reserve margin requirements
    """
    
    def __init__(self, config: Dict):
        """
        Initialize optimizer
        
        Args:
            config: Configuration dictionary with equipment specs and costs
        """
        self.config = config
        self.diesel_cost_per_liter = config.get('diesel_cost_per_liter', 1.5)
        self.battery_degradation_cost_per_kwh = config.get('battery_degradation_cost', 0.05)
    
    def optimize(
        self,
        load_forecast: pd.DataFrame,
        wind_forecast: pd.DataFrame,
        initial_conditions: Dict,
        horizon_hours: int = 24
    ) -> Dict:
        """
        Optimize energy dispatch
        
        Args:
            load_forecast: Predicted load [timestamp, load_kw]
            wind_forecast: Predicted wind power [timestamp, power_kw]
            initial_conditions: Current system state {
                'battery_soc_percent': 50,
                'generator_status': 'running',
                'generator_runtime_hours': 2
            }
            horizon_hours: Optimization horizon
        
        Returns:
            Optimization results with dispatch schedule
        """
        logger.info(f"Starting optimization for {horizon_hours} hours...")
        
        # Merge forecasts
        schedule = load_forecast.merge(wind_forecast, on='timestamp', how='left')
        schedule = schedule.head(horizon_hours)
        
        time_steps = len(schedule)
        time_indices = range(time_steps)
        
        # Create optimization problem
        prob = LpProblem("Energy_Dispatch", LpMinimize)
        
        # Equipment parameters
        gen_capacity_kw = self.config.get('generator_capacity_kw', 100)
        gen_fuel_rate = self.config.get('generator_fuel_rate_l_per_kwh', 0.25)
        gen_min_load = self.config.get('generator_min_load_kw', 20)
        
        battery_capacity_kwh = self.config.get('battery_capacity_kwh', 200)
        battery_max_charge_kw = self.config.get('battery_max_charge_kw', 50)
        battery_max_discharge_kw = self.config.get('battery_max_discharge_kw', 50)
        battery_efficiency = self.config.get('battery_efficiency', 0.95)
        battery_soc_min = self.config.get('battery_soc_min_percent', 20)
        battery_soc_max = self.config.get('battery_soc_max_percent', 90)
        
        reserve_margin = self.config.get('reserve_margin_percent', 10)
        
        # Decision variables
        gen_power = LpVariable.dicts("gen_power", time_indices, lowBound=0, upBound=gen_capacity_kw)
        gen_status = LpVariable.dicts("gen_status", time_indices, cat='Binary')
        gen_startup = LpVariable.dicts("gen_startup", time_indices, cat='Binary')
        
        battery_charge = LpVariable.dicts("battery_charge", time_indices, lowBound=0, upBound=battery_max_charge_kw)
        battery_discharge = LpVariable.dicts("battery_discharge", time_indices, lowBound=0, upBound=battery_max_discharge_kw)
        battery_soc = LpVariable.dicts("battery_soc", time_indices, lowBound=battery_soc_min, upBound=battery_soc_max)
        
        load_shed = LpVariable.dicts("load_shed", time_indices, lowBound=0)
        
        # Objective: Minimize fuel consumption + battery degradation + load shedding penalty
        prob += (
            lpSum([
                gen_power[t] * gen_fuel_rate * self.diesel_cost_per_liter +
                (battery_charge[t] + battery_discharge[t]) * self.battery_degradation_cost_per_kwh +
                load_shed[t] * 1000  # High penalty for load shedding
                for t in time_indices
            ])
        )
        
        # Constraints
        for t in time_indices:
            load_kw = schedule.iloc[t]['load_kw']
            wind_kw = schedule.iloc[t]['power_kw']
            
            # Power balance: Generation + Battery discharge = Load + Battery charge + Load shed
            prob += (
                gen_power[t] + wind_kw + battery_discharge[t] ==
                load_kw + battery_charge[t] + load_shed[t],
                f"power_balance_{t}"
            )
            
            # Generator constraints
            # If generator is on, must be above minimum load
            prob += gen_power[t] >= gen_min_load * gen_status[t], f"gen_min_load_{t}"
            prob += gen_power[t] <= gen_capacity_kw * gen_status[t], f"gen_max_load_{t}"
            
            # Generator startup tracking
            if t > 0:
                prob += gen_startup[t] >= gen_status[t] - gen_status[t-1], f"gen_startup_{t}"
            
            # Battery SOC dynamics
            if t == 0:
                initial_soc = initial_conditions.get('battery_soc_percent', 50)
                prob += (
                    battery_soc[t] == initial_soc +
                    (battery_charge[t] * battery_efficiency - battery_discharge[t] / battery_efficiency) /
                    battery_capacity_kwh * 100,
                    f"battery_soc_{t}"
                )
            else:
                prob += (
                    battery_soc[t] == battery_soc[t-1] +
                    (battery_charge[t] * battery_efficiency - battery_discharge[t] / battery_efficiency) /
                    battery_capacity_kwh * 100,
                    f"battery_soc_{t}"
                )
            
            # Reserve margin: Available generation >= (1 + reserve_margin) * Load
            prob += (
                gen_capacity_kw * gen_status[t] + wind_kw + battery_discharge[t] >=
                load_kw * (1 + reserve_margin / 100),
                f"reserve_margin_{t}"
            )
        
        # Critical load protection: No load shedding allowed (can be relaxed for non-critical loads)
        for t in time_indices:
            prob += load_shed[t] == 0, f"no_load_shed_{t}"
        
        # Solve the problem
        solver = PULP_CBC_CMD(msg=False)
        prob.solve(solver)
        
        # Extract results
        if prob.status != 1:  # Not optimal
            logger.warning(f"Optimization status: {LpStatus[prob.status]}")
        
        results = {
            'status': LpStatus[prob.status],
            'solve_time_seconds': prob.solutionTime,
            'total_cost': value(prob.objective),
            'schedule': []
        }
        
        total_fuel = 0
        total_renewable = 0
        
        for t in time_indices:
            step_result = {
                'timestamp': schedule.iloc[t]['timestamp'],
                'load_kw': schedule.iloc[t]['load_kw'],
                'wind_generation_kw': schedule.iloc[t]['power_kw'],
                'diesel_generation_kw': value(gen_power[t]),
                'generator_status': 'on' if value(gen_status[t]) > 0.5 else 'off',
                'battery_charge_kw': value(battery_charge[t]),
                'battery_discharge_kw': value(battery_discharge[t]),
                'battery_soc_percent': value(battery_soc[t]),
                'load_shed_kw': value(load_shed[t]),
                'fuel_consumption_liters': value(gen_power[t]) * gen_fuel_rate
            }
            
            total_fuel += step_result['fuel_consumption_liters']
            total_renewable += step_result['wind_generation_kw']
            
            results['schedule'].append(step_result)
        
        # Calculate summary metrics
        total_generation = total_fuel / gen_fuel_rate + total_renewable
        results['total_fuel_consumption_liters'] = total_fuel
        results['total_renewable_kwh'] = total_renewable
        results['renewable_percentage'] = (total_renewable / total_generation * 100) if total_generation > 0 else 0
        
        logger.info(f"Optimization complete - Status: {results['status']}, Fuel: {total_fuel:.2f}L, Renewable: {results['renewable_percentage']:.1f}%")
        
        return results
    
    def optimize_with_scenarios(
        self,
        load_forecast: pd.DataFrame,
        wind_forecast: pd.DataFrame,
        initial_conditions: Dict,
        scenarios: List[Dict],
        horizon_hours: int = 24
    ) -> List[Dict]:
        """
        Optimize multiple scenarios (e.g., different weather conditions)
        
        Args:
            load_forecast: Base load forecast
            wind_forecast: Base wind forecast
            initial_conditions: Current state
            scenarios: List of scenario modifications
            horizon_hours: Optimization horizon
        
        Returns:
            List of optimization results for each scenario
        """
        results = []
        
        for i, scenario in enumerate(scenarios):
            logger.info(f"Optimizing scenario {i+1}/{len(scenarios)}: {scenario.get('name', 'Unnamed')}")
            
            # Modify forecasts based on scenario
            modified_load = load_forecast.copy()
            modified_wind = wind_forecast.copy()
            
            if 'load_multiplier' in scenario:
                modified_load['load_kw'] *= scenario['load_multiplier']
            
            if 'wind_multiplier' in scenario:
                modified_wind['power_kw'] *= scenario['wind_multiplier']
            
            # Run optimization
            result = self.optimize(
                modified_load,
                modified_wind,
                initial_conditions,
                horizon_hours
            )
            
            result['scenario_name'] = scenario.get('name', f'Scenario {i+1}')
            result['scenario_description'] = scenario.get('description', '')
            results.append(result)
        
        return results
