# POLAR-EMS API Documentation

## Document Information

| Field | Value |
|-------|--------|
| **Document Title** | POLAR-EMS API Documentation |
| **Version** | 1.0 |
| **Date** | August 23, 2026 |
| **Project** | AI-Driven Smart Energy Management System for Polar Research Stations |
| **Domain** | Polar Smart Grid Energy Management |
| **Organization** | MoES – NCPOR |
| **Related Documents** | [PRD.md](./PRD.md), [SRS.md](./SRS.md), [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md) |

---

## 1. API Overview

### 1.1 Base Information
- **Base URL**: `https://api.polar-ems.example.com/api/v1`
- **Protocol**: HTTPS (TLS 1.2+)
- **Architecture**: RESTful API
- **Data Format**: JSON
- **Authentication**: JWT Bearer Token
- **Rate Limiting**: 1000 requests per hour per user
- **API Version**: v1

### 1.2 API Design Principles
- **RESTful Design**: Standard HTTP methods and resource-based URLs
- **Consistent Response Format**: Standardized success/error responses
- **Stateless**: Each request contains all necessary information
- **Idempotent Operations**: Safe retry behavior for non-mutating operations
- **Comprehensive Error Handling**: Detailed error messages with actionable guidance

### 1.3 Content Types
- **Request Content-Type**: `application/json`
- **Response Content-Type**: `application/json`
- **File Upload**: `multipart/form-data`
- **WebSocket**: `application/json` over WebSocket protocol

### 1.4 Authentication Overview
All API endpoints (except authentication) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 2. Authentication

### 2.1 User Authentication

#### POST /auth/login
Authenticate user and receive JWT access token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 14400,
    "user": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "alex_engineer",
      "email": "alex@antarctic-research.org",
      "role": "engineer",
      "station_id": "ANTARCTIC_BASE_01"
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
```json
// 401 Unauthorized - Invalid credentials
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
}

// 423 Locked - Account locked
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account locked due to too many failed attempts. Try again in 15 minutes."
  }
}
```

#### POST /auth/logout
Invalidate current JWT token.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET /auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "alex_engineer",
    "email": "alex@antarctic-research.org",
    "role": "engineer",
    "station_id": "ANTARCTIC_BASE_01",
    "last_login": "2026-08-23T14:30:00Z",
    "permissions": ["read", "write", "control"]
  }
}
```

---

## 3. Dashboard API

### 3.1 System Status

#### GET /dashboard/system-status
Get current system status overview for the dashboard.

**Query Parameters:**
- `include_details` (boolean, optional): Include detailed equipment status

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-08-23T14:30:00Z",
    "power_balance": {
      "total_generation": 85.5,
      "total_consumption": 78.2,
      "net_battery": 7.3,
      "diesel_generation": 45.2,
      "wind_generation": 32.8,
      "solar_generation": 7.5
    },
    "load_breakdown": {
      "critical_load": 35.4,
      "normal_load": 28.7,
      "deferrable_load": 14.1
    },
    "battery_status": {
      "soc": 78.5,
      "temperature": 32.1,
      "health": 94.2,
      "power": 7.3,
      "status": "charging"
    },
    "fuel_status": {
      "consumption_rate": 12.8,
      "daily_consumed": 287.5,
      "estimated_remaining": 892.3,
      "days_remaining": 4.2
    },
    "performance_metrics": {
      "renewable_percentage": 51.4,
      "system_efficiency": 89.2,
      "fuel_efficiency": 3.52
    },
    "alerts_summary": {
      "critical": 0,
      "warning": 2,
      "info": 5
    },
    "system_health": "normal"
  }
}
```

#### GET /dashboard/energy-flow
Get energy flow data for visualization.

