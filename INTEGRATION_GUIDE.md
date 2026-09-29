# POLAR-EMS Integration Guide

## 🎯 Current Status

**Frontend Architecture**: ✅ 100% Complete  
**Backend API**: ✅ 100% Complete  
**Integration**: ⏳ Ready to begin

## 📦 What We Have

### Frontend (TypeScript/React)
- ✓ 17 reusable UI components
- ✓ 10 complete page layouts
- ✓ Professional dark theme
- ✓ Responsive design
- ✓ Full type system
- ✓ Navigation system
- ✓ Error/loading/empty states

### Backend (Python/FastAPI)
- ✓ Complete REST API (25+ endpoints)
- ✓ AI/ML services (forecasting, optimization)
- ✓ Real-time WebSocket updates
- ✓ Data simulation service
- ✓ Authentication system
- ✓ Database models

## 🔗 Integration Steps

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- react, react-dom, react-router-dom
- typescript, @types/*
- zustand (state management)
- axios (HTTP client)
- recharts (charts)
- lucide-react (icons)
- framer-motion (animations)
- sonner (toasts)
- tailwindcss
- date-fns
- clsx

### Step 2: Connect to Backend API

The frontend is already configured to proxy API requests:

**vite.config.ts**:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
  '/ws': {
    target: 'ws://localhost:8000',
    ws: true,
  },
}
```

### Step 3: Setup Zustand Stores

The store files exist in `frontend/src/stores/useStore.js`. Update them to TypeScript:

1. Rename to `useStore.ts`
2. Add proper typing using types from `src/types/index.ts`
3. Connect API calls from `src/services/api.js` (also convert to TS)

Example auth store:
```typescript
import create from 'zustand';
import type { AuthState, User } from '@/types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  setAuth: (user: User, token: string) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  
  clearAuth: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error) => set({ error }),
}));
```

### Step 4: Connect Login Page

**`src/pages/LoginPage.tsx`** - Replace the TODO:

```typescript
import { useAuthStore } from '@/stores/useStore';
import api from '@/services/api';

// Inside component:
const { setAuth, setError } = useAuthStore();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    setAuth(response.data.user, response.data.access_token);
    navigate('/');
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

### Step 5: Connect Dashboard

**`src/pages/DashboardPage.tsx`** - Replace mock data:

```typescript
import { useDashboardStore } from '@/stores/useStore';
import api from '@/services/api';
import { useEffect } from 'react';

const { systemStatus, loading, setSystemStatus, setLoading } = useDashboardStore();

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/status');
      setSystemStatus(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
  
  // Poll every 30 seconds
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, []);
```

### Step 6: Add Chart Components

Create `src/charts/EnergyChart.tsx`:

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint } from '@/types';

interface EnergyChartProps {
  data: ChartDataPoint[];
}

export function EnergyChart({ data }: EnergyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
        <XAxis 
          dataKey="timestamp" 
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af' }}
        />
        <YAxis 
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#141b2d', 
            border: '1px solid #2d3748',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="load_kw" 
          stroke="#8b5cf6" 
          name="Load"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="wind_generation_kw" 
          stroke="#10b981" 
          name="Wind"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="diesel_generation_kw" 
          stroke="#f59e0b" 
          name="Diesel"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

Use in DashboardPage:
```typescript
import { EnergyChart } from '@/charts/EnergyChart';

<Card>
  <CardHeader title="Energy Flow" subtitle="Last 24 hours" />
  <EnergyChart data={energyHistory} />
</Card>
```

### Step 7: Setup WebSocket

Create `src/hooks/useWebSocket.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useDashboardStore } from '@/stores/useStore';
import { toast } from 'sonner';
import type { WebSocketMessage } from '@/types';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { setSystemStatus } = useDashboardStore();

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      if (message.type === 'system_update') {
        setSystemStatus(message.data);
      } else if (message.type === 'alert') {
        toast.error(message.data.title);
      } else if (message.type === 'recommendation') {
        toast.info('New recommendation available');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          // Reconnect logic
        }
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, []);

  return wsRef.current;
}
```

Use in App.tsx or AppLayout.tsx:
```typescript
useWebSocket(); // Connects automatically
```

## 🚀 Running the Application

### Terminal 1: Backend
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000/docs

## 📊 Chart Examples

### Load Forecast Chart
```typescript
<LineChart data={forecasts}>
  <Line dataKey="predicted_load_kw" stroke="#0ea5e9" name="Predicted" />
  <Line dataKey="actual_load_kw" stroke="#6b7280" name="Actual" />
  <Area dataKey="confidence_upper" fill="#0ea5e9" fillOpacity={0.1} />
  <Area dataKey="confidence_lower" fill="#0ea5e9" fillOpacity={0.1} />
</LineChart>
```

### Energy Mix Pie Chart
```typescript
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = {
  wind: '#10b981',
  diesel: '#f59e0b',
  battery: '#3b82f6',
};

<PieChart>
  <Pie 
    data={energyMix} 
    dataKey="value" 
    nameKey="source"
    innerRadius={60}
    outerRadius={80}
  >
    {energyMix.map((entry, index) => (
      <Cell key={index} fill={COLORS[entry.source]} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
```

### Battery SOC Gauge
```typescript
<AreaChart data={batteryData}>
  <Area 
    type="monotone" 
    dataKey="soc_percent" 
    stroke="#3b82f6"
    fill="#3b82f6"
    fillOpacity={0.3}
  />
  <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" label="Min" />
  <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label="Max" />
</AreaChart>
```

## 🔔 Toast Notifications

Already configured with Sonner. Use anywhere:

```typescript
import { toast } from 'sonner';

// Success
toast.success('Settings saved successfully');

// Error
toast.error('Failed to load data');

// Info
toast.info('New recommendation available');

// Warning
toast.warning('Battery SOC below 25%');

// Custom
toast('Custom message', {
  description: 'Additional details here',
  action: {
    label: 'View',
    onClick: () => navigate('/alerts'),
  },
});
```

## 🎯 Priority Integration Order

1. **Authentication** (1 hour)
   - Login/logout functionality
   - Protected routes
   - Token management

2. **Dashboard** (2 hours)
   - System status
   - KPI cards with real data
   - Energy flow chart

3. **WebSocket** (1 hour)
   - Real-time updates
   - Alert notifications

4. **Other Pages** (4 hours)
   - Weather, Forecasts, Recommendations
   - Alerts, Optimization, Analytics

5. **Polish** (2 hours)
   - Error handling
   - Loading states
   - Edge cases

## 🧪 Testing Checklist

- [ ] Login with admin/admin123
- [ ] Dashboard loads with real data
- [ ] Navigation works on all pages
- [ ] WebSocket receives updates
- [ ] Charts display correctly
- [ ] Responsive on mobile/tablet
- [ ] Alerts show notifications
- [ ] Logout clears session
- [ ] Error states display properly
- [ ] Loading states show during fetch

## 🎉 Success Criteria

You'll know integration is complete when:
- ✅ Dashboard shows live simulated data
- ✅ Charts animate smoothly
- ✅ WebSocket updates data every 5 minutes
- ✅ Alerts appear as toast notifications
- ✅ All pages display real backend data
- ✅ Navigation is smooth and fast
- ✅ No console errors
- ✅ Professional appearance maintained

## 📚 Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **Frontend README**: `frontend/FRONTEND_README.md`
- **Architecture Doc**: `FRONTEND_ARCHITECTURE.md`
- **Backend Quickstart**: `QUICKSTART.md`

---

**Estimated Total Integration Time**: 8-12 hours  
**Current Progress**: Architecture 100%, Integration 0%  
**Next Action**: Step 1 - Install dependencies

---

*Ready to transform a solid foundation into a fully functional application!* 🚀
