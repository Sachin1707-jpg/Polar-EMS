# POLAR-EMS Alert Scenarios Guide

**Complete guide to when the system shows NORMAL, WARNING, and CRITICAL alerts**

---

## System Health Status Overview

The POLAR-EMS simulation evaluates the microgrid system and displays one of three statuses:

- 🟢 **NORMAL (HEALTHY & STABLE)**: No critical or warning alerts detected
- 🟡 **WARNING DETECTED**: One or more warning-level conditions present
- 🔴 **CRITICAL ALERT**: One or more critical-level conditions requiring immediate action

---

## Alert Severity Levels

### 1. 🟢 INFO (Informational)
- System operating normally but noteworthy conditions exist
- No action required, but operator awareness recommended
- Examples: High renewable generation, generator at optimal efficiency

### 2. 🟡 WARNING
- System deviation from optimal operation
- Corrective action recommended but not urgent
- System still stable but monitoring required
- Examples: Low battery SOC, high diesel usage, low renewable generation

### 3. 🔴 CRITICAL
- Immediate action required to prevent system failure
- Risk to critical loads or equipment damage
- Examples: Very low battery SOC, generator failure, load exceeding capacity

---

## 🟢 NORMAL STATUS - Example Scenarios

### Scenario 1: Optimal Wind Conditions
```json
{
  "scenario_name": "Optimal Operation",
  "temperature_c": -18.0,
  "wind_speed_ms": 12.0,
  "weather_condition": "clear",
  "load_kw": 185.0,
  "wind_generation_kw": 90.0,
  "diesel_generation_kw": 50.0,
  "battery_discharge_kw": 45.0,
  "battery_soc_percent": 65.0,
  "renewable_share_percent": 48.6,
  "generators_available": 3,
  "critical_load_protected": true
}
```
**Result:** 🟢 **HEALTHY & STABLE**
- All parameters within optimal range
- Battery SOC healthy (>25%)
- Renewable contribution good (>20%)
- No generator failures
- Critical loads protected

### Scenario 2: Battery Charging Phase
```json
{
  "scenario_name": "High Wind Charging",
  "temperature_c": -12.0,
  "wind_speed_ms": 18.0,
  "weather_condition": "clear",
  "load_kw": 170.0,
  "wind_generation_kw": 95.0,
  "diesel_generation_kw": 0.0,
  "battery_charge_kw": 35.0,
  "battery_discharge_kw": 0.0,
  "battery_soc_percent": 78.0,
  "renewable_share_percent": 100.0,
  "generators_available": 3,
  "critical_load_protected": true
}
```
**Result:** 🟢 **HEALTHY & STABLE**
- 100% renewable operation
- Battery charging from excess wind
- No diesel consumption
- May show INFO alert: "High Wind Conditions" (not a problem, just informational)

---

## 🟡 WARNING STATUS - Example Scenarios

### Scenario 3: Low Battery Reserve
```json
{
  "scenario_name": "Battery Low Reserve",
  "temperature_c": -20.0,
  "wind_speed_ms": 6.0,
  "weather_condition": "cloudy",
  "load_kw": 195.0,
  "wind_generation_kw": 35.0,
  "diesel_generation_kw": 120.0,
  "battery_discharge_kw": 40.0,
  "battery_soc_percent": 22.0,  // ⚠️ Below 25% threshold
  "renewable_share_percent": 17.9,
  "generators_available": 3,
  "critical_load_protected": true
}
```
**Result:** 🟡 **WARNING DETECTED**

**Alert Triggered:**
- **Rule:** `battery_low`
- **Severity:** WARNING
- **Title:** "Battery State of Charge Low"
- **Message:** "Battery SOC at 22.0%, below recommended threshold of 25%"
- **Action:** "Begin battery charging to restore reserve capacity"

### Scenario 4: Low Wind, Low Renewables
```json
{
  "scenario_name": "Low Wind Period",
  "temperature_c": -25.0,
  "wind_speed_ms": 4.0,  // ⚠️ Below 5 m/s
  "weather_condition": "fog",
  "load_kw": 180.0,
  "wind_generation_kw": 8.0,  // ⚠️ Very low
  "diesel_generation_kw": 172.0,
  "battery_discharge_kw": 0.0,
  "battery_soc_percent": 45.0,
  "renewable_share_percent": 4.4,  // ⚠️ Below 20%
  "generators_available": 3,
  "critical_load_protected": true
}
```
**Result:** 🟡 **WARNING DETECTED**

