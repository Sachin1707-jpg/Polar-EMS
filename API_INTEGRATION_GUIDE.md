# POLAR-EMS API Integration Guide

## Overview
This guide demonstrates how to integrate the FastAPI backend with the POLAR-EMS frontend using the clean API service layer.

## ✅ Completed Setup

### 1. Environment Configuration
**Files Created:**
- `frontend/.env` - Local environment variables
- `frontend/.env.example` - Template for environment variables

**Environment Variables:**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_DATA_MODE=simulation
VITE_API_DEBUG=true
```

### 2. API Infrastructure
**Files Created:**
- `frontend/src/lib/axios.ts` - Axios instance with interceptors
- `frontend/src/config/api.ts` - API configuration and endpoints
- `frontend/src/types/api.ts` - TypeScript interfaces for API responses

**Features:**
- ✅ Automatic token refresh on 401
- ✅ Request/response logging in debug mode
- ✅ Retry logic with exponential backoff
- ✅ Centralized error handling
- ✅ Request timeout (30s default)

### 3. API Services
**Files Created:** (`frontend/src/services/api/`)
- `dashboard.service.ts` - Dashboard KPIs, energy flow, charts
- `weather.service.ts` - Current weather, forecasts, impact analysis
- `forecast.service.ts` - Load and wind forecasts with metrics
- `recommendations.service.ts` - AI recommendations management
- `optimization.service.ts` - Energy optimization and dispatch
- `alerts.service.ts` - Alerts and daily reports
- `analytics.service.ts` - Performance analytics
- `station.service.ts` - Station components and energy flows
- `battery.service.ts` - Battery status and history
- `generators.service.ts` - Generator status and control
- `failures.service.ts` - Failure simulation and emergency response

**All services follow the same pattern:**
```typescript
export const serviceNamedService = {
  async getMethod(): Promise<Type> {
    const response = await apiClient.get<APIResponse<Type>>(endpoint);
    return response.data.data;
  },
};
```

### 4. Data Mode Context
**Files Created:**
- `frontend/src/contexts/DataModeContext.tsx` - Manages simulation/live toggle
- `frontend/src/hooks/useAPI.ts` - Custom hook for API calls
- `frontend/src/components/ui/DataModeIndicator.tsx` - UI component for mode display

**Features:**
- ✅ Global simulation/live data mode
- ✅ Persisted in localStorage
- ✅ Automatic mock data fallback in simulation mode
- ✅ Auto-refresh with polling support
- ✅ Loading and error states built-in

### 5. UI Components
**Files Created:**
- `frontend/src/components/ui/LoadingSpinner.tsx` - Loading states
- `frontend/src/components/ui/ErrorState.tsx` - Error displays with retry
- `frontend/src/components/ui/DataModeIndicator.tsx` - Data mode toggle

### 6. App Integration
**Files Updated:**
- `frontend/src/App.tsx` - Wrapped with `DataModeProvider`

---

## 📖 How to Integrate API into a Page

### Pattern 1: Basic API Integration with useAPI Hook

```typescript
import { useAPI } from '@/hooks/useAPI';
import { dashboardService } from '@/services/api';
import { CardLoading } from '@/components/ui/LoadingSpinner';
import { CardError } from '@/components/ui/ErrorState';
import { DataModeIndicator } from '@/components/ui/DataModeIndicator';

// 1. Define mock data for simulation mode
const mockData = {
  current_load: 125.5,
  renewable_power: 85.3,
  battery_soc: 72.5,
  // ... other fields
};