**Query Parameters:**
- `hours` (integer, optional, default: 24): Hours of historical data
- `resolution` (string, optional, default: "5min"): Data resolution (1min, 5min, 15min, 1hour)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "time_series": [
      {
        "timestamp": "2026-08-23T14:30:00Z",
        "diesel_generation": 45.2,
        "wind_generation": 32.8,
        "solar_generation": 7.5,
        "battery_power": 7.3,
        "total_load": 78.2,
        "critical_load": 35.4,
        "normal_load": 28.7,
        "deferrable_load": 14.1
      }
    ],
    "summary": {
      "period_start": "2026-08-22T14:30:00Z",
      "period_end": "2026-08-23T14:30:00Z",
      "total_points": 288,
      "avg_generation": 82.1,
      "avg_consumption": 76.8,
      "renewable_share": 49.2
    }
  }
}
```
---

## 4. Weather API

### 4.1 Current Weather

#### GET /weather/current
Get current weather conditions.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-08-23T14:30:00Z",
    "temperature": -28.5,
    "wind_speed": 22.3,
    "wind_direction": 285,
    "pressure": 995.2,
    "humidity": 68,
    "visibility": 15.2,
    "weather_condition": "partly_cloudy",
    "precipitation_rate": 0.0,
    "data_source": "local_station",
    "data_quality": 0.95
  }
}
```

#### GET /weather/forecast
Get weather forecast data.

**Query Parameters:**
- `hours` (integer, optional, default: 48): Forecast horizon in hours
- `include_confidence` (boolean, optional): Include confidence intervals

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "forecast": [
      {
        "timestamp": "2026-08-23T15:00:00Z",
        "temperature": -28.3,
        "wind_speed": 24.1,
        "wind_direction": 290,
        "pressure": 994.8,
        "humidity": 70,
        "weather_condition": "cloudy",
        "confidence": 0.85
      }
    ],
    "forecast_info": {
      "generated_at": "2026-08-23T14:15:00Z",
      "model_version": "ECMWF_v2.1",
      "horizon_hours": 48,
      "update_frequency": "6_hours"
    }
  }
}
```

### 4.2 Historical Weather

#### GET /weather/history
Get historical weather data.

**Query Parameters:**
- `start_date` (string, required): Start date (ISO 8601 format)
- `end_date` (string, required): End date (ISO 8601 format)
- `resolution` (string, optional, default: "1hour"): Data resolution

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "weather_history": [
      {
        "timestamp": "2026-08-22T14:00:00Z",
        "temperature": -25.2,
        "wind_speed": 18.7,
        "wind_direction": 275,
        "pressure": 998.1,
        "humidity": 65
      }
    ],
    "summary": {
      "period_start": "2026-08-22T00:00:00Z",
      "period_end": "2026-08-23T00:00:00Z",
      "avg_temperature": -27.3,
      "max_wind_speed": 31.2,
      "min_visibility": 8.4
    }
  }
}
```

---

## 5. Load Forecasting API

### 5.1 Load Predictions

#### GET /forecast/load
Get electricity load forecasts.

**Query Parameters:**
- `horizon_hours` (integer, optional, default: 48): Forecast horizon
- `include_breakdown` (boolean, optional): Include load category breakdown

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "forecasts": [
      {
        "timestamp": "2026-08-23T15:00:00Z",
        "predicted_load": 82.4,
        "confidence_lower": 76.8,
        "confidence_upper": 88.1,
        "load_breakdown": {
          "critical_load": 36.2,
          "normal_load": 30.1,
          "deferrable_load": 16.1
        }
      }
    ],
    "model_info": {
      "model_type": "XGBoost",
      "model_version": "v2.1.3",
      "last_trained": "2026-08-22T08:00:00Z",
      "features_used": [
        "temperature", "wind_speed", "hour", "day_of_week", 
        "historical_load", "scheduled_activities"
      ]
    },
    "accuracy_metrics": {
      "mape_24h": 8.7,
      "rmse_24h": 4.2,
      "accuracy_7day": 87.3
    }
  }
}
```

#### POST /forecast/load/retrain
Trigger retraining of load forecasting model.

**Request Body:**
```json
{
  "training_days": 90,
  "include_weather": true,
  "hyperparameter_tuning": true
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "training_job_id": "train_123456",
    "estimated_completion": "2026-08-23T16:30:00Z",
    "status": "queued"
  },
  "message": "Model retraining initiated"
}
```

### 5.2 Forecast Accuracy

#### GET /forecast/accuracy
Get forecast accuracy metrics and performance analysis.

**Query Parameters:**
- `forecast_type` (string, required): Type of forecast (load, wind, solar)
- `days` (integer, optional, default: 7): Analysis period in days

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accuracy_summary": {
      "forecast_type": "load",
      "analysis_period_days": 7,
      "total_predictions": 336,
      "mape": 8.7,
      "rmse": 4.2,
      "mae": 3.1,
      "accuracy_percentage": 87.3
    },
    "horizon_accuracy": [
      {"horizon_hours": 1, "accuracy": 96.8},
      {"horizon_hours": 6, "accuracy": 92.1},
      {"horizon_hours": 12, "accuracy": 89.5},
      {"horizon_hours": 24, "accuracy": 87.3},
      {"horizon_hours": 48, "accuracy": 82.1}
    ],
    "recent_performance": [
      {
        "date": "2026-08-22",
        "predictions": 48,
        "accuracy": 89.2
      }
    ]
  }
}
```