**Alert Triggered:**
- **Rule:** `renewable_very_low`
- **Severity:** WARNING
- **Title:** "Very Low Renewable Generation"
- **Message:** "Wind generation at 8.0 kW, renewable share only 4.4%"
- **Action:** "Increase fuel reserves and optimize diesel generation"

**Note:** This alert only triggers when BOTH conditions are met:
- Renewable share < 20% AND
- Wind speed < 5 m/s

### Scenario 5: Extreme Cold Weather
```json
{
  "scenario_name": "Polar Night Cold",
  "temperature_c": -38.0,  // ⚠️ Below -35°C
  "wind_speed_ms": 10.0,
  "weather_condition": "clear",
  "load_kw": 210.0,  // Higher heating load
  "wind_generation_kw": 75.0,
  "diesel_generation_kw": 90.0,
  "battery_discharge_kw": 45.0,
  "battery_soc_percent": 52.0,
  "battery_temperature_c": -22.0,  // ⚠️ Below -20°C
  "renewable_share_percent": 35.7,
  "generators_available": 3,
  "critical_load_protected": true
}
```
**Result:** 🟡 **WARNING DETECTED** (Multiple Warnings)

**Alerts Triggered:**
1. **Rule:** `extreme_cold`
   - **Severity:** WARNING
   - **Message:** "Temperature at -38.0°C, extreme cold conditions"
   - **Action:** "Monitor equipment performance, increase heating load allowance"

2. **Rule:** `battery_cold`
   - **Severity:** WARNING
   - **Message:** "Battery temperature at -22.0°C affects performance"
   - **Action:** "Enable battery heating system if available"

### Scenario 6: High Generator Load
```json
{
  "scenario_name": "Peak Demand Period",
  "temperature_c": -15.0,
  "wind_speed_ms": 3.5,  // Low wind
  "weather_condition": "snow",
  "load_kw": 280.0,
  "wind_generation_kw": 12.0,
  "diesel_generation_kw": 250.0,  // ⚠️ High (capacity = 300 kW)
  "battery_discharge_kw": 18.0,
  "battery_soc_percent": 35.0,
  "renewable_share_percent": 4.3,
  "generator_capacity_kw": 300.0,
  "generators_available": 3,
  "critical_load_protected": true
}
```
**Result:** 🟡 **WARNING DETECTED**

**Alert Triggered:**
- **Rule:** `generator_overload`
- **Severity:** WARNING
- **Title:** "Generator Operating at High Load"
- **Message:** "Generator output at 250.0 kW (83% of capacity)"
- **Action:** "Prepare backup generator or reduce non-critical loads"

### Scenario 7: Storm Conditions
```json
{
  "scenario_name": "Blizzard Event",
  "temperature_c": -32.0,
  "wind_speed_ms": 22.0,  // High winds
  "weather_condition": "Blizzard",  // ⚠️ Severe weather
  "load_kw": 200.0,
  "wind_generation_kw": 95.0,  // High but turbulent
  "diesel_generation_kw": 60.0,
  "battery_discharge_kw": 45.0,
  "battery_soc_percent": 48.0,
  "renewable_share_percent": 47.5,
  "generators_available": 3,
  "critical_load_protected": true
}
```
**Result:** 🟡 **WARNING DETECTED**

**Alert Triggered:**
- **Rule:** `storm_conditions`
- **Severity:** WARNING
- **Title:** "Storm Conditions Detected"
- **Message:** "Severe weather: Blizzard"
- **Action:** "Prepare for potential equipment issues, ensure fuel reserves adequate"

---

## 🔴 CRITICAL STATUS - Example Scenarios

### Scenario 8: Battery Critical Low
```json
{
  "scenario_name": "Battery Emergency",
  "temperature_c": -22.0,
  "wind_speed_ms": 2.5,  // Very low wind
  "weather_condition": "fog",
  "load_kw": 185.0,
  "wind_generation_kw": 5.0,
  "diesel_generation_kw": 180.0,
  "battery_discharge_kw": 0.0,
  "battery_soc_percent": 12.0,  // 🔴 Below 15% critical threshold
  "renewable_share_percent": 2.7,
  "generators_available": 3,
  "critical_load_protected": true
}
```
**Result:** 🔴 **CRITICAL ALERT**