export default function DashboardPage() {
  // 2. Use useAPI hook
  const {
    data: kpiData,
    loading,
    error,
    refetch,
  } = useAPI({
    apiFn: () => dashboardService.getKPI(),
    mockData: mockData,
    immediate: true,
    pollInterval: 5000, // Auto-refresh every 5 seconds
  });

  return (
    <div>
      {/* 3. Show data mode indicator */}
      <DataModeIndicator showToggle={true} />
      
      {/* 4. Handle loading state */}
      {loading && <CardLoading />}
      
      {/* 5. Handle error state */}
      {error && <CardError error={error} onRetry={refetch} />}
      
      {/* 6. Render data */}
      {kpiData && (
        <div>
          <div>Load: {kpiData.current_load} kW</div>
          <div>Renewable: {kpiData.renewable_power} kW</div>
          {/* ... */}
        </div>
      )}
    </div>
  );
}
```

### Pattern 2: Multiple API Calls

```typescript
export default function ForecastsPage() {
  // Load forecast
  const {
    data: loadForecast,
    loading: loadLoading,
    error: loadError,
  } = useAPI({
    apiFn: () => forecastService.getLoadForecast(24),
    mockData: mockLoadData,
    immediate: true,
  });

  // Wind forecast
  const {
    data: windForecast,
    loading: windLoading,
    error: windError,
  } = useAPI({
    apiFn: () => forecastService.getWindForecast(24),
    mockData: mockWindData,
    immediate: true,
  });

  // Forecast metrics
  const {
    data: metrics,
    loading: metricsLoading,
  } = useAPI({
    apiFn: () => forecastService.getMetrics(),
    mockData: mockMetrics,
    immediate: true,
  });

  const isLoading = loadLoading || windLoading || metricsLoading;
  
  if (isLoading) return <PageLoading />;
  
  return (
    <div>
      {/* Render forecasts */}
    </div>
  );
}
```

### Pattern 3: Manual API Calls (Form Submissions)

```typescript
import { useState } from 'react';
import { optimizationService } from '@/services/api';

export default function OptimizationPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunOptimization = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await optimizationService.run({
        forecasted_load: [/* ... */],
        forecasted_wind: [/* ... */],
        // ... other inputs
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleRunOptimization} disabled={loading}>
        Run Optimization
      </button>
      
      {loading && <LoadingSpinner />}
      {error && <ErrorState error={error} onRetry={handleRunOptimization} />}
      {result && <OptimizationResults data={result} />}
    </div>
  );
}
```

### Pattern 4: WebSocket Integration (Real-time Updates)

```typescript
import { useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';

export default function RealtimeDashboard() {
  const [wsData, setWsData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Only connect WebSocket in live mode
    if (isLive) {
      const ws = new WebSocket(`${API_CONFIG.wsURL}/ws/dashboard`);
      
      ws.onopen = () => setConnected(true);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setWsData(message.data);
      };
      
      ws.onerror = (error) => console.error('WebSocket error:', error);
      
      ws.onclose = () => setConnected(false);
      
      return () => ws.close();
    }
  }, [isLive]);

  return (
    <div>
      {connected && <Badge variant="success">Live</Badge>}
      {/* Render real-time data */}
    </div>
  );
}
```

---

## 📝 Example: Dashboard Page Integration

### Before (Mock Data)

```typescript
const mockData = {
  currentLoad: 125.5,
  renewablePower: 85.3,
  batterySoc: 72.5,
};

export default function DashboardPage() {
  return (
    <div>
      <KPICard label="Load" value={mockData.currentLoad} />
      <KPICard label="Renewable" value={mockData.renewablePower} />
      <KPICard label="Battery SOC" value={mockData.batterySoc} />
    </div>
  );
}
```

### After (API Integration)

```typescript
import { useAPI } from '@/hooks/useAPI';
import { dashboardService } from '@/services/api';
import { DataModeIndicator } from '@/components/ui/DataModeIndicator';
import { CardLoading } from '@/components/ui/LoadingSpinner';
import { CardError } from '@/components/ui/ErrorState';

// Mock data for simulation mode
const mockKPIData = {
  current_load: 125.5,
  renewable_power: 85.3,
  battery_soc: 72.5,
  diesel_output: 45.2,
  renewable_share: 65.4,
  fuel_consumption: 12.8,
  critical_load_status: 'protected',
  system_status: 'normal',
};

