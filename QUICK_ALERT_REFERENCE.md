# Quick Alert Reference for POLAR-EMS Simulation

## 🟢 NORMAL Scenarios (Healthy & Stable)

### Normal Operation Example
```
Temperature: -18°C ✓
Wind Speed: 12 m/s ✓
Battery SOC: 65% ✓
Load: 185 kW ✓
Wind Gen: 90 kW ✓
Diesel: 50 kW ✓
Renewable Share: 48.6% ✓
Generators: 3/3 available ✓
```
**Result:** No alerts → 🟢 HEALTHY & STABLE

---

## 🟡 WARNING Scenarios

### Warning 1: Low Battery
```
Battery SOC: 22% ⚠️ (threshold: 25%)
```
**Alert:** "Battery State of Charge Low"

### Warning 2: Low Wind + Low Renewables
```
Wind Speed: 4 m/s ⚠️ (threshold: 5 m/s)
Renewable Share: 4.4% ⚠️ (threshold: 20%)
```
**Alert:** "Very Low Renewable Generation"

### Warning 3: Extreme Cold
```
Temperature: -38°C ⚠️ (threshold: -35°C)
Battery Temp: -22°C ⚠️ (threshold: -20°C)
```
**Alerts:** "Extreme Cold Weather" + "Battery Temperature Low"

### Warning 4: High Generator Load
```
Diesel Output: 250 kW ⚠️
Generator Capacity: 300 kW (83% utilization)
```
**Alert:** "Generator Operating at High Load"

### Warning 5: Storm
```
Weather: Blizzard ⚠️
Wind: 22 m/s (turbulent)
```
**Alert:** "Storm Conditions Detected"

---

## 🔴 CRITICAL Scenarios

### Critical 1: Battery Critical
```
Battery SOC: 12% 🔴 (critical threshold: 15%)
```
**Alert:** "Battery State of Charge Critical"  
**Action:** Immediately charge battery or activate backup

### Critical 2: Generator Failure
```
Generators Available: 2/3 🔴
Generator 1: FAILED
```
**Alert:** "Generator Failure Detected"  
**Action:** Activate backup, prioritize critical loads

### Critical 3: Load Near Capacity
```
Load: 285 kW 🔴
Total Capacity: 300 kW (95% utilization)
```
**Alert:** "Load Approaching System Capacity"  
**Action:** Shed non-critical loads immediately

### Critical 4: Critical Load At Risk (WORST CASE)
```
Wind: 2 kW 🔴
Diesel: 35 kW 🔴
Battery: 8 kW 🔴
Total Available: 45 kW
Critical Load Required: 50 kW 🔴
Battery SOC: 8% 🔴
Generators: 1/3 🔴
```
**Alert:** "Critical Load Protection At Risk"  
**Action:** EMERGENCY - Shed all non-critical loads NOW!

---

## Testing in Simulation

### Get NORMAL:
- Wind: 10-15 m/s
- Battery: 40-80%
- Temp: -10 to -25°C
- All generators working

### Get WARNING:
- Wind: 3-5 m/s
- Battery: 18-24%
- Temp: < -35°C
- OR High generator load (>85%)

### Get CRITICAL:
- Battery: < 15%
- OR Generator failure
- OR Load > 90% capacity
- OR Critical loads at risk

---

## Alert Priority

1. **CRITICAL** > **WARNING** > **INFO**
2. If ANY critical alert exists → Status = 🔴 CRITICAL
3. If ANY warning exists (no critical) → Status = 🟡 WARNING
4. If no alerts → Status = 🟢 NORMAL

---

## Key Thresholds

| Metric | NORMAL | WARNING | CRITICAL |
|--------|--------|---------|----------|
| Battery SOC | ≥25% | 15-24% | <15% |
| Wind Speed | Any | <5 m/s* | N/A |
| Temperature | >-35°C | ≤-35°C | N/A |
| Generator | All OK | N/A | Any failed |
| Load/Capacity | <90% | N/A | ≥90% |

*Only triggers warning if renewable share is also <20%
