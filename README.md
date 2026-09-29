# POLAR-EMS

### AI-Driven Smart Energy Management System for Polar Research Stations

> An end-to-end energy management platform that combines rule-based AI recommendations, physics-based wind power forecasting, MILP-based energy dispatch optimization, and real-time scenario simulation — built specifically for the unique demands of Antarctic and Arctic research environments.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Complete System Workflow](#3-complete-system-workflow)
4. [System Architecture](#4-system-architecture)
5. [All Portals / Pages](#5-all-portals--pages)
6. [Simulation Center](#6-simulation-center)
7. [AI / ML](#7-ai--ml)
8. [Alert System](#8-alert-system)
9. [Analytics](#9-analytics)
10. [Technology Stack](#10-technology-stack)
11. [Project Structure](#11-project-structure)
12. [Quick Start](#12-quick-start)

---

## 1. Project Overview

**POLAR-EMS** (Polar Energy Management System) is an AI-assisted, full-stack web application designed to manage, monitor, forecast, optimize, and simulate the energy systems of polar research stations — environments where reliable power is not a convenience, but a survival necessity.

### The Problem

Polar research stations face a uniquely harsh set of energy challenges:

- **Extreme cold** (down to −60 °C) degrades battery performance, increases heating load, and stresses diesel generators.
- **Polar night** eliminates solar energy for months at a time, creating total dependence on wind and diesel.
- **Volatile wind** is the primary renewable source but is highly variable — wind speeds can swing from calm to storm conditions within hours.
- **Supply chain isolation** means every litre of diesel fuel must be shipped at enormous cost and logistical difficulty. There is no grid connection or emergency resupply.
- **Critical loads** — life support, communications, heating, and scientific instruments — must never be interrupted, regardless of weather or equipment failure.
- **Human operators** face cognitive overload managing multiple interdependent energy systems under stressful, remote conditions with limited expertise.

### How POLAR-EMS Addresses It

POLAR-EMS brings together four capabilities in one unified platform:

| Capability | What it does |
|---|---|
| **Real-time Monitoring** | Tracks wind generation, battery SOC, diesel output, load, fuel, and weather continuously |
| **AI Forecasting** | Predicts energy demand (24–48 h) and wind power (physics-based power curve) |
| **MILP Optimization** | Computes the fuel-minimising energy dispatch schedule for each 24-hour horizon |
| **Scenario Simulation** | Lets operators safely test what-if scenarios (storm, generator failure, battery low) before they happen in real life |

All components run in **Simulation Mode** by default — generating realistic synthetic polar data — so the system is fully functional for demonstration and evaluation without requiring live hardware.

---

## 2. Key Features

### Energy Monitoring (Dashboard)
Tracks current load (kW), wind generation (kW), diesel generator output (kW), battery state of charge (%), fuel consumption rate (L/h), and renewable share (%). Displayed as live KPI cards and a 24-hour area chart showing the interplay of all energy sources. Generator status cards (running / standby / offline) and a critical load protection panel are always visible.

### Weather Monitoring
Displays real-time (simulated) ambient temperature (°C), wind speed (m/s) and direction, atmospheric pressure (hPa), humidity (%), cloud cover (%), and visibility (km). Includes a 48-hour forecast chart and a wind-energy conversion preview that shows predicted wind power output for the forecast window.

### AI Load Forecasting
Projects electricity demand 24 or 48 hours ahead. In simulation mode, uses a synthetic pattern generator that incorporates daily cycles (work-hours peak at 1.15× base), temperature-dependent heating load (+1 kW per °C below −20 °C), and ±10% random variation within realistic bounds (60–150 kW). In production mode (when sufficient historical data is available), an XGBoost model with time-series cross-validation is used. Forecast results are displayed with confidence intervals.

### Wind Power Forecasting
Uses a physics-based turbine power curve — not a statistical model. Converts wind speed forecasts to expected power output using a cubic relationship between cut-in (3 m/s) and rated speed (12 m/s), applies an air-density temperature correction, and scales for the installed turbine fleet (3 × 30 kW = 90 kW total). A performance factor can be calibrated from historical turbine output.

### AI Recommendations
Generates operational recommendations from a rule-based engine that analyses the current system state, forecasts, and optimization results. Categories include: battery charging during wind peaks, generator start/stop decisions, load shifting, fuel-saving opportunities, weather impact mitigation, and equipment maintenance. Each recommendation explains the reasoning, shows supporting data, and estimates expected impact. Users can accept, dismiss, or mark recommendations as applied.

### Energy Optimization
Runs a **Mixed-Integer Linear Programming (MILP)** problem using the PuLP library with CBC solver. Minimises total diesel fuel cost and battery degradation cost over a 24-hour horizon, subject to: power balance at each time step, generator on/off binary constraints with minimum load (20 kW), battery SOC bounds (20–90%), reserve margin (10%), and a hard zero-load-shedding constraint for critical loads. Outputs an hourly dispatch schedule showing wind, diesel, battery charge/discharge, and generator status.

### Battery Monitoring
Displays state of charge (%), charge/discharge power (kW), temperature (°C), and estimated efficiency (adjusted for cold weather). The system models temperature-dependent battery derating: −10 °C → 98% efficiency; −20 °C → 92%; below −20 °C → 85%. Battery health and recent events are shown in the Station Visualization page.

### Generator Monitoring
Tracks up to three diesel generators. Each generator has a status (running / standby / offline), power output (kW), cumulative runtime (hours), and efficiency (%). The system models a minimum load threshold of 20 kW and warns when generators operate below optimal range or above 85% capacity.

### Alert System
An automated rule-based alert engine evaluates 17 distinct alert conditions every simulation cycle. Alerts are categorised by severity (critical / warning / info) and affected component, and each alert includes a recommended action. The full alert center provides filtering by severity and component, status tracking (unread / read / acknowledged / resolved), and a daily energy report with system health scoring.

### Emergency & Failure Detection Center
A dedicated page for simulating equipment failure scenarios (generator failure, battery failure, wind drop, load spike, renewable failure, communication failure). Steps through a multi-stage response sequence: failure detection → impact analysis → AI decision → control action → recovery. Tracks critical load protection status (Life Support, Communications, Scientific Equipment, Habitation) throughout.

### Simulation Center
A comprehensive 3-view simulator (Setup / Comparison / History). Accepts scenario presets or fully custom inputs, runs both AI-optimised and baseline rule-based dispatch, compares results side by side, and saves all runs to browser localStorage history. Detailed documentation in [Section 6](#6-simulation-center).

### Analytics
Time-series analysis over selectable periods (today / 7 days / 30 days). Charts include: daily energy consumption, renewable vs. diesel split, battery SOC trend (min/avg/max), fuel consumption AI vs. baseline, renewable share over time, generator runtime, and a baseline vs. AI comparison table.

### Settings
User profile management, password change, notification preferences (critical alerts, recommendations, system updates, email), system preferences (refresh interval, timezone, temperature unit), and data management (export, clear history).

---

## 3. Complete System Workflow

```
User Opens Browser
       │
       ▼
  Landing Page ──→ Login Page ──→ Protected App Layout
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
             Data Mode Context      Navigation Sidebar     Toast Notifications
           (Live API / Mock)        (All 12 routes)        (Sonner library)
                    │
        ┌───────────┴───────────────────────────┐
        │                                       │
        ▼                                       ▼
  FRONTEND (React + Vite)              BACKEND (FastAPI)
        │                                       │
   Pages call service layer              REST API v1 endpoints
   (axios HTTP or mock fallback)         (auth, dashboard, weather,
        │                                 forecasts, recommendations,
        ▼                                 alerts, ai, simulation)
  api/simulation.service.ts                     │
  api/index.ts (dashboardService, etc.)         │
        │                                       ▼
        │                              Services Layer
        │                         ┌─────────────────────┐
        │                         │  ai_pipeline.py      │ ←── AIPipeline
        │                         │  scenario_engine.py  │     class
        │                         │  alert_engine.py     │
        │                         │  data_simulator.py   │
        │                         │  simulation_service  │
        │                         └─────────────────────┘
        │                                  │
        │                    ┌─────────────┼──────────────┐
        │                    ▼             ▼              ▼
        │           AI Module (./ai/)   SQLite DB    WebSocket /ws
        │        ┌──────────────────┐  (polar_ems.db)   │
        │        │ LoadForecaster   │                    │
        │        │ WindForecaster   │                    │
        │        │ EnergyOptimizer  │   ←── PuLP / CBC  │
        │        │ Recommendation-  │                    │
        │        │   Engine         │                    │
        │        │ AnomalyDetector  │                    │
        │        └──────────────────┘                    │
        │                                                │
        └─────────────── WebSocket Updates ←─────────────┘
                     (system_update, alert, recommendation)
```

### Data Flow for Simulation Run

```
User configures scenario (or selects preset)
         │
         ▼
Frontend validates inputs (SOC bounds, load > 0, wind ≥ 0, etc.)
         │
         ▼
POST /api/v1/simulation/simulate  ──→  ScenarioEngine.simulate_scenario()
         │
         ▼
ScenarioConfig validated (temperature −60 to +20, wind 0–40, duration 1–168h)
         │
         ▼
_generate_timeline()  →  hourly time steps with:
    • Load (base pattern + sinusoidal variation + load spike events)
    • Wind speed (sinusoidal variation + wind drop events)
    • Wind power (turbine power curve with air-density correction)
    • Generator availability (with failure events)
         │
         ▼
_simulate_timestep() × N hours
    • AI mode:  wind-first dispatch → battery → diesel (MILP logic)
    • Baseline: always-on generator dispatch (rule-based)
         │
         ▼
AlertEngine.evaluate_simulation_step() per timestep
    • 17 alert rules evaluated
    • Alerts collected with severity, component, recommended action
         │
         ▼
_generate_recommendations()  →  rule-based analysis of timeline
         │
         ▼
_calculate_summary()  →  totals: energy, renewable, diesel, fuel, alerts
         │
         ▼
Response returned to frontend
         │
         ▼
simulationStorage.saveSimulation()  →  browser localStorage (up to 50 runs)
         │
         ▼
Auto-comparison: AI result vs. Baseline result side by side
```

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          POLAR-EMS Architecture                         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend  (Port 5173 / 3000)                │   │
│  │   React 18 + TypeScript + Vite                                  │   │
│  │   TailwindCSS + Framer Motion + Recharts                        │   │
│  │   Zustand (state) │ React Router v6 (routing) │ Axios (HTTP)   │   │
│  │   Sonner (toasts) │ Lucide React (icons)                        │   │
│  │                                                                  │   │
│  │   14 Pages  │  Components  │  Hooks  │  Services  │  Stores     │   │
│  └─────────────────────┬──────────────────────────────┬────────────┘   │
│                        │ HTTP REST                    │ WebSocket /ws   │
│                        ▼                              ▼                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Backend  (Port 8000)                         │   │
│  │   FastAPI + Uvicorn + SQLAlchemy + Pydantic                     │   │
│  │   CORS Middleware │ JWT Auth │ WebSocket Connection Manager     │   │
│  │                                                                  │   │
│  │   API v1 Routers:                                                │   │
│  │   /auth  /dashboard  /weather  /forecasts                       │   │
│  │   /recommendations  /alerts  /ai  /simulation                   │   │
│  │                                                                  │   │
│  │   Services:                                                      │   │
│  │   AIPipeline │ ScenarioEngine │ AlertEngine                     │   │
│  │   DataSimulator │ SimulationService                              │   │
│  └─────────────────────┬──────────────────────────────┬────────────┘   │
│                        │                              │                 │
│            ┌───────────┴────────┐          ┌──────────┴──────────┐     │
│            ▼                    ▼          ▼                      ▼     │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │    AI Module     │  │   SQLite DB  │  │   Docker Services        │ │
│  │   (Port 8001)    │  │ polar_ems.db │  │   Redis (cache/realtime) │ │
│  │                  │  │              │  │   AI Service (8001)      │ │
│  │  LoadForecaster  │  │  Tables:     │  │   Frontend (3000)        │ │
│  │  (XGBoost)       │  │  • users     │  │   Backend (8000)         │ │
│  │                  │  │  • alerts    │  └──────────────────────────┘ │
│  │  WindForecaster  │  │  • energy    │                                │
│  │  (Power Curve)   │  │  • station   │                                │
│  │                  │  │  • ai        │                                │
│  │  EnergyOptimizer │  └──────────────┘                                │
│  │  (MILP/PuLP-CBC) │                                                  │
│  │                  │                                                   │
│  │  Recommendation  │                                                   │
│  │  Engine (Rules)  │                                                   │
│  │                  │                                                   │
│  │  AnomalyDetector │                                                   │
│  │  (IsolationForest│                                                   │
│  │   + Rule-based)  │                                                   │
│  └──────────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Mode

The frontend uses a `DataModeContext` that can switch between:

- **Live API Mode** — calls the FastAPI backend REST endpoints
- **Mock / Demo Mode** — uses locally generated mock data (all pages have inline fallback mock data so the UI is always functional even without the backend)

Both backends run a `DataSimulator` that generates realistic synthetic polar station data — meaning the system is fully demonstrable without physical hardware.

---

## 5. All Portals / Pages

### Route Map

| Route | Page | Purpose |
|---|---|---|
| `/` | Landing Page | Public introduction and system overview |
| `/login` | Login Page | User authentication |
| `/dashboard` | Dashboard | Mission control — main KPI overview |
| `/weather` | Weather Page | Environmental monitoring and forecast |
| `/forecasts` | Forecasts Page | AI load and wind power predictions |
| `/recommendations` | Recommendations | AI operational recommendations |
| `/optimization` | Optimization | MILP dispatch schedule and what-if |
| `/alerts` | Alerts | Alert center and daily energy reports |
| `/emergency` | Emergency | Failure detection and response simulation |
| `/analytics` | Analytics | Historical KPI analysis and baseline comparison |
| `/station` | Station Viz | Interactive component visualization |
| `/simulation` | Simulation Center | Full scenario simulation engine |
| `/settings` | Settings | User and system preferences |

---

### Landing Page (`/`)

#### Purpose
The public-facing entry point. Introduces the system to new visitors before they log in.

#### What It Shows
- Live demo status panel: system status indicator, renewable generation, battery SOC, current load, temperature, critical load status
- 5-step workflow diagram: Observe → Predict → Recommend → Optimize → Protect
- Feature highlight cards: Energy Monitoring, AI Forecasting, Smart Optimization, Alert System, Station Visualization, Simulation Center
- System statistics: uptime, active alerts, renewable share, protected loads
- Call-to-action buttons: Enter Dashboard, View Demo

#### How It Works
All data on the landing page is clearly marked as simulated demo data. Values are hardcoded to representative polar station readings. No API calls are made from this page.

---

### Login Page (`/login`)

#### Purpose
User authentication entry point.

#### What It Shows
- POLAR-EMS branding with polar theme
- Email/password input fields
- Login button with loading state

#### How It Works
The frontend has an `auth.py` API router (`/api/v1/auth`). The `ProtectedRoute` component in `App.tsx` currently has authentication set to `true` as a placeholder, meaning all routes are accessible in the current development build.

---

### Dashboard (`/dashboard`)

#### Purpose
Mission Control. The primary operational view — a one-screen summary of the entire energy system state.

#### What It Shows
- **Top KPI Cards** (6 cards):
  - Current Load (kW)
  - Renewable Power (kW)
  - Battery SOC (%)
  - Diesel Output (kW)
  - Renewable Share (%)
  - Fuel Consumption Rate (L/h)
- **Energy Flow Panel**: visual breakdown of wind-to-load, wind-to-battery, diesel-to-load, battery-to-load flows (kW)
- **24-Hour Energy Chart**: area chart of load, wind, diesel, and battery over the last 24 hours (Recharts AreaChart)
- **Battery SOC Chart**: 24-hour SOC trend
- **Generator Status Panel**: three generator cards (Generator #1, #2, #3) each showing status, power output, runtime hours, and efficiency. Users can toggle generator status (online/normal/offline) interactively
- **Critical Load Panel**: 4 priority-ordered critical loads (Life Support, Communications, Scientific Equipment, Habitation) with power draw and protection status
- **Active Alerts**: top 3 unresolved alerts with severity badges
- **AI Recommendation Card**: latest recommendation with title, reasoning, suggested action, and confidence score
- **Data Mode Indicator**: shows whether data is live (API) or mock

#### What Users Can Do
- Toggle generator status (online / offline)
- View the energy flow breakdown
- Read the current AI recommendation
- Click "Refresh" to pull fresh data
- See relative timestamps on alerts

#### APIs / Services
- `GET /api/v1/dashboard/summary` (via `dashboardService`)
- Falls back to inline mock data if API is unavailable

---

### Weather Page (`/weather`)

#### Purpose
Environmental intelligence — weather conditions and their energy generation implications.

#### What It Shows
- **Current Conditions** (stat cards):
  - Temperature (°C), Wind Speed (m/s), Wind Direction (compass), Atmospheric Pressure (hPa), Humidity (%), Cloud Cover (%), Visibility (km)
- **48-Hour Weather Forecast Chart**: temperature and wind speed curves (Recharts ComposedChart)
- **Wind Power Generation Forecast**: 48-hour predicted wind power output derived from the weather forecast using the turbine power curve
- **Weather Risk Assessment Panel**: categorises conditions as normal / warning / critical across wind, temperature, precipitation, and visibility factors
- **Station Conditions Summary**: current weather condition label, data source, and simulation flag

#### How It Works
Weather data is generated by `DataSimulator.generate_weather_data()`. It uses:
- A seasonal temperature model: `−35 + 15·sin(2π·DOY/365)` with daily ±5 °C variation and Gaussian noise
- A persistence wind model: `0.7 × prev_speed + 0.3 × base + noise`
- Condition classification: storm (wind > 20 m/s), extreme cold (temp < −40 °C), cloudy (cloud > 80%), otherwise clear

The wind-power forecast on this page uses a preview calculation derived from the same cubic power curve formula used by the WindForecaster module.

#### APIs / Services
- `GET /api/v1/weather/current`
- `GET /api/v1/weather/forecast`

---

### Forecasts Page (`/forecasts`)

#### Purpose
AI-powered energy demand and wind power prediction — the forward-looking intelligence layer.

#### What It Shows
- **Forecast Horizon Toggle**: 24h or 48h
- **Load Forecast Chart**: historical actuals (last 12 h) + predicted load with ±8 kW confidence bands (Recharts ComposedChart with ReferenceLine separating history from forecast)
- **Wind Power Forecast Chart**: same structure — historical + forecast + confidence bands
- **Forecast Accuracy Metrics** (4 stat cards):
  - Load MAE (Mean Absolute Error)
  - Load MAPE (Mean Absolute Percentage Error)
  - Wind MAE
  - Wind R² Score
- **AI Insights Panel**: automatically generated insights from the forecast data (e.g., "Peak load expected at 18:00", "Wind drop expected at hour 32")
- **Model Status Badges**: shows whether the load forecaster is in simulation or trained mode

#### How It Works

**Load Forecasting:**  
In simulation mode, synthetic load is generated with a sinusoidal daily pattern, temperature heating correction, and bounded random variation. Historical (last 12 h) and forecast (next 12–48 h) portions are joined into a single chart dataset.

**Wind Forecasting:**  
Uses the `WindForecaster` physics-based power curve: `P = P_rated × ((v − v_cut_in) / (v_rated − v_cut_in))³` scaled by the temperature air-density correction factor `1 + (15 − T) × 0.002`.

**Production Mode (when trained):**  
The `LoadForecaster` XGBoost model uses these engineered features: `hour`, `day_of_week`, `day_of_year`, `month`, `is_weekend`, cyclical encodings (`hour_sin/cos`, `day_sin/cos`), lagged load (1 h, 24 h, 168 h), rolling 24-h mean and std, temperature and wind speed plus their squares and lags. Training requires ≥1,000 samples and uses TimeSeriesSplit cross-validation.

#### APIs / Services
- `GET /api/v1/forecasts/load`
- `GET /api/v1/forecasts/wind`
- `GET /api/v1/ai/model-status`

---

### Recommendations Page (`/recommendations`)

#### Purpose
AI Recommendation Center — a feed of actionable operational suggestions with explainable reasoning.

#### What It Shows
- **Recommendation Cards** (expandable):
  - Category badge (Fuel Optimization, Battery, Renewable Energy, Generator, Critical Load, Weather, Maintenance, Emergency)
  - Priority badge (Critical / High / Medium / Low)
  - Title and recommendation text
  - Reasoning (why the AI suggests this)
  - Expected impact
  - Related data points (e.g., Wind Peak: 95 kW — Good, Battery SOC: 72% — Good)
  - AI Factors table: each factor, its current value, and its weight in the decision
  - Status: New / Accepted / Dismissed / Applied
  - Timestamp
- **Summary Stats**: total recommendations, breakdown by priority

#### What Users Can Do
- Expand / collapse any recommendation card
- Accept, Dismiss, or mark as Applied
- Filter by priority or category
- Toast confirmations on each action

#### How It Works
The `RecommendationEngine` analyses five categories:
1. **Fuel savings**: checks upcoming wind vs. current diesel status
2. **Battery management**: checks SOC vs. charging opportunities
3. **Load shifting**: identifies deferrable load shifting windows
4. **Weather impacts**: flags cold weather and wind resource changes
5. **Maintenance needs**: triggered by historical data patterns (if available)

Recommendations are labelled `ai_model: 'rule_based_with_optimization'` — this is transparently documented; no pre-trained neural network is claimed.

#### APIs / Services
- `GET /api/v1/recommendations/`
- `GET /api/v1/ai/recommendations`

---

### Optimization Page (`/optimization`)

#### Purpose
Displays the AI-generated energy dispatch schedule and the reasoning behind it.

#### What It Shows
- **Optimization Inputs Panel**: Forecasted load array, forecasted wind array, battery SOC, generator availability (Gen 1, 2, 3 toggles), critical load requirement, reserve requirement
- **Run Optimization Button**: triggers the MILP solve
- **24-Hour Dispatch Schedule Table / Chart**: hourly breakdown of load, wind, battery charge/discharge, generator output, reserve margin, and recommended action per hour
- **AI Decision Summary**:
  - Generator decisions (e.g., "Run Gen 1 during hours 0–6, shut off at 7:00")
  - Battery decisions (e.g., "Charge during wind peak 12:00–15:00")
  - Load shifting decisions
  - Renewable utilization summary
- **Why This Schedule**: plain-language explanation of the optimization rationale
- **AI vs. Rule-Based Comparison**:
  - Rule-Based: fuel consumed, renewable share, unmet load
  - AI-Optimized: same metrics
  - Improvement calculation

#### How It Works
The MILP problem (`EnergyOptimizer`) formulates:
- **Decision variables**: `gen_power[t]` (continuous), `gen_status[t]` (binary), `gen_startup[t]` (binary), `battery_charge[t]`, `battery_discharge[t]`, `battery_soc[t]`, `load_shed[t]`
- **Objective**: minimise `Σ(gen_power[t] × fuel_rate × diesel_cost + (charge[t] + discharge[t]) × degradation_cost + load_shed[t] × 1000)`
- **Constraints**: power balance, generator min/max load, battery SOC bounds (20–90%), reserve margin (10%), no load shedding (`load_shed[t] = 0` forced)
- **Solver**: PULP_CBC_CMD (open-source CBC solver via PuLP)

#### APIs / Services
- `POST /api/v1/ai/optimize`
- `GET /api/v1/forecasts/load`
- `GET /api/v1/forecasts/wind`

---

### Alerts Page (`/alerts`)

#### Purpose
Smart Alert Center — centralized view of all system alerts, their history, and daily energy reports.

#### What It Shows
- **Alert Summary Bar**: total alerts, critical count, warning count, info count
- **Alert Feed** (filterable): each alert card shows:
  - Severity badge (Critical / Warning / Info) with colour coding (red / amber / blue)
  - Alert type icon (Battery, Fuel, Wind, Shield, Activity, Cloud, etc.)
  - Title and description
  - Affected component
  - Recommended action
  - Timestamp (relative)
  - Status badge (Unread / Read / Acknowledged / Resolved)
  - Action buttons: Mark Read, Acknowledge, Resolve, Dismiss
- **Filter Controls**: by severity (All / Critical / Warning / Info), by status (All / Unread / Acknowledged / Resolved), by component
- **Daily Energy Reports Section**: date-stamped daily summaries including:
  - Energy consumed (kWh)
  - Renewable contribution (kWh)
  - Diesel consumption (kWh)
  - Fuel saved vs. baseline (L)
  - Battery activity (charged, discharged, cycles)
  - Critical load events count
  - Major alert counts
  - AI recommendations acted on
  - System health score (Excellent / Good / Fair / Poor)
  - Narrative summary

#### What Users Can Do
- Filter and search alerts
- Acknowledge and resolve individual alerts
- Download daily reports
- View the narrative energy summary for each day

#### Alert Types Implemented

| Type | Component |
|---|---|
| `low_battery` | Battery |
| `high_diesel` | Diesel Generator |
| `low_wind` | Renewable System |
| `renewable_shortage` | Renewable System |
| `critical_load_risk` | Critical Loads |
| `generator_failure` | Diesel Generator |
| `battery_failure` | Battery |
| `sensor_issue` | Sensors |
| `weather_risk` | All Systems |
| `forecast_anomaly` | AI Forecasting |

#### APIs / Services
- `GET /api/v1/alerts/`
- `POST /api/v1/alerts/{id}/acknowledge`
- `POST /api/v1/alerts/{id}/resolve`

---

### Emergency Page (`/emergency`)

#### Purpose
Failure Detection & Response Center — simulates equipment failure scenarios and demonstrates the AI's multi-stage emergency response pipeline.

#### What It Shows
- **Scenario Selector**: 6 failure types
  - Generator Failure
  - Battery Failure
  - Wind Drop
  - Load Increase
  - Renewable Failure
  - Communication Failure
- **Scenario Details Panel**: failing component, energy impact, critical load risk, expected recovery time
- **Critical Load Protection Panel**: 4 priority-ordered loads (Life Support → Communications → Scientific Equipment → Habitation) each showing current status: Protected / At Risk / Shed
- **Response Sequence Stages**: animated progression through:
  1. Failure Detection
  2. Impact Analysis
  3. AI Decision
  4. Control Action
  5. Recovery
- **AI Response Card**: what the AI determines to do (battery response, backup generator response, load management response)
- **Event Log**: timestamped feed of all events during the simulated response with severity colour coding
- **System Metrics**: current generation capacity, battery reserve, load served, estimated recovery time

#### What Users Can Do
- Select any failure scenario
- Press "Trigger Failure" to start the simulation
- Watch the stage-by-stage response animation
- Read the AI decision rationale
- Reset to idle state

#### How It Works
The Emergency Page is a frontend-only simulation. The response stages advance on a timer, and the AI response text is scenario-specific. The underlying logic mirrors the real `AlertEngine.evaluate_conditions()` rules, but the full emergency response sequence is rendered as a UI walkthrough rather than a live backend call.

---

### Analytics Page (`/analytics`)

#### Purpose
Historical energy performance analysis with date filtering and baseline vs. AI comparison.

#### What It Shows
- **Date Range Filter**: Today / 7 Days / 30 Days / Custom
- **KPI Summary Row** (4 cards):
  - Total Energy Consumed (kWh)
  - Average Renewable Share (%)
  - Total Fuel Consumed (L)
  - Generator Runtime (hours)
- **6 Analytics Charts** (Recharts, all with legend and tooltips):
  1. Daily Energy Consumption (bar chart — total kWh per day)
  2. Renewable vs. Diesel Energy (stacked bar — kWh per day)
  3. Battery SOC Trend (area chart — min/avg/max per day)
  4. Fuel Consumption: Baseline vs. AI (line chart — litres per day)
  5. Renewable Share Over Time (area chart — % per day)
  6. Generator Runtime (bar chart — hours per day)
- **Baseline vs. AI Comparison Table**: side-by-side metrics table with improvement % for:
  - Fuel Consumed
  - Renewable Share
  - Generator Runtime
  - Fuel Efficiency
  - Battery Utilization
  - CO₂ Saved (estimated)
- **Export Button**: downloads report (UI interaction; export format is a toast confirmation in current implementation)

#### APIs / Services
- `GET /api/v1/dashboard/analytics` (with date range query params)

---

### Station Visualization Page (`/station`)

#### Purpose
Interactive component-level view of the polar station energy system.

#### What It Shows
- **Component Grid**: 7 system components as interactive cards:
  - Wind Turbine System (3 × 30 kW)
  - Diesel Generators (3 × 60 kW)
  - Battery System (200 kWh)
  - Research Lab Load
  - Habitation Load
  - Communications Load
  - Critical Systems
- **Each Component Card**:
  - Status badge (Online / Warning / Offline)
  - Power output (kW)
  - Health percentage (%)
  - Description
  - Recent events list
  - Alert count badge
- **Component Detail Panel** (appears on selection):
  - Full event log
  - AI Recommendation specific to this component
  - Action buttons (Inspect, Acknowledge Alerts)
- **Energy Flow Summary**: total generation, total load, surplus/deficit
- **System Health Overview**: composite health score and breakdown

#### What Users Can Do
- Click any component to see its detail panel
- Read component-specific AI recommendations
- Acknowledge component alerts
- View real-time status of each energy source and load

#### APIs / Services
- `GET /api/v1/dashboard/station`

---

### Settings Page (`/settings`)

#### Purpose
Application and user preferences — all interactions are fully functional with validation and feedback toasts.

#### What It Shows
Four settings sections, each with a Save button:

1. **Profile Settings**
   - Full name (editable text field)
   - Email address (editable text field)
   - Save with 900ms simulated async save

2. **Security**
   - Current password (with show/hide toggle)
   - New password (minimum 6 characters validation)
   - Confirm password (must match validation)
   - Update with 1000ms simulated async save

3. **Notifications**
   - Critical Alerts toggle (default: ON)
   - AI Recommendations toggle (default: ON)
   - System Updates toggle (default: ON)
   - Email Notifications toggle (default: OFF)

4. **System Settings**
   - Data refresh interval (dropdown: 30s, 1 min, 5 min, 10 min)
   - Timezone (dropdown: UTC variants)
   - Temperature unit (dropdown: Celsius / Fahrenheit)
   - Data Management: Export Data button, Clear History button

---

## 6. Simulation Center

The Simulation Center (`/simulation`) is the most sophisticated feature of POLAR-EMS. It provides a structured, 3-step interface for defining, executing, and analysing polar microgrid scenarios.

### Three Views

The header contains a tab switcher:

| Tab | Purpose |
|---|---|
| **Setup** | Define and run a scenario |
| **Comparison** | AI vs. Baseline side-by-side results |
| **History** | All previously saved simulation runs |

---

### Step 1 — Define Scenario

#### Predefined Scenario Presets (6 presets)

Clicking a preset card loads its configuration from the backend (`POST /api/v1/simulation/scenarios/predefined`) or falls back to default values with a name patch:

| Preset | Backend Scenario Type | Key Conditions |
|---|---|---|
| Normal Ops | `normal_operation` | −18 °C, 12 m/s wind, 60% SOC |
| Low Wind | `renewable_drop` | 14 m/s initial, wind drops to 20% at hour 10 |
| Extreme Cold | `extreme_cold` | −40 °C, 15 m/s wind, 85% battery efficiency |
| High Load | `normal_operation` + patch | Base load × 1.5, research × 1.5, habitation × 1.4 |
| Gen Fault | `generator_failure` | Gen #1 fails at hour 4 |
| Battery Low | `normal_operation` + patch | Battery SOC patched to 18% |

#### Custom Input Controls

After a preset loads, all values are individually adjustable via slider fields:

**Environment Inputs:**
- Temperature (−60 °C to +20 °C)
- Wind Speed (0–40 m/s) — shows warning if < 3 m/s (below cut-in, zero wind power)
- Weather Condition (dropdown)
- Polar Season (dropdown)
- Duration (1–168 hours)

**Load Inputs:**
- Total Load slider → automatically splits into ratios:
  - Base Load: 40%
  - Research Load: 20%
  - Habitation Load: 15%
  - Communication Load: 5%
  - Critical Load: 12%
  - Deferrable Load: 8%
- Critical Load % slider (independently adjustable)

**Battery Inputs:**
- Initial SOC (0–100%) — error if outside range
- Capacity (kWh)
- Max Charge Rate (kW)
- Max Discharge Rate (kW)

**Generator Inputs:**
- Generator Capacity (kW)
- Minimum Load (kW)
- Fuel Rate (L/kWh)

**Advanced Settings** (collapsed by default):
- Enable Generator Failure (toggle + hour + which generator)
- Enable Load Spike (toggle + hour + multiplier)
- Enable Wind Drop (toggle + hour + multiplier)
- Enable AI Optimization (toggle)

#### Inline Validation

Before each run the frontend validates:
- `battery_soc_percent` ∈ [0, 100] — **error**
- `critical_load_kw` ≤ total load — **error**
- `wind_speed_ms` ≥ 0 — **error**
- total load > 0 — **error**
- `generator_capacity_kw` > 0 — **error**
- wind < 3 m/s — **warning** (turbine cut-in not reached)
- temperature < −35 °C — **warning** (battery thermal derating applies)

Errors block execution; warnings show but allow the run to proceed.

---

### Step 2 — Run Simulation

Clicking **Run Simulation** triggers a 6-step progress animation:

1. Scenario loaded
2. Conditions analysed
3. Running energy simulation
4. Generating AI recommendation
5. Evaluating alerts
6. Calculating results

The frontend calls `POST /api/v1/simulation/simulate`. If the API call fails (e.g., backend offline), a local fallback engine (`generateDefaultSimulationData()`) generates representative results so the UI never breaks.

After the simulation completes, the frontend immediately triggers a second call (`POST /api/v1/simulation/compare`) to get the AI vs. Baseline comparison. If this also fails, the comparison is constructed locally from the two result sets.

Every completed simulation is automatically saved to browser `localStorage` via `simulationStorage.saveSimulation()` (up to 50 runs, oldest purged automatically).

---

### Step 2 — Results Display

Once a simulation completes, the right panel shows:

#### System Status Banner
- **HEALTHY & STABLE** (emerald) — no alerts
- **WARNING DETECTED** (amber) — has warning alerts
- **CRITICAL ALERT** (rose) — has critical alerts

#### 4 Key Metric Cards
- Total Energy Consumed (kWh)
- Average Renewable Share (%)
- Total Fuel Used (L)
- Critical Loads Protected (always TRUE by design)

#### Energy Timeline Chart (toggle on/off)
Area chart showing Load (kW), Wind Generation (kW), Diesel Generation (kW), Battery Charge/Discharge (kW) over all simulated hours. Uses Recharts AreaChart with semi-transparent fills.

#### Alert Summary
Top 5 unique alerts (deduplicated by type, prioritised by severity) with:
- Severity badge (Critical / Warning / Info)
- Title
- Occurrence count (e.g., "×12" if the same condition fired 12 times)

#### AI Recommendation Card
First recommendation from `_generate_recommendations()`:
- Priority, type
- Title, description
- Reasoning bullets
- Estimated fuel savings (litres)

---

### What-If Analysis

Because scenario configuration is fully editable and each run is independent, What-If analysis works naturally:
1. Run a baseline scenario (e.g., Normal Ops)
2. Change one parameter (e.g., reduce battery SOC to 20%)
3. Run again and compare results
4. Both runs appear in History with their full configuration and results

The `duplicateSimulation(id)` method in `simulationStorage` creates a configuration-only copy of any past run for re-running with tweaks.

---

### Baseline vs. AI Comparison (Comparison Tab)

The Comparison tab shows the result of running the same scenario configuration in two modes simultaneously:

| Metric | AI-Optimized | Rule-Based Baseline |
|---|---|---|
| Total Fuel (L) | Lower | Higher |
| Renewable Share (%) | Higher | Lower |
| Generator Runtime | Shorter | Longer |

The comparison also lists:
- **AI Advantages**: e.g., "Predictive battery pre-charging during wind peaks", "Sub-zero thermal degradation mitigation", "Optimal multi-genset load sharing", "Zero critical load shedding"
- **Baseline Characteristics**: e.g., "Fixed threshold generator triggering", "No weather forecast integration", "Reactive battery discharge"

**AI Mode dispatch logic** (smarter):
- If wind ≥ load: run on wind only, charge battery with surplus
- Else if wind + battery_max_discharge ≥ load: cover deficit from battery, no diesel
- Else: bring in diesel for the remainder (above battery contribution)

**Baseline Mode dispatch logic** (rule-based):
- Always run generator at max(min_load, load − wind)
- Use battery reactively for excess/deficit balancing

---

### Simulation History (History Tab)

Displays all simulations saved in localStorage (up to 50). Each entry shows:
- Simulation name (scenario name + timestamp)
- Scenario type badge
- Run timestamp
- Alert severity summary (critical/warning/info counts)
- Expand button to view full results
- Delete button

Filter by alert severity: All / Normal / Warning / Critical.

The history persists across browser sessions (localStorage) and survives page refreshes. Clearing history from the Settings page removes all saved runs.

---

### Backend: ScenarioConfig Validation Rules

| Parameter | Valid Range | Error Message |
|---|---|---|
| `temperature_c` | −60 to +20 | Temperature must be between −60°C and 20°C |
| `wind_speed_ms` | 0 to 40 | Wind speed must be between 0 and 40 m/s |
| total load | 10 to 500 kW | Total load must be between 10 and 500 kW |
| `battery_current_soc_percent` | 0 to 100 | Battery SOC must be between 0 and 100% |
| `battery_min_soc_percent` | < `battery_max_soc_percent` | Min SOC must be less than max SOC |
| `duration_hours` | 1 to 168 | Duration must be between 1 and 168 hours |

### Simulation API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/simulation/scenarios/predefined` | Get predefined scenario config |
| `POST` | `/api/v1/simulation/simulate` | Run full simulation (AI mode) |
| `POST` | `/api/v1/simulation/compare` | Run AI + Baseline and return comparison |

---

## 7. AI / ML

POLAR-EMS contains four distinct AI/ML components. Each is clearly documented for what it actually does.

---

### Component 1 — Load Forecaster (`ai/forecasting/load_forecaster.py`)

**Model:** XGBoost (`xgboost.XGBRegressor`)  
**Framework:** scikit-learn pipeline + XGBoost + StandardScaler  
**Status in current deployment:** Simulation mode (synthetic data). Production mode requires training with ≥1,000 historical samples.

**Features engineered:**
- Time: `hour`, `day_of_week`, `day_of_year`, `month`, `is_weekend`
- Cyclical encoding: `hour_sin`, `hour_cos`, `day_sin`, `day_cos`
- Lagged load: `load_lag_1h`, `load_lag_24h`, `load_lag_168h`
- Rolling statistics: `load_ma_24h`, `load_std_24h`
- Weather: `temperature_c`, `temp_squared`, `temp_lag_1h`, `wind_speed_ms`, `wind_squared`

**Training:**
- Uses `TimeSeriesSplit` cross-validation (5 folds)
- Trained via `LoadForecaster.train(data, target_col='load_kw')`
- Reports MAPE and RMSE on training data with explicit note: _"Metrics on training data, validation metrics may differ"_
- Model and scaler saved via `joblib`

**Simulation mode:**  
Generates synthetic load with: base load (100 kW) × time factor (0.90–1.15) + temperature heating effect + ±10% random variation, bounded to [60, 150] kW. Confidence intervals widen from ±5 kW at hour 1 to ±15 kW at the horizon.

**Output:** `predicted_load_kw`, `lower_bound`, `upper_bound`, `confidence_percent`

---

### Component 2 — Wind Power Forecaster (`ai/forecasting/wind_forecaster.py`)

**Model type:** Physics-based power curve — **not a trained ML model**  
**Status:** Always active (same in simulation and production)

**Power curve formula:**
```
P = 0                                         if v < 3 m/s or v > 25 m/s
P = P_rated × ((v − 3) / (rated_speed − 3))³  if 3 ≤ v < 12 m/s
P = P_rated                                   if v ≥ 12 m/s
```

**Air density temperature correction:**
```
correction = 1 + (15 − T_ambient) × 0.002
```
(colder air is denser; this increases power output slightly)

**Fleet scaling:**  
Output is multiplied by turbine count (3 turbines × 30 kW rated each = 90 kW fleet)

**Performance factor:**  
An optional calibration factor (default 1.0) can be updated from historical actual vs. predicted output data if historical performance data is available (≥100 samples).

**Output:** `predicted_power_kw`, `lower_bound`, `upper_bound` per hour

---

### Component 3 — Energy Optimizer (`ai/optimization/energy_optimizer.py`)

**Method:** Mixed-Integer Linear Programming (MILP)  
**Solver:** PuLP CBC (COIN-BC open-source solver)  
**Objective:** Minimise total operating cost over a 24-hour horizon

**Decision variables:**

| Variable | Type | Description |
|---|---|---|
| `gen_power[t]` | Continuous [0, gen_capacity] | Generator power output at hour t |
| `gen_status[t]` | Binary {0,1} | Generator on/off at hour t |
| `gen_startup[t]` | Binary {0,1} | Generator startup event at hour t |
| `battery_charge[t]` | Continuous [0, max_charge] | Battery charge rate at hour t |
| `battery_discharge[t]` | Continuous [0, max_discharge] | Battery discharge rate at hour t |
| `battery_soc[t]` | Continuous [soc_min, soc_max] | Battery state of charge at hour t |
| `load_shed[t]` | Continuous [0, ∞] | Unserved load at hour t |

**Objective function:**
```
minimise Σ_t [
    gen_power[t] × fuel_rate × diesel_cost_per_litre
  + (battery_charge[t] + battery_discharge[t]) × degradation_cost
  + load_shed[t] × 1000    ← large penalty to force zero shedding
]
```

**Hard constraints:**
- Power balance: `gen_power[t] + wind[t] + battery_discharge[t] = load[t] + battery_charge[t] + load_shed[t]`
- Generator minimum load: `gen_power[t] ≥ min_load × gen_status[t]`
- Generator capacity: `gen_power[t] ≤ capacity × gen_status[t]`
- Battery SOC dynamics: `soc[t] = soc[t-1] + (charge[t]×η − discharge[t]/η) / capacity × 100`
- Reserve margin: `gen_capacity × gen_status[t] + wind[t] + discharge[t] ≥ load[t] × 1.10`
- No load shedding: `load_shed[t] = 0` (forced hard constraint)

---

### Component 4 — Recommendation Engine (`ai/recommendations/recommendation_engine.py`)

**Type:** Rule-based reasoning engine — **not a trained ML model**  
This is clearly and honestly declared in the codebase (`ai_model: 'rule_based_with_optimization'`).

**Five analysis categories:**

1. **Fuel savings** — checks upcoming wind forecast; if wind is increasing and generator is currently running, recommends deferring startup
2. **Battery management** — checks SOC vs. charging window (high wind approaching → pre-charge); checks low SOC vs. wind availability
3. **Load shifting** — identifies deferrable loads that can be moved to high-renewable windows
4. **Weather impacts** — flags extreme cold warnings, battery thermal derating risks, storm preparation needs
5. **Maintenance** — analyses historical data for anomalous patterns (if historical DataFrame is provided)

**Output structure per recommendation:**
```python
{
  'category': 'battery',
  'priority': 'high',         # critical / high / medium / low
  'title': str,
  'description': str,
  'reasoning': [str, ...],
  'estimated_fuel_savings_liters': float,  # estimate, not guaranteed
  'savings_note': 'Estimated savings based on optimization model, actual savings may vary',
  'confidence_note': 'Based on simulated data',  # or 'actual forecasts'
  'ai_model': 'rule_based_with_optimization',
  'mode': 'simulation',
  'generated_at': ISO8601 timestamp
}
```

---

### Component 5 — Anomaly Detector (`ai/failure_detection/anomaly_detector.py`)

**Methods used:**
1. **Rule-based** (fast, always active): threshold checks — generator output vs. expected, battery SOC drop rate, wind turbine output vs. wind speed
2. **Statistical** (when ≥100 historical samples available): `sklearn.ensemble.IsolationForest` (contamination=0.05, random_state=42) — detects multivariate statistical outliers in the energy system data
3. **Pattern-based**: checks for specific failure signatures (e.g., generator output drop with load unchanged)

**Detected anomaly types:** generator failure, battery issues, wind turbine problems, sensor malfunctions, load anomalies

---

### AI Honesty Policy

The codebase explicitly enforces truthful AI reporting throughout:
- Simulation-mode metrics are always labelled `mode: 'simulation'` and `note: 'Using synthetic data for demonstration'`
- No accuracy numbers are fabricated — metrics are only reported from actual model training or explicitly labelled as estimated
- The recommendation engine is always described as `rule_based_with_optimization`, not as a neural network
- Fuel savings are always accompanied by `savings_note: 'Estimated savings based on optimization model, actual savings may vary'`
- The `get_model_status()` endpoint returns a `disclaimer` field on every response

---

## 8. Alert System

### Alert Engine (`backend/app/services/alert_engine.py`)

The `AlertEngine` class maintains 17 alert rules, each defined as an `AlertRule` object with:
- `rule_id` — unique identifier
- `rule_type` — category
- `severity` — `critical` / `warning` / `info`
- `title` — human-readable title
- `message_template` — Python format string populated with live values
- `condition_fn` — lambda that evaluates the system state dict
- `affected_component` — which subsystem is affected
- `recommended_action` — concrete operator action

### All 17 Alert Rules

| Rule ID | Severity | Condition | Recommended Action |
|---|---|---|---|
| `battery_critical_low` | **Critical** | Battery SOC < 15% | Immediately charge battery or activate backup generation |
| `battery_low` | Warning | Battery SOC 15–25% | Begin battery charging to restore reserve |
| `battery_high_discharge` | Warning | Discharge rate > 80% of max | Monitor and prepare backup generation |
| `battery_cold` | Warning | Battery temp < −20 °C | Enable battery heating system |
| `generator_failure` | **Critical** | Available generators < total count | Activate backup, prioritise critical loads, investigate |
| `generator_overload` | Warning | Generator output > 85% of capacity | Prepare backup or reduce non-critical loads |
| `generator_inefficient` | Info | Generator running < 1.5 × min load | Consider battery-only operation |
| `renewable_very_low` | Warning | Renewable share < 20% | Increase fuel reserves, optimise diesel |
| `wind_turbine_limit` | Info | Wind output ≥ 95% of rated capacity | Charge battery or shift deferrable loads |
| `load_spike` | Warning | Load increase > 30% vs. previous step | Verify all critical systems, prepare generation |
| `load_near_capacity` | **Critical** | Load > 90% of total generation capacity | Shed non-critical loads immediately |
| `reserve_margin_low` | Warning | Reserve margin < 10% | Activate standby generation or reduce load |
| `extreme_cold` | Warning | Temperature < −35 °C | Monitor equipment, increase heating allowance, check battery thermal |
| `high_winds` | Info | Wind speed > 15 m/s | Maximise renewable utilisation, charge battery |
| `storm_conditions` | Warning | Weather = Snow Storm / Blizzard / Severe Wind | Prepare for equipment issues, ensure fuel reserves |
| `high_fuel_consumption` | Warning | Fuel consumption > 15 L/step | Investigate high diesel usage |
| `critical_load_risk` | **Critical** | Total generation < critical load requirement | IMMEDIATE ACTION: shed all non-critical loads |

### Alert Evaluation Process

```python
AlertEngine.evaluate_conditions(system_state, config)
```

1. Merges `system_state` and optional `config` dicts
2. Uses a `SafeDict` (missing keys return `0.0`) to safely evaluate lambdas
3. Evaluates each rule's `condition_fn(data)` — any exception is caught and logged
4. For each triggered rule, formats the `message_template` with actual values
5. Constructs alert dict with `alert_id = f"{rule_id}_{timestamp}"`
6. Returns list of all triggered alerts for the current state

For simulation, `evaluate_simulation_step()` also computes:
- `load_increase_percent` vs. previous step
- `available_capacity_kw` (diesel + wind + battery)
- `reserve_margin_percent` = `(total_gen − load) / load × 100`

### Alert Statistics

`AlertEngine.get_alert_statistics(alerts)` returns:
- `total_alerts`, `critical_count`, `warning_count`, `info_count`
- `alerts_by_type` dict
- `alerts_by_component` dict

### Frontend Alert Display

The Alerts Page shows alerts with:
- Colour-coded severity borders (rose = critical, amber = warning, blue = info)
- Status workflow: Unread → Read → Acknowledged → Resolved
- Component-specific icons (Battery, Fuel, Wind, Shield, Activity, Cloud, Server)
- Timestamp shown as relative time ("2 minutes ago")

---

## 9. Analytics

### KPIs Tracked

| KPI | Definition | Where Displayed |
|---|---|---|
| **Current Load (kW)** | Instantaneous total electricity demand | Dashboard, Station |
| **Renewable Power (kW)** | Current wind turbine output | Dashboard, Station |
| **Battery SOC (%)** | Current battery state of charge | Dashboard, Station, Analytics |
| **Diesel Output (kW)** | Current generator power output | Dashboard, Station |
| **Renewable Share (%)** | `wind_kW / (wind_kW + diesel_kW) × 100` | Dashboard, Analytics, Simulation |
| **Fuel Consumption Rate (L/h)** | `diesel_kW × fuel_rate_L_per_kWh` | Dashboard, Analytics |
| **Total Energy Consumed (kWh)** | Sum of hourly load over period | Analytics, Simulation |
| **Total Renewable Generated (kWh)** | Sum of hourly wind output over period | Analytics, Simulation |
| **Total Diesel Generated (kWh)** | Sum of hourly diesel output over period | Analytics, Simulation |
| **Total Fuel Consumed (L)** | Sum of hourly fuel consumption | Analytics, Simulation |
| **Average Battery SOC (%)** | Mean SOC over period | Analytics |
| **Min/Max Battery SOC (%)** | Daily SOC bounds | Analytics |
| **Generator Runtime (hours)** | Hours generator was online | Analytics |
| **Critical Loads Protected** | Always TRUE (hard constraint) | Simulation, Emergency |
| **Reserve Margin (%)** | `(generation − load) / load × 100` | Alert Engine |
| **AI vs. Baseline Fuel Savings (L)** | `baseline_fuel − ai_fuel` | Analytics, Simulation Comparison |
| **AI vs. Baseline Renewable Increase (%)** | `ai_renewable_share − baseline_renewable_share` | Simulation Comparison |

### Baseline vs. AI Comparison (Analytics Page)

The Analytics page constructs a comparison table across these dimensions:

| Metric | Baseline | AI Optimized | Improvement |
|---|---|---|---|
| Fuel Consumed | Higher | Lower | `(baseline − ai) / baseline × 100`% |
| Renewable Share | Lower | Higher | `ai − baseline` percentage points |
| Generator Runtime | Longer | Shorter | hours saved |
| Fuel Efficiency | Lower | Higher | L/kWh improvement |
| Battery Utilization | Reactive | Proactive | qualitative |
| CO₂ Saved | — | Estimated | based on fuel reduction |

> **Note:** Analytics page data in the current deployment uses 30 days of mock daily data. A production deployment would read from the `polar_ems.db` SQLite database via the `/api/v1/dashboard/analytics` endpoint.

---

## 10. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | 18.2 | UI component model and rendering |
| **Language (Frontend)** | TypeScript | 5.3 | Type-safe frontend development |
| **Build Tool** | Vite | 5.0 | Fast dev server and production bundler |
| **Routing** | React Router | 6.21 | Client-side navigation (14 routes) |
| **State Management** | Zustand | 4.4 | Lightweight global state store |
| **Styling** | TailwindCSS | 3.4 | Utility-first CSS |
| **Animations** | Framer Motion | 10.18 | Page transitions and micro-animations |
| **Charts** | Recharts | 2.10 | All data visualisation (area, bar, line, composed charts) |
| **Icons** | Lucide React | 0.307 | Icon system |
| **HTTP Client** | Axios | 1.6 | REST API calls to backend |
| **Toasts** | Sonner | 1.3 | Notification toasts |
| **Date Utilities** | date-fns | 3.0 | Date formatting and relative time |
| **Backend Framework** | FastAPI | 0.109 | High-performance async REST API |
| **ASGI Server** | Uvicorn | 0.27 | FastAPI runtime server |
| **ORM** | SQLAlchemy | 2.0 | Database models and sessions |
| **Database Migrations** | Alembic | 1.13 | Schema migration management |
| **Database** | SQLite | — | Embedded relational database (`polar_ems.db`) |
| **Validation** | Pydantic | 2.5 | Request/response schema validation |
| **Authentication** | python-jose + passlib | 3.3 / 1.7 | JWT tokens + bcrypt password hashing |
| **Data Processing** | Pandas | 2.2 | Time-series data manipulation |
| **Numerical Computing** | NumPy | 1.26 | Array operations and simulation math |
| **ML — Load Forecasting** | XGBoost | 2.0 | Gradient boosted tree load forecaster |
| **ML — Feature Prep** | scikit-learn | 1.4 | StandardScaler, TimeSeriesSplit, IsolationForest |
| **Model Persistence** | joblib | 1.3 | Save/load trained XGBoost models |
| **Optimization Solver** | PuLP + CBC | 2.7 | MILP energy dispatch solver |
| **WebSocket** | FastAPI WebSocket + websockets | — | Real-time system update broadcasting |
| **Async HTTP** | httpx + aiohttp | 0.26 / 3.9 | Async HTTP client for external APIs |
| **Cache / Realtime** | Redis | 7 (Docker) | Optional caching and real-time queuing |
| **Containerisation** | Docker + Docker Compose | 3.8 | Multi-service container orchestration |
| **Testing** | pytest + pytest-asyncio | 7.4 / 0.23 | Backend test suite |
| **Code Quality** | black + flake8 + mypy | — | Formatting, linting, type checking |
| **Environment Config** | python-dotenv + pydantic-settings | — | `.env`-based configuration |

---

## 11. Project Structure

```text
POLAR-EMS/
│
├── README.md                          ← This file
├── docker-compose.yml                 ← Multi-service Docker orchestration
├── .env.example                       ← Environment variable template
├── .gitignore
├── package.json                       ← Root workspace package
│
├── frontend/                          ← React + TypeScript + Vite application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile
│   ├── .env / .env.example
│   └── src/
│       ├── main.tsx                   ← React entry point
│       ├── App.tsx                    ← Router + layout composition
│       │
│       ├── pages/                     ← 14 page components
│       │   ├── LandingPage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── WeatherPage.tsx
│       │   ├── ForecastsPage.tsx
│       │   ├── RecommendationsPage.tsx
│       │   ├── OptimizationPage.tsx
│       │   ├── AlertsPage.tsx
│       │   ├── EmergencyPage.tsx
│       │   ├── AnalyticsPage.tsx
│       │   ├── StationPage.tsx
│       │   ├── SimulationCenterPage.tsx  ← Largest: 1,370 lines
│       │   ├── SettingsPage.tsx
│       │   └── NotFoundPage.tsx
│       │
│       ├── components/
│       │   ├── Charts/
│       │   ├── Common/
│       │   ├── Dashboard/
│       │   ├── Layout/
│       │   ├── demo/
│       │   ├── navigation/
│       │   ├── simulation/
│       │   │   └── ScenarioInputPanel.tsx
│       │   └── ui/
│       │       ├── Badge.tsx
│       │       ├── Card.tsx
│       │       ├── DataModeIndicator.tsx
│       │       ├── KPICard.tsx
│       │       ├── LoadingSpinner.tsx
│       │       └── StatusIndicator.tsx
│       │
│       ├── services/
│       │   ├── api.js                 ← Base axios instance
│       │   ├── websocket.js           ← WebSocket client
│       │   ├── simulationStorage.service.ts  ← LocalStorage simulation history
│       │   └── api/
│       │       ├── simulation.service.ts     ← Simulation API calls + types
│       │       └── index.ts                  ← All other API service exports
│       │
│       ├── contexts/
│       │   └── DataModeContext.tsx    ← Live vs. Mock data mode toggle
│       │
│       ├── hooks/
│       │   └── useAPI.ts              ← Generic API fetch hook
│       │
│       ├── layouts/
│       │   └── AppLayout.tsx          ← Sidebar + header shell
│       │
│       ├── stores/                    ← Zustand stores
│       ├── types/                     ← TypeScript type definitions
│       ├── utils/
│       │   ├── cn.ts                  ← TailwindCSS class merge
│       │   └── format.ts              ← Number/date/unit formatters
│       ├── styles/
│       ├── config/
│       ├── animations/
│       ├── charts/
│       └── lib/
│
├── backend/                           ← FastAPI application
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── polar_ems.db                   ← SQLite database file
│   └── app/
│       ├── main.py                    ← FastAPI app, CORS, WebSocket, startup
│       ├── core/
│       │   ├── config.py              ← Settings (Pydantic BaseSettings)
│       │   ├── database.py            ← SQLAlchemy engine + session
│       │   └── security.py            ← JWT auth + bcrypt
│       │
│       ├── api/
│       │   └── v1/
│       │       ├── __init__.py
│       │       ├── auth.py            ← POST /api/v1/auth/*
│       │       ├── dashboard.py       ← GET /api/v1/dashboard/*
│       │       ├── weather.py         ← GET /api/v1/weather/*
│       │       ├── forecasts.py       ← GET /api/v1/forecasts/*
│       │       ├── recommendations.py ← GET /api/v1/recommendations/*
│       │       ├── alerts.py          ← GET/POST /api/v1/alerts/*
│       │       ├── ai.py              ← GET/POST /api/v1/ai/*
│       │       └── simulation.py      ← POST /api/v1/simulation/*
│       │
│       ├── models/                    ← SQLAlchemy ORM models
│       │   ├── user.py
│       │   ├── alert.py
│       │   ├── energy.py
│       │   ├── station.py
│       │   └── ai.py
│       │
│       ├── schemas/                   ← Pydantic request/response schemas
│       │
│       └── services/
│           ├── ai_pipeline.py         ← AIPipeline: orchestrates all AI components
│           ├── scenario_engine.py     ← ScenarioEngine: simulation execution
│           ├── alert_engine.py        ← AlertEngine: 17 rule-based alert conditions
│           ├── data_simulator.py      ← DataSimulator: synthetic polar data generator
│           └── simulation_service.py  ← SimulationService: async continuous simulation
│
├── ai/                                ← Standalone AI/ML module
│   ├── __init__.py
│   ├── requirements.txt
│   │
│   ├── forecasting/
│   │   ├── load_forecaster.py         ← XGBoost load demand forecaster
│   │   └── wind_forecaster.py         ← Physics-based wind power forecaster
│   │
│   ├── optimization/
│   │   └── energy_optimizer.py        ← MILP energy dispatch optimizer (PuLP/CBC)
│   │
│   ├── recommendations/
│   │   └── recommendation_engine.py   ← Rule-based recommendation engine
│   │
│   ├── failure_detection/
│   │   └── anomaly_detector.py        ← IsolationForest + rule-based anomaly detector
│   │
│   ├── models/                        ← Saved model files (.pkl, .json)
│   └── utils/                         ← Shared utilities
│
├── config/                            ← External configuration files
├── data/                              ← Data directory (mounted by Docker)
├── docs/                              ← Additional documentation
├── scripts/                           ← Utility scripts
└── tests/                             ← Test suite
```

---

## 12. Quick Start

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- pip

### Run Frontend

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

### Run Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
# Runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Run with Docker Compose

```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# AI:       http://localhost:8001
```

### Environment Variables

Copy `.env.example` to `.env` in both root and `frontend/`:

```env
# Backend key settings
SIMULATION_MODE=true          # Use synthetic data (default: true)
DATABASE_URL=sqlite:///./polar_ems.db
SECRET_KEY=change-in-production
DEBUG=true

# Frontend key settings
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

> **Note:** With `SIMULATION_MODE=true` (the default), the system generates all data synthetically. No external APIs, weather services, or physical hardware are required.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| SQLite as database | Zero-configuration embedded database appropriate for single-station deployment |
| Simulation Mode default | Allows full system demonstration without hardware; easily switched to production |
| Physics-based wind model | More robust than a trained model when historical data is limited |
| MILP for optimization | Guarantees mathematical optimality; interpretable constraints; no training data needed |
| Rule-based recommendations | Transparent, explainable, and correct without requiring large training datasets |
| LocalStorage for simulation history | Zero backend dependency for the Simulation Center; persists across sessions |
| Frontend mock fallback | Every page remains functional even if the backend is offline |
| Honest AI labelling | All AI components explicitly declare their actual type (rule-based, physics, simulation) |

---

*POLAR-EMS v1.0.0 — AI-Driven Smart Energy Management for Polar Research Stations*