**Alert Triggered:**
- **Rule:** `battery_critical_low`
- **Severity:** CRITICAL
- **Title:** "Battery State of Charge Critical"
- **Message:** "Battery SOC at 12.0%, below critical threshold of 15%"
- **Action:** "Immediately charge battery or activate backup generation"

### Scenario 9: Generator Failure
```json
{
  "scenario_name": "Generator 1 Failure",
  "temperature_c": -18.0,
  "wind_speed_ms": 8.0,
  "weather_condition": "clear",
  "load_kw": 220.0,
  "wind_generation_kw": 55.0,
  "diesel_generation_kw": 120.0,
  "battery_discharge_kw": 45.0,
  "battery_soc_percent": 38.0,
  "renewable_share_percent": 25.0,
  "generator_count": 3,
  "generators_available": 2,  // 🔴 One generator failed
  "critical_load_protected": true
}
```
**Result:** 🔴 **CRITICAL ALERT**

**Alert Triggered:**
- **Rule:** `generator_failure`
- **Severity:** CRITICAL
- **Title:** "Generator Failure Detected"
- **Message:** "Generator issue detected. Available generators: 2"
- **Action:** "Activate backup generator, prioritize critical loads, investigate failure"

### Scenario 10: Load Near Capacity
```json
{
  "scenario_name": "System Capacity Limit",
  "temperature_c": -28.0,
  "wind_speed_ms": 3.0,
  "weather_condition": "snow",
  "load_kw": 285.0,  // 🔴 Near total capacity (300 kW)
  "wind_generation_kw": 8.0,
  "diesel_generation_kw": 250.0,
  "battery_discharge_kw": 27.0,
  "battery_soc_percent": 28.0,
  "renewable_share_percent": 2.8,
  "generator_capacity_kw": 100.0,
  "generator_count": 3,
  "generators_available": 3,
  "critical_load_protected": true
}
```
**Result:** 🔴 **CRITICAL ALERT**

**Alert Triggered:**
- **Rule:** `load_near_capacity`
- **Severity:** CRITICAL
- **Title:** "Load Approaching System Capacity"
- **Message:** "Total load at 285.0 kW, near available generation capacity (300 kW)"
- **Action:** "Shed non-critical loads immediately, activate all available generation"

### Scenario 11: Critical Load Protection At Risk (Worst Case)
```json
{
  "scenario_name": "System Emergency",
  "temperature_c": -30.0,
  "wind_speed_ms": 1.5,  // Extreme low wind
  "weather_condition": "fog",
  "load_kw": 195.0,
  "critical_load_kw": 50.0,
  "wind_generation_kw": 2.0,
  "diesel_generation_kw": 35.0,  // Generator issues
  "battery_discharge_kw": 8.0,  // Battery nearly depleted
  "battery_soc_percent": 8.0,  // 🔴 Critical
  "renewable_share_percent": 4.4,
  "generator_capacity_kw": 100.0,
  "generator_count": 3,
  "generators_available": 1,  // 🔴 Multiple failures
  "critical_load_protected": false  // 🔴 At risk!
}
```
**Result:** 🔴 **CRITICAL ALERT** (Multiple Critical Alerts)

**Alerts Triggered:**
1. **Rule:** `critical_load_risk`
   - **Severity:** CRITICAL
   - **Title:** "Critical Load Protection At Risk"
   - **Message:** "Available generation (45 kW) insufficient for critical loads (50 kW)"
   - **Action:** "IMMEDIATE ACTION REQUIRED: Shed all non-critical loads, activate all backup systems"

2. **Rule:** `battery_critical_low`
   - **Severity:** CRITICAL
   - **Message:** "Battery SOC at 8.0%, below critical threshold of 15%"

3. **Rule:** `generator_failure`
   - **Severity:** CRITICAL
   - **Message:** "Generator issue detected. Available generators: 1"

---

## Summary of Alert Thresholds

### Battery SOC
- **NORMAL:** ≥ 25%
- **WARNING:** 15% to 24.9%
- **CRITICAL:** < 15%