---

## 6. Wind Forecasting API

### 6.1 Wind Power Predictions

#### GET /forecast/wind
Get wind power generation forecasts.

**Query Parameters:**
- `horizon_hours` (integer, optional, default: 48): Forecast horizon
- `include_weather` (boolean, optional): Include weather correlation

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "wind_power_forecasts": [
      {
        "timestamp": "2026-08-23T15:00:00Z",
        "predicted_power": 28.7,
        "confidence_lower": 24.2,
        "confidence_upper": 33.1,
        "weather_inputs": {
          "wind_speed": 18.5,
          "wind_direction": 285,
          "temperature": -28.3,
          "pressure": 994.8
        },
        "turbine_availability": 0.95
      }
    ],
    "turbine_info": [
      {
        "turbine_id": "WIND_001",
        "rated_capacity": 50.0,
        "availability": 0.95,
        "current_status": "operational"
      }
    ],
    "forecast_summary": {
      "total_capacity": 100.0,
      "avg_predicted_output": 26.3,
      "capacity_factor": 26.3,
      "weather_correlation": 0.87
    }
  }
}
```

---

## 7. AI Recommendations API

### 7.1 Current Recommendations

#### GET /ai/recommendations
Get active AI-generated recommendations.

**Query Parameters:**
- `status` (string, optional): Filter by status (pending, accepted, rejected)
- `type` (string, optional): Filter by recommendation type
- `limit` (integer, optional, default: 10): Maximum results

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "recommendation_id": "rec_123456",
        "type": "fuel_saving",
        "priority": 8,
        "title": "Optimize Battery Charging Schedule",
        "description": "Charge battery to 90% during predicted high wind period (16:00-20:00) to reduce diesel consumption overnight.",
        "reasoning": "Weather forecast shows sustained winds of 25+ mph for next 4 hours. Current battery SOC at 65%. Optimization model predicts 18L fuel savings.",
        "impact_estimate": {
          "fuel_saved_liters": 18.0,
          "cost_savings_usd": 72.0,
          "co2_reduction_kg": 47.2,
          "implementation_effort": "automatic",
          "risk_level": "low"
        },
        "confidence_score": 0.87,
        "status": "pending",
        "created_at": "2026-08-23T14:15:00Z",
        "expires_at": "2026-08-23T20:00:00Z"
      }
    ],
    "summary": {
      "total_recommendations": 3,
      "pending": 2,
      "accepted": 1,
      "total_potential_savings": 145.0
    }
  }
}
```

#### POST /ai/recommendations/{recommendation_id}/respond
Respond to an AI recommendation (accept/reject/request_info).

**Path Parameters:**
- `recommendation_id` (string): Recommendation identifier

**Request Body:**
```json
{
  "response": "accepted",
  "feedback": "Good analysis, implementing immediately",
  "implementation_notes": "Will monitor battery temperature during charging"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recommendation_id": "rec_123456",
    "status": "accepted",
    "implemented_at": "2026-08-23T14:45:00Z"
  },
  "message": "Recommendation response recorded"
}
```

### 7.2 Recommendation Explanation

