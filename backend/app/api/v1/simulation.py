"""
Simulation API Endpoints
Comprehensive simulation control and monitoring
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Dict, Optional
import logging
import json
from datetime import datetime

from app.schemas.simulation import (
    SimulationRequest,
    SimulationResponse,
    PredefinedScenarioRequest,
    ComparisonRequest,
    ComparisonResponse
)
from app.services.scenario_engine import ScenarioEngine, ScenarioConfig
from app.services.emergency_engine import emergency_engine
from app.services.twilio_service import twilio_service


logger = logging.getLogger(__name__)

router = APIRouter()

# Global simulation engine instance
# In production, use dependency injection
simulation_engine = ScenarioEngine()

# Store active simulations
active_simulations: Dict[str, Dict] = {}


def _determine_winner(ai_summary: Dict, baseline_summary: Dict) -> Dict:
    """
    Determine winner using multi-objective scoring
    
    Priority:
    1. Critical load protection (must be 100%)
    2. Fuel consumption (40% weight)
    3. Renewable utilization (30% weight)
    4. Battery health (20% weight)
    5. System reliability (10% weight)
    """
    # Disqualify if critical load failed
    if not ai_summary.get('critical_loads_protected', True):
        return {
            'winner': 'baseline',
            'reason': 'AI failed to protect critical loads',
            'details': ['Critical load protection is mandatory']
        }
    
    if not baseline_summary.get('critical_loads_protected', True):
        return {
            'winner': 'ai',
            'reason': 'Baseline failed to protect critical loads',
            'details': ['Critical load protection is mandatory']
        }
    
    # Multi-objective scoring
    ai_score = 0
    baseline_score = 0
    reasons = []
    
    # 1. Fuel consumption (40% weight)
    ai_fuel = ai_summary.get('total_fuel_consumed_l', 0)
    baseline_fuel = baseline_summary.get('total_fuel_consumed_l', 1)
    
    if baseline_fuel > 0:
        fuel_diff_percent = ((baseline_fuel - ai_fuel) / baseline_fuel) * 100
        
        if fuel_diff_percent > 5:  # AI saves >5%
            ai_score += 40
            reasons.append(f"AI reduced fuel consumption by {fuel_diff_percent:.1f}%")
        elif fuel_diff_percent < -5:  # Baseline saves >5%
            baseline_score += 40
            reasons.append(f"Baseline used {abs(fuel_diff_percent):.1f}% less fuel")
        else:
            ai_score += 20
            baseline_score += 20
            reasons.append("Fuel consumption comparable")
    
    # 2. Renewable utilization (30% weight)
    renewable_diff = (ai_summary.get('average_renewable_share_percent', 0) - 
                     baseline_summary.get('average_renewable_share_percent', 0))
    
    if renewable_diff > 5:
        ai_score += 30
        reasons.append(f"AI utilized {renewable_diff:.1f}% more renewable energy")
    elif renewable_diff < -5:
        baseline_score += 30
        reasons.append(f"Baseline utilized {abs(renewable_diff):.1f}% more renewable energy")
    else:
        ai_score += 15
        baseline_score += 15
        reasons.append("Renewable utilization comparable")
    
    # 3. Battery health (20% weight)
    ai_cycles = ai_summary.get('max_battery_cycles', 0)
    baseline_cycles = baseline_summary.get('max_battery_cycles', 0)
    
    if abs(ai_cycles - baseline_cycles) < 0.5:
        ai_score += 10
        baseline_score += 10
    elif ai_cycles < baseline_cycles:
        ai_score += 20
        reasons.append("AI reduced battery wear")
    else:
        baseline_score += 20
        reasons.append("Baseline reduced battery wear")
    
    # 4. System reliability (10% weight)
    ai_soc = ai_summary.get('final_battery_soc_percent', 50)
    baseline_soc = baseline_summary.get('final_battery_soc_percent', 50)
    
    if ai_soc > baseline_soc + 10:
        ai_score += 10
        reasons.append("AI maintained higher battery reserve")
    elif baseline_soc > ai_soc + 10:
        baseline_score += 10
        reasons.append("Baseline maintained higher battery reserve")
    else:
        ai_score += 5
        baseline_score += 5
    
    # Determine winner
    score_diff = abs(ai_score - baseline_score)
    
    if score_diff < 5:
        return {
            'winner': 'tie',
            'reason': 'Performance essentially equivalent',
            'details': reasons + [f"Scores: AI {ai_score}, Baseline {baseline_score}"]
        }
    elif ai_score > baseline_score:
        return {
            'winner': 'ai',
            'reason': f"AI optimization achieved better overall performance",
            'details': reasons + [f"Final scores: AI {ai_score}, Baseline {baseline_score}"]
        }
    else:
        return {
            'winner': 'baseline',
            'reason': f"Baseline strategy performed better for this scenario",
            'details': reasons + [f"Final scores: Baseline {baseline_score}, AI {ai_score}"]
        }



@router.post("/scenarios/predefined", response_model=SimulationRequest)
async def get_predefined_scenario(request: PredefinedScenarioRequest):
    """
    Get predefined scenario configuration
    
    Available scenarios:
    - normal_operation
    - polar_night
    - extreme_cold
    - low_wind
    - high_load_low_wind
    - snow_storm
    - load_spike
    - generator_failure
    - battery_critical
    - renewable_drop
    - emergency
    """
    try:
        scenario_config = simulation_engine.generate_predefined_scenario(
            request.scenario_type
        )
        
        # Convert ScenarioConfig to SimulationRequest format
        sim_request = _scenario_config_to_request(scenario_config)
        
        return sim_request
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating predefined scenario: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate scenario")


@router.post("/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    """
    Run a complete simulation
    
    Executes scenario with AI optimization
    Returns complete timeline, alerts, and recommendations
    """
    try:
        # Convert request to ScenarioConfig
        scenario_config = _request_to_scenario_config(request)
        
        # Run simulation in AI mode
        results = simulation_engine.simulate_scenario(scenario_config, mode='ai')
        
        # Process Twilio SMS notification based on authoritative simulation condition
        results['sms'] = twilio_service.process_simulation_alert(results)
        
        # Store in active simulations
        active_simulations[results['scenario_id']] = results
        
        return results
        
    except Exception as e:
        logger.error(f"Simulation error: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.post("/simulate/baseline", response_model=SimulationResponse)
async def run_baseline_simulation(request: SimulationRequest):
    """
    Run simulation with baseline (rule-based) controller
    
    Used for comparison with AI-optimized approach
    """
    try:
        scenario_config = _request_to_scenario_config(request)
        
        # Run simulation in baseline mode
        results = simulation_engine.simulate_scenario(scenario_config, mode='baseline')
        
        # Process Twilio SMS notification based on authoritative simulation condition
        results['sms'] = twilio_service.process_simulation_alert(results)
        
        active_simulations[results['scenario_id']] = results
        
        return results
        
    except Exception as e:
        logger.error(f"Baseline simulation error: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.post("/simulate/compare", response_model=ComparisonResponse)
async def run_comparison(request: ComparisonRequest):
    """
    Run both AI and baseline simulations for comparison
    
    Returns side-by-side comparison of both approaches
    """
    try:
        scenario_config = _request_to_scenario_config(request.simulation_request)
        
        # Run AI simulation
        ai_results = simulation_engine.simulate_scenario(scenario_config, mode='ai')
        ai_results['sms'] = twilio_service.process_simulation_alert(ai_results)
        
        # Run baseline simulation with same config
        baseline_results = simulation_engine.simulate_scenario(scenario_config, mode='baseline')
        baseline_results['sms'] = twilio_service.process_simulation_alert(baseline_results)

        
        # Calculate comparison metrics
        ai_summary = ai_results['summary']
        baseline_summary = baseline_results['summary']
        
        # Calculate fuel savings
        fuel_savings_l = baseline_summary['total_fuel_consumed_l'] - ai_summary['total_fuel_consumed_l']
        fuel_savings_percent = (fuel_savings_l / baseline_summary['total_fuel_consumed_l'] * 100) if baseline_summary['total_fuel_consumed_l'] > 0 else 0
        
        # Calculate renewable increase
        renewable_increase = ai_summary['average_renewable_share_percent'] - baseline_summary['average_renewable_share_percent']
        
        # Determine winner using multi-objective scoring
        winner_result = _determine_winner(ai_summary, baseline_summary)
        
        comparison = {
            'fuel_savings_liters': fuel_savings_l,
            'fuel_savings_percent': fuel_savings_percent,
            'renewable_increase_percent': renewable_increase,
            'winner': winner_result['winner'],
            'winner_reason': winner_result['reason'],
            'details': winner_result.get('details', [])
        }
        
        return {
            'ai_results': ai_results,
            'baseline_results': baseline_results,
            'comparison': comparison
        }
        
    except Exception as e:
        logger.error(f"Comparison error: {e}")
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


@router.get("/simulations/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(simulation_id: str):
    """Get simulation results by ID"""
    if simulation_id not in active_simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    return active_simulations[simulation_id]


@router.get("/simulations", response_model=List[Dict])
async def list_simulations():
    """List all active simulations"""
    return [
        {
            'scenario_id': sim['scenario_id'],
            'scenario_name': sim['scenario_name'],
            'mode': sim['mode'],
            'status': sim['status'],
            'start_time': sim['start_time']
        }
        for sim in active_simulations.values()
    ]


@router.delete("/simulations/{simulation_id}")
async def delete_simulation(simulation_id: str):
    """Delete simulation from memory"""
    if simulation_id not in active_simulations:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    del active_simulations[simulation_id]
    return {"message": "Simulation deleted"}


@router.post("/simulate/validate", response_model=Dict)
async def validate_scenario(request: SimulationRequest):
    """
    Validate scenario configuration without running simulation
    
    Returns validation status and any errors
    """
    try:
        scenario_config = _request_to_scenario_config(request)
        is_valid, errors = scenario_config.validate()
        
        return {
            'valid': is_valid,
            'errors': errors,
            'warnings': _generate_warnings(scenario_config)
        }
        
    except Exception as e:
        return {
            'valid': False,
            'errors': [str(e)],
            'warnings': []
        }


# Helper functions

def _request_to_scenario_config(request: SimulationRequest) -> ScenarioConfig:
    """Convert SimulationRequest to ScenarioConfig"""
    scenario_id = f"{request.scenario_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    return ScenarioConfig(
        scenario_id=scenario_id,
        scenario_name=request.scenario_name,
        scenario_type=request.scenario_type,
        description=request.description or "",
        
        # Environment
        temperature_c=request.environment.temperature_c,
        wind_speed_ms=request.environment.wind_speed_ms,
        wind_direction=request.environment.wind_direction,
        weather_condition=request.environment.weather_condition,
        polar_season=request.environment.polar_season,
        solar_availability=request.environment.solar_availability,
        
        # Load
        base_load_kw=request.load.base_load_kw,
        research_load_kw=request.load.research_load_kw,
        habitation_load_kw=request.load.habitation_load_kw,
        communication_load_kw=request.load.communication_load_kw,
        critical_load_kw=request.load.critical_load_kw,
        deferrable_load_kw=request.load.deferrable_load_kw,
        
        # Renewable
        wind_turbine_capacity_kw=request.renewable.wind_turbine_capacity_kw,
        wind_turbine_count=request.renewable.wind_turbine_count,
        wind_turbine_efficiency=request.renewable.wind_turbine_efficiency,
        solar_capacity_kw=request.renewable.solar_capacity_kw,
        
        # Battery
        battery_capacity_kwh=request.battery.battery_capacity_kwh,
        battery_current_soc_percent=request.battery.battery_current_soc_percent,
        battery_max_charge_kw=request.battery.battery_max_charge_kw,
        battery_max_discharge_kw=request.battery.battery_max_discharge_kw,
        battery_min_soc_percent=request.battery.battery_min_soc_percent,
        battery_max_soc_percent=request.battery.battery_max_soc_percent,
        battery_temperature_c=request.battery.battery_temperature_c,
        battery_efficiency=request.battery.battery_efficiency,
        
        # Generator
        generator_count=request.generator.generator_count,
        generator_capacity_kw=request.generator.generator_capacity_kw,
        generator_min_load_kw=request.generator.generator_min_load_kw,
        generator_fuel_rate_l_per_kwh=request.generator.generator_fuel_rate_l_per_kwh,
        generator_1_status=request.generator.generator_1_status,
        generator_2_status=request.generator.generator_2_status,
        generator_3_status=request.generator.generator_3_status,
        
        # Events
        enable_generator_failure=request.events.enable_generator_failure,
        generator_failure_hour=request.events.generator_failure_hour,
        generator_failure_id=request.events.generator_failure_id,
        enable_load_spike=request.events.enable_load_spike,
        load_spike_hour=request.events.load_spike_hour,
        load_spike_multiplier=request.events.load_spike_multiplier,
        enable_wind_drop=request.events.enable_wind_drop,
        wind_drop_hour=request.events.wind_drop_hour,
        wind_drop_multiplier=request.events.wind_drop_multiplier,
        
        # Parameters
        duration_hours=request.parameters.duration_hours,
        time_step_minutes=request.parameters.time_step_minutes,
        enable_ai_optimization=request.parameters.enable_ai_optimization,
        enable_baseline_comparison=request.parameters.enable_baseline_comparison,
        reserve_margin_percent=request.parameters.reserve_margin_percent
    )


def _scenario_config_to_request(config: ScenarioConfig) -> SimulationRequest:
    """Convert ScenarioConfig to SimulationRequest"""
    from app.schemas.simulation import (
        SimulationEnvironment, SimulationLoad, SimulationRenewable,
        SimulationBattery, SimulationGenerator, SimulationEvents,
        SimulationParameters
    )
    
    return SimulationRequest(
        scenario_name=config.scenario_name,
        scenario_type=config.scenario_type,
        description=config.description,
        
        environment=SimulationEnvironment(
            temperature_c=config.temperature_c,
            wind_speed_ms=config.wind_speed_ms,
            wind_direction=config.wind_direction,
            weather_condition=config.weather_condition,
            polar_season=config.polar_season,
            solar_availability=config.solar_availability
        ),
        
        load=SimulationLoad(
            base_load_kw=config.base_load_kw,
            research_load_kw=config.research_load_kw,
            habitation_load_kw=config.habitation_load_kw,
            communication_load_kw=config.communication_load_kw,
            critical_load_kw=config.critical_load_kw,
            deferrable_load_kw=config.deferrable_load_kw
        ),
        
        renewable=SimulationRenewable(
            wind_turbine_capacity_kw=config.wind_turbine_capacity_kw,
            wind_turbine_count=config.wind_turbine_count,
            wind_turbine_efficiency=config.wind_turbine_efficiency,
            solar_capacity_kw=config.solar_capacity_kw
        ),
        
        battery=SimulationBattery(
            battery_capacity_kwh=config.battery_capacity_kwh,
            battery_current_soc_percent=config.battery_current_soc_percent,
            battery_max_charge_kw=config.battery_max_charge_kw,
            battery_max_discharge_kw=config.battery_max_discharge_kw,
            battery_min_soc_percent=config.battery_min_soc_percent,
            battery_max_soc_percent=config.battery_max_soc_percent,
            battery_temperature_c=config.battery_temperature_c,
            battery_efficiency=config.battery_efficiency
        ),
        
        generator=SimulationGenerator(
            generator_count=config.generator_count,
            generator_capacity_kw=config.generator_capacity_kw,
            generator_min_load_kw=config.generator_min_load_kw,
            generator_fuel_rate_l_per_kwh=config.generator_fuel_rate_l_per_kwh,
            generator_1_status=config.generator_1_status,
            generator_2_status=config.generator_2_status,
            generator_3_status=config.generator_3_status
        ),
        
        events=SimulationEvents(
            enable_generator_failure=config.enable_generator_failure,
            generator_failure_hour=config.generator_failure_hour,
            generator_failure_id=config.generator_failure_id,
            enable_load_spike=config.enable_load_spike,
            load_spike_hour=config.load_spike_hour,
            load_spike_multiplier=config.load_spike_multiplier,
            enable_wind_drop=config.enable_wind_drop,
            wind_drop_hour=config.wind_drop_hour,
            wind_drop_multiplier=config.wind_drop_multiplier
        ),
        
        parameters=SimulationParameters(
            duration_hours=config.duration_hours,
            time_step_minutes=config.time_step_minutes,
            enable_ai_optimization=config.enable_ai_optimization,
            enable_baseline_comparison=config.enable_baseline_comparison,
            reserve_margin_percent=config.reserve_margin_percent
        )
    )


def _generate_warnings(config: ScenarioConfig) -> List[str]:
    """Generate warnings for potentially risky configurations"""
    warnings = []
    
    # Low battery warning
    if config.battery_current_soc_percent < 25:
        warnings.append("Battery SOC is below 25%. System may have limited backup capacity.")
    
    # Extreme cold warning
    if config.temperature_c < -35:
        warnings.append("Extreme cold conditions. Battery efficiency and equipment performance may be degraded.")
    
    # Low wind warning
    if config.wind_speed_ms < 5:
        warnings.append("Low wind speed. Renewable generation will be minimal.")
    
    # High load warning
    total_load = config.get_total_load_kw()
    if total_load > config.generator_capacity_kw * config.generator_count * 0.8:
        warnings.append("Total load is near system capacity. Reserve margin may be insufficient.")
    
    # Generator failure warning
    if config.enable_generator_failure:
        warnings.append("Generator failure event enabled. System resilience will be tested.")
    
    return warnings


# ============================================
# Emergency Scenario API Endpoints
# ============================================

@router.get("/emergency/scenarios")
async def get_emergency_scenarios():
    """Get list of supported emergency scenarios"""
    return emergency_engine.get_supported_scenarios()


@router.post("/emergency/run")
async def run_emergency_scenario(request: Dict[str, str]):
    """
    Execute emergency scenario with real physical calculations,
    load shedding, battery evaluation, AI recommendations, and system logs.
    """
    scenario_type = request.get("scenario_type", "generator_failure")
    try:
        results = emergency_engine.execute_scenario(scenario_type)
        return results
    except Exception as e:
        logger.error(f"Error running emergency scenario {scenario_type}: {e}")
        raise HTTPException(status_code=500, detail=f"Emergency scenario execution failed: {str(e)}")


@router.post("/emergency/reset")
async def reset_emergency_scenario():
    """Reset emergency scenario back to nominal baseline state"""
    try:
        results = emergency_engine.reset_scenario()
        return results
    except Exception as e:
        logger.error(f"Error resetting emergency scenario: {e}")
        raise HTTPException(status_code=500, detail=f"Emergency scenario reset failed: {str(e)}")


@router.get("/emergency/status")
async def get_emergency_status():
    """Get current emergency status or nominal baseline state"""
    if emergency_engine.active_emergency:
        return emergency_engine.active_emergency
    return emergency_engine.reset_scenario()