### Renewable Share
- **NORMAL:** ≥ 20% OR wind speed ≥ 5 m/s
- **WARNING:** < 20% AND wind speed < 5 m/s
- **CRITICAL:** N/A (not a critical metric alone)

### Temperature
- **NORMAL:** > -35°C
- **WARNING:** ≤ -35°C
- **CRITICAL:** N/A (temperature alone doesn't trigger critical)

### Battery Temperature
- **NORMAL:** > -20°C
- **WARNING:** ≤ -20°C
- **CRITICAL:** N/A

### Generator Load
- **NORMAL:** 0% to 85% of capacity
- **WARNING:** 85% to 100% of capacity
- **CRITICAL:** N/A (overload protection should prevent exceeding 100%)

### Generator Status
- **NORMAL:** All generators available
- **WARNING:** N/A
- **CRITICAL:** Any generator failure (available < total count)

### System Load vs Capacity
- **NORMAL:** < 90% of total capacity
- **WARNING:** N/A
- **CRITICAL:** ≥ 90% of total capacity

### Critical Load Protection
- **NORMAL:** Available generation > critical load requirement
- **WARNING:** N/A
- **CRITICAL:** Available generation < critical load requirement

---

## How to Test Alert Scenarios in Simulation

### To Get NORMAL Status:
```json
{
  "temperature_c": -18.0,
  "wind_speed_ms": 12.0,
  "battery_current_soc_percent": 50.0,
  "load": {
    "base_load_kw": 80.0,
    "critical_load_kw": 20.0
  }
}
```

### To Get WARNING Status:
```json
{
  "temperature_c": -38.0,          // Extreme cold warning
  "wind_speed_ms": 4.0,             // Low wind warning
  "battery_current_soc_percent": 22.0,  // Low battery warning
  "load": {
    "base_load_kw": 100.0,
    "critical_load_kw": 20.0
  }
}
```

### To Get CRITICAL Status:
```json
{
  "temperature_c": -25.0,
  "wind_speed_ms": 2.0,
  "battery_current_soc_percent": 12.0,  // Critical battery
  "generator": {
    "generator_count": 3,
    "generator_1_status": "failed"  // Generator failure
  },
  "events": {
    "enable_generator_failure": true,
    "generator_failure_hour": 5,
    "generator_failure_id": 1
  }
}
```

---

## System Health Calculation Logic

The system health status is calculated using this priority order:

1. **Check for CRITICAL alerts:**
   - If any alert has `severity: "critical"` → Status = 🔴 **CRITICAL ALERT**

2. **Check for WARNING alerts:**
   - If any alert has `severity: "warning"` → Status = 🟡 **WARNING DETECTED**

3. **No critical or warning alerts:**
   - Status = 🟢 **HEALTHY & STABLE**

**Important:** Even ONE critical alert overrides all other conditions and sets the entire system status to CRITICAL.

---

## Quick Reference Table

| Condition | Normal (🟢) | Warning (🟡) | Critical (🔴) |
|-----------|------------|-------------|--------------|
| **Battery SOC** | ≥ 25% | 15-24.9% | < 15% |
| **Wind Speed** | Any | < 5 m/s (with low renewable) | N/A |
| **Temperature** | > -35°C | ≤ -35°C | N/A |
| **Generator Status** | All available | N/A | Any failure |
| **Load vs Capacity** | < 90% | N/A | ≥ 90% |
| **Critical Loads** | Protected | N/A | At risk |
| **Renewable Share** | ≥ 20% or good wind | < 20% and wind < 5 m/s | N/A |

---

## Notes

1. **Multiple Alerts:** The system can trigger multiple alerts simultaneously. The overall status is determined by the highest severity level.

2. **Context-Aware Alerts:** The `renewable_very_low` alert only triggers when BOTH renewable share is low AND wind speed is low. This prevents false warnings when diesel is intentionally used despite adequate wind.

3. **AI vs Baseline:** The alert engine applies the same rules to both AI-optimized and baseline simulations, ensuring fair comparison.

4. **Alert Deduplication:** The frontend groups similar alerts and shows the highest severity occurrence.

5. **Real-time Evaluation:** Alerts are evaluated at each simulation timestep (every hour by default).

---

**End of Alert Scenarios Guide**