#### GET /ai/recommendations/{recommendation_id}/explain
Get detailed explanation for a specific recommendation.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recommendation_id": "rec_123456",
    "explanation": {
      "decision_factors": [
        {
          "factor": "weather_forecast",
          "description": "High wind period predicted",
          "weight": 0.35,
          "confidence": 0.85
        },
        {
          "factor": "battery_state",
          "description": "Current SOC allows for charging",
          "weight": 0.25,
          "confidence": 0.95
        },
        {
          "factor": "fuel_efficiency",
          "description": "Diesel generator efficiency curve",
          "weight": 0.40,
          "confidence": 0.90
        }
      ],
      "alternatives_considered": [
        {
          "alternative": "immediate_charging",
          "reason_rejected": "Less optimal timing, 12% lower savings"
        },
        {
          "alternative": "no_action",
          "reason_rejected": "Misses opportunity for fuel savings"
        }
      ],
      "model_inputs": {
        "current_soc": 65.0,
        "wind_forecast_6h": [18, 22, 25, 27, 24, 20],
        "load_forecast_6h": [78, 76, 74, 72, 75, 78],
        "fuel_price": 4.0
      }
    }
  }
}
```

---

## 8. Optimization API

### 8.1 Energy Optimization

#### POST /optimization/run
Execute energy dispatch optimization.

**Request Body:**
```json
{
  "horizon_hours": 24,
  "objective": "minimize_fuel_cost",
  "constraints": {
    "reserve_margin": 0.10,
    "battery_soc_min": 0.20,
    "battery_soc_max": 0.95,
    "critical_load_protection": true
  },
  "scenario_overrides": {
    "wind_forecast_adjustment": 0.9,
    "load_forecast_adjustment": 1.05
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "optimization_id": "opt_789012",
    "status": "optimal",
    "objective_value": 342.50,
    "solve_time_ms": 1847,
    "schedule": {
      "generators": [
        {
          "generator_id": "GEN_001",
          "schedule": [
            {
              "hour": 0,
              "power_output": 45.2,
              "status": "running",
              "fuel_consumption": 12.8
            }
          ]
        }
      ],
      "batteries": [
        {
          "battery_id": "BATT_001",
          "schedule": [
            {
              "hour": 0,
              "charge_power": 8.5,
              "discharge_power": 0.0,
              "soc": 67.2
            }
          ]
        }
      ],
      "load_management": [
        {
          "hour": 0,
          "deferrable_load_reduction": 0.0,
          "load_shedding": 0.0
        }
      ]
    },
    "performance_summary": {
      "total_fuel_consumption": 287.5,
      "fuel_savings_vs_baseline": 18.2,
      "renewable_utilization": 52.3,
      "unmet_load": 0.0
    }
  }
}
```

#### GET /optimization/{optimization_id}
Get optimization results by ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "optimization_id": "opt_789012",
    "created_at": "2026-08-23T14:30:00Z",
    "status": "optimal",
    "objective_value": 342.50,
    "schedule": {
      // Same as POST response
    }
  }
}
```

---

## 9. Battery Management API

### 9.1 Battery Status

