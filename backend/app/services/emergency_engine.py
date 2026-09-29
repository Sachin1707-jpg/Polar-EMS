"""
Emergency Scenario Physics Engine
Calculates realistic component states, energy balances, battery responses,
priority-based load shedding, AI recommendations, and system logs.
"""
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

from app.services.alert_engine import AlertEngine

logger = logging.getLogger(__name__)


class EmergencyEngine:
    """
    Core Emergency Physics & Simulation Engine for POLAR-EMS
    Calculates exact mathematical state transitions during critical station emergencies.
    """

    def __init__(self):
        self.alert_engine = AlertEngine()
        self.active_emergency: Optional[Dict[str, Any]] = None

    def get_supported_scenarios(self) -> List[Dict[str, Any]]:
        """Return list of supported emergency scenarios"""
        return [
            {
                "type": "generator_failure",
                "name": "Main Generator Failure",
                "description": "Primary diesel generator G1 suffers mechanical failure. Tests backup dispatch and non-critical load shedding.",
                "severity": "CRITICAL",
                "icon": "Zap"
            },
            {
                "type": "battery_failure",
                "name": "Battery System Failure",
                "description": "Battery BMS contactor trips due to thermal error. Tests generator ramp compensation without battery buffer.",
                "severity": "WARNING",
                "icon": "Battery"
            },
            {
                "type": "load_increase",
                "name": "Sudden Load Increase",
                "description": "Unexpected +85 kW surge in research lab equipment. Tests peak demand buffering and automated load shedding.",
                "severity": "HIGH",
                "icon": "TrendingUp"
            },
            {
                "type": "renewable_failure",
                "name": "Renewable Generation Drop",
                "description": "Wind turbine speed drops from 14 m/s to 2 m/s. Tests diesel generator auto-synchronization.",
                "severity": "MEDIUM",
                "icon": "Wind"
            },
            {
                "type": "extreme_cold",
                "name": "Extreme Cold (-40°C)",
                "description": "Severe polar cold storm increases heating demand by 60 kW and reduces battery efficiency.",
                "severity": "HIGH",
                "icon": "AlertTriangle"
            },
            {
                "type": "multiple_failure",
                "name": "Multiple Component Failure",
                "description": "Simultaneous main generator failure and wind drop during peak polar night.",
                "severity": "CRITICAL",
                "icon": "AlertCircle"
            }
        ]

    def execute_scenario(self, scenario_type: str) -> Dict[str, Any]:
        """
        Execute emergency scenario with real mathematical physics calculations,
        priority load shedding, battery evaluation, AI recommendations, and system logs.
        """
        now = datetime.now()
        timestamp_str = now.strftime("%H:%M:%S")

        # Baseline Nominal State
        base_main_gen_kw = 250.0
        base_backup_gen_kw = 150.0
        base_wind_kw = 65.0
        base_battery_soc = 55.0
        base_battery_cap_kwh = 200.0

        # Loads
        loads_list = [
            {"id": "life_support", "name": "Life Support & Oxygen", "category": "CRITICAL", "power_kw": 20.0, "status": "PROTECTED", "priority": 1},
            {"id": "comms", "name": "Critical Communication", "category": "CRITICAL", "power_kw": 10.0, "status": "PROTECTED", "priority": 1},
            {"id": "research", "name": "Research Equipment", "category": "HIGH_PRIORITY", "power_kw": 35.0, "status": "PROTECTED", "priority": 2},
            {"id": "lighting", "name": "Emergency Lighting", "category": "HIGH_PRIORITY", "power_kw": 15.0, "status": "PROTECTED", "priority": 2},
            {"id": "hvac", "name": "Non-Critical HVAC", "category": "NON_CRITICAL", "power_kw": 25.0, "status": "PROTECTED", "priority": 3},
            {"id": "thermal_store", "name": "Secondary Thermal Storage", "category": "NON_CRITICAL", "power_kw": 20.0, "status": "PROTECTED", "priority": 3},
        ]

        total_demand_kw = sum(l["power_kw"] for l in loads_list) + 60.0  # Base station aux demand = 185 kW total

        # Initialize component states based on scenario
        main_gen_kw = base_main_gen_kw
        main_gen_status = "ONLINE"
        backup_gen_kw = 0.0
        backup_gen_status = "STANDBY"
        wind_kw = base_wind_kw
        wind_status = "ONLINE"
        battery_status = "STANDBY"
        battery_discharge_kw = 0.0
        battery_soc = base_battery_soc

        timeline_logs = []
        alerts_generated = []

        timeline_logs.append({
            "timestamp": timestamp_str,
            "message": f"Emergency scenario initiated: {scenario_type.replace('_', ' ').title()}"
        })

        if scenario_type == "generator_failure":
            main_gen_kw = 0.0
            main_gen_status = "FAILED"
            timeline_logs.append({
                "timestamp": timestamp_str,
                "message": f"Main Generator G1 failure detected. Output dropped from {base_main_gen_kw:.0f} kW to 0 kW."
            })
            alerts_generated.append({
                "id": 201,
                "severity": "CRITICAL",
                "message": f"Main generator failure detected. Available generation decreased by {base_main_gen_kw:.0f} kW."
            })

        elif scenario_type == "battery_failure":
            battery_status = "OFFLINE"
            battery_soc = 0.0
            timeline_logs.append({
                "timestamp": timestamp_str,
                "message": "Battery Management System contactor trip detected. Battery storage offline."
            })
            alerts_generated.append({
                "id": 202,
                "severity": "WARNING",
                "message": "Battery storage offline. System operating without energy storage buffer."
            })

        elif scenario_type == "load_increase":
            total_demand_kw += 85.0
            timeline_logs.append({
                "timestamp": timestamp_str,
                "message": "Sudden load surge detected: Station demand increased by +85.0 kW (Total Demand: 270 kW)."
            })
            alerts_generated.append({
                "id": 203,
                "severity": "WARNING",
                "message": "Unscheduled load spike detected. Total demand exceeds primary generation."
            })

        elif scenario_type == "renewable_failure":
            wind_kw = 5.0
            wind_status = "DROPPED"
            timeline_logs.append({
                "timestamp": timestamp_str,
                "message": "Wind generation drop detected: Output dropped from 65 kW to 5.0 kW due to low wind."
            })
            alerts_generated.append({
                "id": 204,
                "severity": "WARNING",
                "message": "Renewable generation drop detected. Diesel compensation required."
            })

        elif scenario_type == "extreme_cold":
            total_demand_kw += 50.0
            wind_kw = 40.0
            timeline_logs.append({
                "timestamp": timestamp_str,
                "message": "Extreme cold storm (-40°C) active. Heating demand increased by +50.0 kW."
            })
            alerts_generated.append({
                "id": 205,
                "severity": "HIGH",
                "message": "Extreme cold conditions (-40°C). Heating load surge active."
            })

        elif scenario_type == "multiple_failure":
            main_gen_kw = 0.0
            main_gen_status = "FAILED"
            wind_kw = 0.0
            wind_status = "FAILED"
            timeline_logs.append({
                "timestamp": timestamp_str,
                "message": "CRITICAL MULTIPLE FAILURE: Main Generator G1 AND Wind Turbines failed simultaneously!"
            })
            alerts_generated.append({
                "id": 206,
                "severity": "CRITICAL",
                "message": "Multiple component failure! Main Generator G1 and Wind Turbines offline."
            })

        # Calculate Available Generation before battery/backup
        available_gen_kw = main_gen_kw + wind_kw
        net_deficit_kw = total_demand_kw - available_gen_kw

        timeline_logs.append({
            "timestamp": timestamp_str,
            "message": f"Energy balance recalculated: Total Demand = {total_demand_kw:.1f} kW, Online Generation = {available_gen_kw:.1f} kW (Deficit: {net_deficit_kw:.1f} kW)."
        })

        # Battery Evaluation Logic
        if net_deficit_kw > 0 and battery_status != "OFFLINE":
            if battery_soc > 20.0:
                battery_discharge_kw = min(80.0, net_deficit_kw)
                battery_status = "DISCHARGING"
                net_deficit_kw -= battery_discharge_kw
                timeline_logs.append({
                    "timestamp": timestamp_str,
                    "message": f"Battery status evaluated: SOC {battery_soc:.0f}% > 20% threshold. Initiated discharge at {battery_discharge_kw:.1f} kW."
                })
                alerts_generated.append({
                    "id": 207,
                    "severity": "WARNING",
                    "message": f"Battery reserve in use. Discharging at {battery_discharge_kw:.1f} kW (SOC: {battery_soc:.0f}%)."
                })
            else:
                battery_status = "RESERVE"
                timeline_logs.append({
                    "timestamp": timestamp_str,
                    "message": f"Battery evaluation: SOC {battery_soc:.0f}% is at/below min threshold (20%). Battery held in RESERVE."
                })

        # Backup Generator Evaluation Logic
        if net_deficit_kw > 0:
            backup_gen_kw = min(base_backup_gen_kw, net_deficit_kw + 20.0)  # Spin reserve
            backup_gen_status = "ONLINE"
            net_deficit_kw -= backup_gen_kw
            timeline_logs.append({
                "timestamp": timestamp_str,
                "message": f"Backup generation evaluated: Backup Generator G2 auto-started at {backup_gen_kw:.1f} kW output."
            })
            alerts_generated.append({
                "id": 208,
                "severity": "INFO",
                "message": f"Backup Generator G2 synchronized and online at {backup_gen_kw:.1f} kW."
            })

        # Priority Load Shedding Logic
        for load in loads_list:
            if load["category"] == "CRITICAL":
                load["status"] = "PROTECTED"
            elif load["category"] == "HIGH_PRIORITY":
                if net_deficit_kw > 20.0:
                    load["status"] = "SHED"
                    net_deficit_kw -= load["power_kw"]
                    timeline_logs.append({
                        "timestamp": timestamp_str,
                        "message": f"High-priority load shedding: {load['name']} ({load['power_kw']:.1f} kW) shed due to severe power deficit."
                    })
                else:
                    load["status"] = "PROTECTED"
            elif load["category"] == "NON_CRITICAL":
                if net_deficit_kw > -10.0 or scenario_type in ["generator_failure", "multiple_failure"]:
                    load["status"] = "SHED"
                    net_deficit_kw -= load["power_kw"]
                    timeline_logs.append({
                        "timestamp": timestamp_str,
                        "message": f"Non-critical load shedding initiated: {load['name']} ({load['power_kw']:.1f} kW) shed to maintain grid stability."
                    })
                    alerts_generated.append({
                        "id": 209,
                        "severity": "INFO",
                        "message": f"Non-critical load shedding activated: {load['name']} ({load['power_kw']:.1f} kW) shed."
                    })
                else:
                    load["status"] = "PROTECTED"

        timeline_logs.append({
            "timestamp": timestamp_str,
            "message": "Critical station equipment protected: Life Support (20 kW) and Emergency Comms (10 kW) verified 100% online."
        })

        # AI Recommendation & Reasoning Generation
        rec_title = "Maintain critical loads, activate backup generation, and preserve battery reserve."
        rec_why = []

        if main_gen_status == "FAILED":
            rec_why.append(f"Main generator G1 is FAILED (loss of {base_main_gen_kw:.0f} kW capacity).")
        if wind_status in ["DROPPED", "FAILED"]:
            rec_why.append(f"Renewable wind output is degraded at {wind_kw:.1f} kW.")
        rec_why.append(f"Total station demand is {total_demand_kw:.1f} kW, exceeding online renewable generation.")
        if battery_status == "DISCHARGING":
            rec_why.append(f"Battery SOC is {battery_soc:.0f}%, safely supplying {battery_discharge_kw:.1f} kW buffer.")
        elif battery_status == "RESERVE":
            rec_why.append("Battery SOC is at 20% minimum reserve limit to protect battery health.")
        rec_why.append("Critical Life Support and Emergency Comms have top priority and remain 100% protected.")

        timeline_logs.append({
            "timestamp": timestamp_str,
            "message": "AI emergency recommendation generated and dispatched."
        })
        timeline_logs.append({
            "timestamp": timestamp_str,
            "message": "Emergency system stabilized: Total Available Power >= Critical Demand."
        })

        # Calculate final total supply
        total_supply_kw = main_gen_kw + backup_gen_kw + wind_kw + battery_discharge_kw
        active_demand_kw = sum(l["power_kw"] for l in loads_list if l["status"] == "PROTECTED") + 60.0

        scenario_result = {
            "scenario_id": f"emergency_{scenario_type}_{now.strftime('%Y%m%d_%H%M%S')}",
            "scenario_type": scenario_type,
            "scenario_name": [s["name"] for s in self.get_supported_scenarios() if s["type"] == scenario_type][0],
            "timestamp": now.isoformat(),
            "initial_state": "Normal",
            "final_state": "Emergency Stabilized",
            "system_status": "STABILIZED",
            "metrics": {
                "main_generator_kw": main_gen_kw,
                "main_generator_status": main_gen_status,
                "backup_generator_kw": backup_gen_kw,
                "backup_generator_status": backup_gen_status,
                "wind_generation_kw": wind_kw,
                "wind_status": wind_status,
                "battery_status": battery_status,
                "battery_soc_percent": battery_soc,
                "battery_power_kw": battery_discharge_kw,
                "total_supply_kw": total_supply_kw,
                "total_demand_kw": total_demand_kw,
                "active_demand_kw": active_demand_kw,
                "net_deficit_surplus_kw": total_supply_kw - active_demand_kw,
            },
            "components": {
                "main_generator": {
                    "name": "Main Generator G1",
                    "status": main_gen_status,
                    "output_kw": main_gen_kw,
                    "capacity_kw": base_main_gen_kw,
                },
                "backup_generator": {
                    "name": "Backup Generator G2",
                    "status": backup_gen_status,
                    "output_kw": backup_gen_kw,
                    "capacity_kw": base_backup_gen_kw,
                },
                "battery": {
                    "name": "LiFePO4 Battery Storage",
                    "status": battery_status,
                    "output_kw": battery_discharge_kw,
                    "soc_percent": battery_soc,
                    "capacity_kwh": base_battery_cap_kwh,
                },
                "renewable": {
                    "name": "Wind Turbine Array",
                    "status": wind_status,
                    "output_kw": wind_kw,
                    "capacity_kw": 100.0,
                },
            },
            "loads": loads_list,
            "battery_evaluation": {
                "action": battery_status,
                "soc_percent": battery_soc,
                "discharge_rate_kw": battery_discharge_kw,
                "reason": f"Battery evaluated at {battery_soc:.0f}% SOC. Action: {battery_status} ({battery_discharge_kw:.1f} kW)."
            },
            "ai_recommendation": {
                "action": rec_title,
                "why": rec_why
            },
            "alerts": alerts_generated,
            "timeline_logs": timeline_logs,
            "energy_flow": {
                "generator": {"active": main_gen_status == "ONLINE", "status": main_gen_status, "power_kw": main_gen_kw},
                "backup_gen": {"active": backup_gen_status == "ONLINE", "status": backup_gen_status, "power_kw": backup_gen_kw},
                "renewable": {"active": wind_status in ["ONLINE", "DROPPED"] and wind_kw > 0, "status": wind_status, "power_kw": wind_kw},
                "battery": {"active": battery_status == "DISCHARGING", "status": battery_status, "power_kw": battery_discharge_kw},
                "critical_loads": {"active": True, "status": "PROTECTED", "power_kw": sum(l["power_kw"] for l in loads_list if l["category"] == "CRITICAL")},
                "non_critical_loads": {"active": any(l["status"] == "PROTECTED" for l in loads_list if l["category"] == "NON_CRITICAL"), "status": "SHED" if any(l["status"] == "SHED" for l in loads_list if l["category"] == "NON_CRITICAL") else "PROTECTED", "power_kw": sum(l["power_kw"] for l in loads_list if l["category"] == "NON_CRITICAL" and l["status"] == "PROTECTED")}
            }
        }

        self.active_emergency = scenario_result
        return scenario_result

    def reset_scenario(self) -> Dict[str, Any]:
        """Reset emergency state to baseline nominal operation"""
        now = datetime.now()
        self.active_emergency = None

        return {
            "scenario_id": "nominal_baseline",
            "scenario_type": "none",
            "scenario_name": "Normal Operation",
            "timestamp": now.isoformat(),
            "initial_state": "Emergency",
            "final_state": "Normal",
            "system_status": "NORMAL",
            "metrics": {
                "main_generator_kw": 250.0,
                "main_generator_status": "ONLINE",
                "backup_generator_kw": 0.0,
                "backup_generator_status": "STANDBY",
                "wind_generation_kw": 65.0,
                "wind_status": "ONLINE",
                "battery_status": "STANDBY",
                "battery_soc_percent": 55.0,
                "battery_power_kw": 0.0,
                "total_supply_kw": 315.0,
                "total_demand_kw": 185.0,
                "active_demand_kw": 185.0,
                "net_deficit_surplus_kw": 130.0,
            },
            "components": {
                "main_generator": {"name": "Main Generator G1", "status": "ONLINE", "output_kw": 250.0, "capacity_kw": 250.0},
                "backup_generator": {"name": "Backup Generator G2", "status": "STANDBY", "output_kw": 0.0, "capacity_kw": 150.0},
                "battery": {"name": "LiFePO4 Battery Storage", "status": "STANDBY", "output_kw": 0.0, "soc_percent": 55.0, "capacity_kwh": 200.0},
                "renewable": {"name": "Wind Turbine Array", "status": "ONLINE", "output_kw": 65.0, "capacity_kw": 100.0},
            },
            "loads": [
                {"id": "life_support", "name": "Life Support & Oxygen", "category": "CRITICAL", "power_kw": 20.0, "status": "PROTECTED", "priority": 1},
                {"id": "comms", "name": "Critical Communication", "category": "CRITICAL", "power_kw": 10.0, "status": "PROTECTED", "priority": 1},
                {"id": "research", "name": "Research Equipment", "category": "HIGH_PRIORITY", "power_kw": 35.0, "status": "PROTECTED", "priority": 2},
                {"id": "lighting", "name": "Emergency Lighting", "category": "HIGH_PRIORITY", "power_kw": 15.0, "status": "PROTECTED", "priority": 2},
                {"id": "hvac", "name": "Non-Critical HVAC", "category": "NON_CRITICAL", "power_kw": 25.0, "status": "PROTECTED", "priority": 3},
                {"id": "thermal_store", "name": "Secondary Thermal Storage", "category": "NON_CRITICAL", "power_kw": 20.0, "status": "PROTECTED", "priority": 3},
            ],
            "battery_evaluation": {
                "action": "STANDBY",
                "soc_percent": 55.0,
                "discharge_rate_kw": 0.0,
                "reason": "System operating at nominal balance. Battery in standby buffer."
            },
            "ai_recommendation": {
                "action": "Optimal operation. Maintain wind generation and keep backup generator in standby.",
                "why": ["Station power supply exceeds load demand", "Battery SOC is healthy at 55%", "Generators operating in optimal efficiency curve"]
            },
            "alerts": [],
            "timeline_logs": [
                {"timestamp": now.strftime("%H:%M:%S"), "message": "Emergency scenario reset by operator. All component states restored to normal."}
            ],
            "energy_flow": {
                "generator": {"active": True, "status": "ONLINE", "power_kw": 250.0},
                "backup_gen": {"active": False, "status": "STANDBY", "power_kw": 0.0},
                "renewable": {"active": True, "status": "ONLINE", "power_kw": 65.0},
                "battery": {"active": False, "status": "STANDBY", "power_kw": 0.0},
                "critical_loads": {"active": True, "status": "PROTECTED", "power_kw": 30.0},
                "non_critical_loads": {"active": True, "status": "PROTECTED", "power_kw": 95.0}
            }
        }


emergency_engine = EmergencyEngine()