export default function DashboardPage() {
  // Fetch KPI data with auto-refresh
  const {
    data: kpiData,
    loading,
    error,
    refetch,
  } = useAPI({
    apiFn: () => dashboardService.getKPI(),
    mockData: mockKPIData,
    immediate: true,
    pollInterval: 5000, // Refresh every 5 seconds
  });

  return (
    <div>
      {/* Header with Data Mode Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1>Mission Control</h1>
        <div className="flex items-center space-x-3">
          <DataModeIndicator showToggle={true} />
          <button onClick={refetch}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {loading && <CardLoading />}
      {error && <CardError error={error} onRetry={refetch} />}
      {kpiData && (
        <div className="grid grid-cols-4 gap-4">
          <KPICard 
            label="Load" 
            value={formatPower(kpiData.current_load)} 
          />
          <KPICard 
            label="Renewable" 
            value={formatPower(kpiData.renewable_power)} 
          />
          <KPICard 
            label="Battery SOC" 
            value={formatPercent(kpiData.battery_soc)} 
          />
          <KPICard 
            label="Diesel" 
            value={formatPower(kpiData.diesel_output)} 
          />
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 Backend API Expected Response Format

All API endpoints should return responses in this format:

```json
{
  "success": true,
  "data": {
    // Actual data here
  },
  "message": "Optional message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response Format

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "detail": "Additional details",
  "status_code": 400
}
```

---

## 🎯 API Endpoint Groups

### 1. Authentication (`/api/v1/auth`)
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user

### 2. Dashboard (`/api/v1/dashboard`)
- `GET /kpi` - Get KPI metrics
- `GET /energy-flow` - Get energy flow data
- `GET /charts?hours=24` - Get chart data

### 3. Weather (`/api/v1/weather`)
- `GET /current` - Current weather
- `GET /forecast?hours=48` - Weather forecast
- `GET /energy-impact` - Weather-to-energy impact
- `GET /risk` - Weather risk assessment

### 4. Forecasts (`/api/v1/forecasts`)
- `GET /load?horizon=24` - Load forecast
- `GET /wind?horizon=24` - Wind power forecast
- `GET /metrics` - Forecast model metrics
- `GET /summary` - Forecast summary

### 5. Recommendations (`/api/v1/recommendations`)
- `GET /` - Get all recommendations
- `POST /:id/accept` - Accept recommendation
- `POST /:id/dismiss` - Dismiss recommendation
- `GET /:id/factors` - Get decision factors

### 6. Optimization (`/api/v1/optimization`)
- `POST /run` - Run optimization
- `GET /schedule` - Get latest schedule
- `GET /comparison` - Baseline comparison

### 7. Battery (`/api/v1/battery`)
- `GET /status` - Current battery status
- `GET /history?hours=24` - Battery history
- `GET /soc?hours=24` - SOC forecast

### 8. Generators (`/api/v1/generators`)
- `GET /status` - All generators status
- `GET /history?id=1&hours=24` - Generator history
- `POST /:id/control` - Control generator (start/stop)

### 9. Alerts (`/api/v1/alerts`)
- `GET /?severity=critical&status=unread` - Get alerts (with filters)
- `POST /:id/acknowledge` - Acknowledge alert
- `POST /:id/dismiss` - Dismiss alert
- `GET /daily-report?date=2024-01-15` - Get daily report

### 10. Failures (`/api/v1/failures`)
- `POST /simulate` - Simulate failure scenario
- `GET /status` - Current failure status
- `GET /history?days=30` - Failure history

### 11. Analytics (`/api/v1/analytics`)
- `GET /summary?start=&end=` - Analytics summary
- `GET /performance?start=&end=` - Performance metrics
- `GET /baseline-comparison?start=&end=` - Baseline comparison
- `GET /charts?type=energy&start=&end=` - Chart data

### 12. Station (`/api/v1/station`)
- `GET /components` - All station components
- `GET /components/:id` - Specific component details
- `GET /energy-flows` - Energy flows

---

## 🚀 Testing the Integration

### 1. Start Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test in Simulation Mode
- Set `VITE_DATA_MODE=simulation` in `.env`
- Frontend will use mock data
- No backend required

### 4. Test in Live Mode
- Set `VITE_DATA_MODE=live` in `.env`
- Toggle to "LIVE" in UI using DataModeIndicator
- Frontend will call actual backend APIs
- Backend must be running

### 5. Debug API Calls
- Set `VITE_API_DEBUG=true` in `.env`
- Open browser console
- See all API requests/responses logged

---

## 📋 Migration Checklist

For each page, follow this checklist:

- [ ] 1. Import `useAPI` hook and relevant service
- [ ] 2. Import `DataModeIndicator`, `CardLoading`, `CardError`
- [ ] 3. Define mock data matching API response shape
- [ ] 4. Replace direct mock data references with `useAPI` hook
- [ ] 5. Add loading state handling
- [ ] 6. Add error state handling with retry
- [ ] 7. Add DataModeIndicator to page header
- [ ] 8. Add manual refresh button (optional)
- [ ] 9. Test in both simulation and live modes
- [ ] 10. Verify TypeScript types match API responses

---

## 🎨 UI States Checklist

Every API-integrated component should handle:

- ✅ **Loading State** - Show spinner or skeleton
- ✅ **Error State** - Show error message with retry option
- ✅ **Empty State** - Show message when no data available
- ✅ **Success State** - Show actual data
- ✅ **Data Mode** - Clearly indicate simulation vs live
- ✅ **Refresh** - Allow manual data refresh
- ✅ **Auto-refresh** - Optional polling for real-time feel

---

## 🔐 Security Notes

### ✅ Good Practices (Implemented)
- Environment variables for API URLs
- No secrets in frontend code
- Token stored in localStorage (consider httpOnly cookies for production)
- Automatic token refresh on 401
- Request timeout (30s)
- CORS handled by backend

### ⚠️ Production Considerations
- Use httpOnly cookies for tokens (not localStorage)
- Implement CSRF protection
- Use HTTPS only
- Add rate limiting
- Implement request signing for sensitive operations
- Add API key rotation

---

## 📊 Next Steps

### Immediate
1. ✅ Environment configuration - DONE
2. ✅ API infrastructure - DONE
3. ✅ All 11 API services - DONE
4. ✅ Data mode context - DONE
5. ✅ UI components - DONE
6. ⏳ Update Dashboard page (in progress)
7. ⏳ Update remaining 9 pages

### Per-Page Migration Order (Recommended)
1. Dashboard (most critical)
2. Weather (simple, good test case)
3. Forecasts (demonstrates charts with API)
4. Recommendations (demonstrates actions)
5. Alerts (demonstrates filtering)
6. Station (demonstrates component details)
7. Optimization (demonstrates form submission)
8. Emergency (demonstrates simulation)
9. Analytics (demonstrates date range filtering)
10. Landing (no API needed)

### Backend Development
- Implement actual FastAPI endpoints matching the defined interfaces
- Add WebSocket support for real-time updates
- Implement data simulation service
- Add database models and migrations
- Implement authentication and authorization
- Add API rate limiting and monitoring

---

## 🎉 Summary

**Created:**
- ✅ 2 environment files
- ✅ 1 axios configuration
- ✅ 1 API config file
- ✅ 1 API types file (150+ interfaces)
- ✅ 11 API service files
- ✅ 1 Data mode context
- ✅ 1 useAPI custom hook
- ✅ 3 UI components (loading, error, data mode)
- ✅ 1 App.tsx update

**Ready to Use:**
- ✅ Clean service layer for all 13 API groups
- ✅ Simulation/Live data mode toggle
- ✅ Loading and error states
- ✅ Retry behavior with exponential backoff
- ✅ Automatic token refresh
- ✅ Request cancellation support
- ✅ TypeScript type safety
- ✅ Environment-based configuration

**Status:** 🚀 **API Integration Layer Complete - Ready for Page Migration**

Now you can gradually update each page to use the API services while maintaining the existing UI!