#### GET /equipment/batteries
Get all battery systems status.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "batteries": [
      {
        "battery_id": "BATT_001",
        "timestamp": "2026-08-23T14:30:00Z",
        "status": "charging",
        "soc": 78.5,
        "voltage": 487.2,
        "current": 15.8,
        "temperature": 32.1,
        "health_percentage": 94.2,
        "cycle_count": 1247,
        "capacity_kwh": 500.0,
        "max_charge_rate": 50.0,
        "max_discharge_rate": 75.0,
        "efficiency": {
          "charge_efficiency": 0.95,
          "discharge_efficiency": 0.93
        }
      }
    ],
    "system_summary": {
      "total_capacity": 500.0,
      "total_energy_stored": 392.5,
      "avg_soc": 78.5,
      "avg_health": 94.2,
      "total_charging_power": 15.8,
      "estimated_runtime_hours": 5.2
    }
  }
}
```

#### POST /equipment/batteries/{battery_id}/control
Control battery charging/discharging.

**Path Parameters:**
- `battery_id` (string): Battery system identifier

**Request Body:**
```json
{
  "action": "set_charge_rate",
  "parameters": {
    "charge_rate_kw": 25.0,
    "target_soc": 85.0,
    "max_temperature": 40.0
  },
  "safety_override": false,
  "reason": "Optimization schedule implementation"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "control_id": "ctrl_456789",
    "battery_id": "BATT_001",
    "action": "set_charge_rate",
    "status": "executed",
    "timestamp": "2026-08-23T14:45:00Z",
    "estimated_completion": "2026-08-23T16:30:00Z"
  },
  "message": "Battery control command executed successfully"
}
```
---

## 10. Generator Management API

### 10.1 Generator Status

#### GET /equipment/generators
Get all generator systems status.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "generators": [
      {
        "generator_id": "GEN_001",
        "timestamp": "2026-08-23T14:30:00Z",
        "status": "running",
        "power_output": 45.2,
        "rated_capacity": 75.0,
        "load_percentage": 60.3,
        "fuel_flow_rate": 12.8,
        "efficiency": 0.354,
        "engine_parameters": {
          "temperature": 82.5,
          "rpm": 1800,
          "oil_pressure": 45.2,
          "coolant_temperature": 78.3
        },
        "operating_hours": 1456.7,
        "maintenance_due_hours": 1500.0,
        "fuel_level": 892.3,
        "estimated_runtime_hours": 69.7
      }
    ],
    "system_summary": {
      "total_capacity": 150.0,
      "total_output": 45.2,
      "active_generators": 1,
      "avg_efficiency": 0.354,
      "total_fuel_consumption": 12.8
    }
  }
}
```

#### POST /equipment/generators/{generator_id}/control
Control generator operation.

**Path Parameters:**
- `generator_id` (string): Generator identifier

**Request Body:**
```json
{
  "action": "start",
  "parameters": {
    "target_power_kw": 50.0,
    "ramp_rate_kw_min": 10.0,
    "priority": "normal"
  },
  "safety_checks": true,
  "reason": "Load increase detected, additional generation required"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "control_id": "ctrl_789012",
    "generator_id": "GEN_001",
    "action": "start",
    "status": "executing",
    "estimated_completion": "2026-08-23T14:32:00Z",
    "safety_checks_passed": true
  },
  "message": "Generator start sequence initiated"
}
```

### 10.2 Generator Maintenance

#### GET /equipment/generators/{generator_id}/maintenance
Get generator maintenance information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "generator_id": "GEN_001",
    "maintenance_status": {
      "next_service_hours": 1500.0,
      "current_hours": 1456.7,
      "hours_remaining": 43.3,
      "service_type": "routine_maintenance",
      "estimated_downtime_hours": 4.0
    },
    "maintenance_history": [
      {
        "date": "2026-07-15",
        "type": "routine_maintenance",
        "duration_hours": 3.5,
        "technician": "maintenance_team_alpha",
        "notes": "Oil change, filter replacement, general inspection"
      }
    ],
    "predictive_indicators": {
      "oil_quality": 0.85,
      "filter_condition": 0.72,
      "engine_health": 0.91,
      "predicted_failure_risk": 0.08
    }
  }
}
```

---

## 11. Alert Management API

### 11.1 Active Alerts

#### GET /alerts
Get current active alerts.

**Query Parameters:**
- `severity` (string, optional): Filter by severity (info, warning, critical)
- `resolved` (boolean, optional, default: false): Include resolved alerts
- `limit` (integer, optional, default: 50): Maximum results
- `offset` (integer, optional, default: 0): Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "alert_id": "alert_123456",
        "alert_type": "equipment_failure",
        "severity": "warning",
        "title": "Generator GEN_001 High Temperature",
        "message": "Engine temperature 95°C approaching warning threshold of 98°C",
        "equipment_id": "GEN_001",
        "data_snapshot": {
          "temperature": 95.2,
          "power_output": 45.2,
          "fuel_flow": 12.8,
          "timestamp": "2026-08-23T14:30:00Z"
        },
        "created_at": "2026-08-23T14:30:00Z",
        "acknowledged": false,
        "resolved": false,
        "recommended_actions": [
          "Monitor generator temperature closely",
          "Check cooling system operation",
          "Consider reducing load if temperature continues rising"
        ]
      }
    ],
    "pagination": {
      "total": 7,
      "limit": 50,
      "offset": 0,
      "has_more": false
    },
    "summary": {
      "critical": 0,
      "warning": 2,
      "info": 5,
      "unacknowledged": 3
    }
  }
}
```

#### POST /alerts/{alert_id}/acknowledge
Acknowledge an alert.

**Path Parameters:**
- `alert_id` (string): Alert identifier

**Request Body:**
```json
{
  "acknowledgment_note": "Reviewed temperature readings, monitoring situation"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "alert_id": "alert_123456",
    "acknowledged": true,
    "acknowledged_at": "2026-08-23T14:35:00Z",
    "acknowledged_by": "alex_engineer"
  },
  "message": "Alert acknowledged successfully"
}
```

### 11.2 Alert Configuration

#### GET /alerts/rules
Get alert configuration rules.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "alert_rules": [
      {
        "rule_id": "generator_temp_warning",
        "name": "Generator High Temperature Warning",
        "condition": "generator_temperature > 95",
        "severity": "warning",
        "enabled": true,
        "threshold_values": {
          "warning_temp": 95.0,
          "critical_temp": 98.0
        },
        "notification_methods": ["dashboard", "email"],
        "escalation_minutes": 15
      }
    ]
  }
}
```

---

## 12. Failure Detection API

### 12.1 Failure Events

#### GET /failures/events
Get failure events and system responses.

**Query Parameters:**
- `hours` (integer, optional, default: 24): Hours of history to include
- `severity` (string, optional): Filter by severity
- `resolved` (boolean, optional): Filter by resolution status

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "failure_events": [
      {
        "event_id": "fail_345678",
        "equipment_id": "GEN_002",
        "failure_type": "mechanical_failure",
        "severity": "high",
        "detected_at": "2026-08-23T12:15:00Z",
        "detected_by": "automatic",
        "description": "Generator vibration levels exceeded normal range, automatic shutdown initiated",
        "system_impact": "50kW generation capacity lost, backup systems activated",
        "ai_response": {
          "detection_confidence": 0.94,
          "response_time_seconds": 15,
          "actions_taken": [
            "Emergency generator shutdown",
            "Battery discharge activation", 
            "Backup generator start sequence",
            "Non-critical load shedding (5kW)"
          ]
        },
        "recovery_status": {
          "status": "recovering",
          "estimated_repair_time": "4-6 hours",
          "backup_systems_active": true,
          "critical_loads_protected": true
        },
        "resolved_at": null
      }
    ]
  }
}
```

#### POST /failures/simulate
Simulate failure scenarios for testing.

**Request Body:**
```json
{
  "failure_type": "generator_failure",
  "equipment_id": "GEN_001",
  "severity": "high",
  "duration_minutes": 30,
  "simulation_mode": true,
  "test_recovery": true
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "simulation_id": "sim_456789",
    "status": "initiated",
    "estimated_duration": "30 minutes",
    "safety_mode": "simulation_only"
  },
  "message": "Failure simulation started"
}
```

---

## 13. Analytics API

### 13.1 Performance KPIs

#### GET /analytics/kpis
Get key performance indicators and metrics.

**Query Parameters:**
- `period` (string, optional, default: "7d"): Analysis period (1d, 7d, 30d, 90d)
- `kpi_types` (string, optional): Comma-separated list of KPI types

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "kpis": {
      "fuel_efficiency": {
        "current_value": 3.52,
        "baseline_value": 3.21,
        "improvement_percentage": 9.7,
        "unit": "kWh/L",
        "trend": "improving"
      },
      "renewable_percentage": {
        "current_value": 51.4,
        "target_value": 60.0,
        "unit": "%",
        "trend": "stable"
      },
      "system_availability": {
        "current_value": 99.2,
        "target_value": 99.5,
        "unit": "%",
        "downtime_hours": 1.34
      },
      "fuel_consumption": {
        "daily_average": 287.5,
        "baseline_average": 342.1,
        "savings_liters": 54.6,
        "savings_percentage": 16.0,
        "unit": "L/day"
      },
      "cost_savings": {
        "daily_savings": 218.40,
        "weekly_savings": 1528.80,
        "monthly_projected": 6553.60,
        "unit": "USD"
      }
    },
    "trends": [
      {
        "date": "2026-08-22",
        "fuel_consumption": 285.3,
        "renewable_percentage": 52.1,
        "system_efficiency": 89.5
      }
    ]
  }
}
```

#### GET /analytics/fuel-consumption
Get detailed fuel consumption analysis.

**Query Parameters:**
- `period` (string, optional, default: "30d"): Analysis period
- `breakdown` (boolean, optional): Include generator breakdown

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "period": "30d",
      "total_consumption_liters": 8625.4,
      "average_daily_liters": 287.5,
      "baseline_consumption_liters": 10263.0,
      "savings_liters": 1637.6,
      "savings_percentage": 16.0,
      "cost_savings_usd": 6550.40
    },
    "daily_breakdown": [
      {
        "date": "2026-08-22",
        "consumption_liters": 285.3,
        "baseline_liters": 342.1,
        "savings_liters": 56.8,
        "generation_hours": 18.7
      }
    ],
    "generator_breakdown": [
      {
        "generator_id": "GEN_001",
        "consumption_liters": 4312.7,
        "operating_hours": 268.5,
        "efficiency_kwh_per_liter": 3.52
      }
    ]
  }
}
```

---

## 14. Data Export API

### 14.1 Export Historical Data

#### POST /data/export
Export historical data in various formats.

**Request Body:**
```json
{
  "data_types": ["energy_data", "weather_data", "alerts"],
  "start_date": "2026-08-01T00:00:00Z",
  "end_date": "2026-08-23T23:59:59Z",
  "format": "csv",
  "include_metadata": true,
  "compression": "gzip"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "export_id": "export_789123",
    "status": "processing",
    "estimated_completion": "2026-08-23T15:05:00Z",
    "download_url": null
  },
  "message": "Export job created successfully"
}
```

#### GET /data/export/{export_id}
Get export job status and download link.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "export_id": "export_789123",
    "status": "completed",
    "created_at": "2026-08-23T14:45:00Z",
    "completed_at": "2026-08-23T15:03:00Z",
    "download_url": "https://api.polar-ems.example.com/downloads/export_789123.csv.gz",
    "file_size_bytes": 2048576,
    "expires_at": "2026-08-24T15:03:00Z"
  }
}
```

---

## 15. Configuration API

### 15.1 System Configuration

#### GET /config/system
Get current system configuration.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "station_info": {
      "station_id": "ANTARCTIC_BASE_01",
      "name": "McMurdo Research Station",
      "timezone": "Antarctica/McMurdo",
      "coordinates": {
        "latitude": -77.8419,
        "longitude": 166.6863
      }
    },
    "operational_limits": {
      "max_generation_kw": 150.0,
      "max_load_kw": 120.0,
      "reserve_margin": 0.10,
      "battery_soc_limits": {
        "minimum": 0.20,
        "maximum": 0.95
      }
    },
    "ai_settings": {
      "forecasting": {
        "update_interval_minutes": 15,
        "horizon_hours": 48,
        "retrain_threshold_days": 7
      },
      "optimization": {
        "run_interval_minutes": 15,
        "objective": "minimize_fuel_cost",
        "safety_margins": true
      }
    }
  }
}
```

#### PUT /config/system
Update system configuration.

**Request Body:**
```json
{
  "operational_limits": {
    "reserve_margin": 0.12,
    "battery_soc_limits": {
      "minimum": 0.25,
      "maximum": 0.90
    }
  },
  "ai_settings": {
    "optimization": {
      "run_interval_minutes": 10
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "updated_fields": ["operational_limits.reserve_margin", "ai_settings.optimization.run_interval_minutes"],
    "validation_results": {
      "all_valid": true,
      "warnings": []
    }
  },
  "message": "Configuration updated successfully"
}
```

---

## 16. WebSocket API

### 16.1 Real-Time Data Streaming

#### WebSocket Connection
**Endpoint**: `wss://api.polar-ems.example.com/ws/{user_id}/{station_id}`

**Authentication**: Include JWT token as query parameter or in subprotocol header.

#### Message Format
All WebSocket messages use JSON format with a `type` field indicating the message type.

#### Client Messages

**Subscribe to Data Stream:**
```json
{
  "type": "subscribe",
  "data_types": ["energy_data", "alerts", "equipment_status"],
  "update_frequency": 5
}
```

**Unsubscribe:**
```json
{
  "type": "unsubscribe",
  "data_types": ["equipment_status"]
}
```

#### Server Messages

**Real-Time Energy Data:**
```json
{
  "type": "energy_update",
  "timestamp": "2026-08-23T14:30:00Z",
  "data": {
    "total_generation": 85.5,
    "total_consumption": 78.2,
    "battery_soc": 78.5,
    "fuel_rate": 12.8
  }
}
```

**Alert Notification:**
```json
{
  "type": "alert_notification",
  "alert": {
    "alert_id": "alert_456789",
    "severity": "warning",
    "title": "Battery Temperature High",
    "message": "Battery temperature 42°C exceeds normal range"
  }
}
```

**System Status Update:**
```json
{
  "type": "system_status",
  "timestamp": "2026-08-23T14:30:00Z",
  "status": {
    "overall_health": "normal",
    "active_alerts": 2,
    "equipment_online": 8,
    "communication_status": "connected"
  }
}
```

---

## 17. Error Handling

### 17.1 Standard Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Optional additional details",
    "field": "field_name" // For validation errors
  }
}
```

### 17.2 HTTP Status Codes

| Status Code | Description | Usage |
|-------------|-------------|--------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST creating new resource |
| 202 | Accepted | Request accepted for async processing |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate, etc.) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | System maintenance or overload |

### 17.3 Common Error Codes

#### Authentication Errors
- `INVALID_CREDENTIALS`: Invalid username/password
- `TOKEN_EXPIRED`: JWT token has expired
- `TOKEN_INVALID`: Invalid or malformed JWT token
- `ACCOUNT_LOCKED`: Account locked due to failed attempts
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

#### Validation Errors
- `MISSING_REQUIRED_FIELD`: Required field not provided
- `INVALID_FIELD_FORMAT`: Field format validation failed
- `VALUE_OUT_OF_RANGE`: Numeric value outside acceptable range
- `INVALID_ENUM_VALUE`: Invalid enumeration value

#### Resource Errors
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `RESOURCE_CONFLICT`: Resource already exists or conflicts
- `EQUIPMENT_OFFLINE`: Equipment not responding or offline
- `OPERATION_NOT_ALLOWED`: Operation not permitted in current state

#### System Errors
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: External API call failed
- `SYSTEM_OVERLOAD`: System temporarily overloaded
- `MAINTENANCE_MODE`: System in maintenance mode

---

## 18. Rate Limiting

### 18.1 Rate Limit Rules

| User Role | Requests/Hour | Burst Limit |
|-----------|---------------|-------------|
| Admin | 2000 | 100/minute |
| Engineer | 1500 | 75/minute |
| Operator | 1000 | 50/minute |
| Viewer | 500 | 25/minute |

### 18.2 Rate Limit Headers

All responses include rate limiting information in headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 873
X-RateLimit-Reset: 1693742400
X-RateLimit-Window: 3600
```

### 18.3 Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 15 minutes.",
    "details": "1000 requests per hour limit reached"
  }
}
```

---

## 19. API Versioning

### 19.1 Versioning Strategy
- **URL Path Versioning**: `/api/v1/`, `/api/v2/`
- **Backward Compatibility**: v1 maintained for minimum 12 months after v2 release
- **Deprecation Notice**: 6 months advance notice via response headers
- **Breaking Changes**: Only in major version updates

### 19.2 Version Support Matrix

| Version | Status | Support Until | Breaking Changes |
|---------|--------|---------------|------------------|
| v1 | Current | TBD | None |
| v2 | Planned | TBD | Authentication flow changes |

---

*This API Documentation provides comprehensive reference for all POLAR-EMS endpoints, enabling efficient integration and development while maintaining consistency and reliability across all system interfaces.*