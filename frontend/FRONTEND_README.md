# POLAR-EMS Frontend

Production-quality TypeScript frontend for the POLAR-EMS AI-Driven Energy Management System.

## 🎨 Design System

### Theme
- **Dark Mission Control Aesthetic**: Professional polar research station interface
- **No Generic Dashboard Look**: Custom designed for SIH presentation quality
- **Minimal Glows/Gradients**: Subtle, professional visual effects
- **High Readability**: Optimized for 24/7 operations

### Color Palette
```css
Background:  #0a0e1a (Deep space)
Cards:       #141b2d (Card containers)
Surface:     #1a2235 (Surface elements)
Border:      #2d3748 (Borders)
Accent:      #0284c7 (Polar blue)

Status:
- Critical:  #ef4444 (Red)
- Warning:   #f59e0b (Amber)
- Info:      #3b82f6 (Blue)
- Success:   #10b981 (Green)
- Normal:    #6b7280 (Gray)

Functional:
- Renewable: #10b981 (Green)
- Diesel:    #f59e0b (Amber)
- Battery:   #3b82f6 (Blue)
- Load:      #8b5cf6 (Purple)
```

## 🏗️ Architecture

### Project Structure
```
frontend/src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Card.tsx
│   │   ├── KPICard.tsx
│   │   ├── Badge.tsx
│   │   ├── StatusIndicator.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── ErrorMessage.tsx
│   └── navigation/            # Navigation components
│       ├── Sidebar.tsx
│       └── Header.tsx
├── pages/                     # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── WeatherPage.tsx
│   ├── ForecastsPage.tsx
│   ├── RecommendationsPage.tsx
│   ├── OptimizationPage.tsx
│   ├── AlertsPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
├── layouts/                   # Layout components
│   └── AppLayout.tsx
├── types/                     # TypeScript definitions
│   └── index.ts
├── utils/                     # Utility functions
│   ├── cn.ts                  # Class name utility
│   └── format.ts              # Data formatting
├── hooks/                     # Custom React hooks
├── services/                  # API services
├── charts/                    # Chart components
├── animations/                # Animation utilities
├── assets/                    # Static assets
└── styles/
    └── index.css              # Global styles
```

## 🎯 Components

### UI Components

#### Card Component
```tsx
import { Card, CardHeader, CardFooter } from '@/components/ui/Card';

<Card variant="default" padding="md">
  <CardHeader title="Title" subtitle="Subtitle" />
  {/* Content */}
  <CardFooter>{/* Footer content */}</CardFooter>
</Card>
```

#### KPI Card
```tsx
import { KPICard } from '@/components/ui/KPICard';

<KPICard
  label="Current Load"
  value={formatPower(125.5)}
  status="normal"
  trend="up"
  trendValue="+5.2%"
  icon={<Zap />}
/>
```

#### Badge Component
```tsx
import { Badge, StatusBadge, PriorityBadge } from '@/components/ui/Badge';

<Badge variant="success">Online</Badge>
<StatusBadge status="online" />
<PriorityBadge priority="high" />
```

#### Loading States
```tsx
import { 
  LoadingSpinner, 
  PageLoading, 
  CardSkeleton 
} from '@/components/ui/LoadingSpinner';

<LoadingSpinner size="md" />
<PageLoading message="Loading data..." />
<CardSkeleton />
```

#### Empty States
```tsx
import { EmptyState, NoData, NoResults } from '@/components/ui/EmptyState';

<EmptyState
  icon={Inbox}
  title="No data"
  description="Description here"
  action={<button>Action</button>}
/>
```

#### Error Messages
```tsx
import { ErrorMessage, InlineError } from '@/components/ui/ErrorMessage';

<ErrorMessage
  message="Something went wrong"
  variant="error"
  onDismiss={() => {}}
/>
```

### Navigation Components

#### Sidebar
- Desktop fixed sidebar
- Mobile drawer sidebar
- Active route highlighting
- Icon + label navigation

#### Header
- User profile dropdown
- Alert notifications with count
- System status indicator
- Logout functionality

## 🎨 Styling

### Tailwind CSS Classes

Custom component classes available:
```css
/* Cards */
.card                  /* Base card */
.card-hover           /* Hoverable card */
.card-bordered        /* Bordered card */
.kpi-card             /* KPI card */
.stat-card            /* Stat card */

/* Buttons */
.btn                  /* Base button */
.btn-primary          /* Primary action */
.btn-secondary        /* Secondary action */
.btn-ghost            /* Ghost button */
.btn-danger           /* Destructive action */

/* Inputs */
.input                /* Text input */
.label                /* Input label */

/* Badges */
.badge                /* Base badge */
.badge-critical       /* Critical status */
.badge-warning        /* Warning status */
.badge-info           /* Info status */
.badge-success        /* Success status */

/* Status Indicators */
.status-indicator     /* Base indicator */
.status-online        /* Online (green, pulsing) */
.status-offline       /* Offline (gray) */
.status-warning       /* Warning (yellow, pulsing) */
.status-critical      /* Critical (red, pulsing) */

/* Utilities */
.loading-spinner      /* Spinning loader */
.loading-pulse        /* Pulse animation */
.text-gradient        /* Gradient text */
.simulated-badge      /* Simulated data badge */
```

### Animations
```css
animate-fade-in       /* Fade in */
animate-slide-in      /* Slide in from top */
animate-scale-in      /* Scale in */
animate-pulse-slow    /* Slow pulse */
```

## 📝 TypeScript Types

All types are defined in `src/types/index.ts`:

```typescript
// Core types
User, Station, Equipment

// Energy data
EnergyData, WeatherData

// AI/ML
LoadForecast, WindForecast, Recommendation
OptimizationSchedule, Alert

// Dashboard
SystemStatus, EnergyHistory

// Component props
CardProps, BadgeProps, KPICardProps
StatusIndicatorProps
```

## 🛠️ Utilities

### Format Functions

```typescript
import {
  formatPower,      // Format kW values
  formatEnergy,     // Format kWh values
  formatPercent,    // Format percentages
  formatFuel,       // Format liters
  formatTemperature,// Format °C
  formatWindSpeed,  // Format m/s
  formatCurrency,   // Format USD
  formatDateTime,   // Format dates
  formatRelativeTime, // Format "2h ago"
} from '@/utils/format';
```

### Class Name Utility

```typescript
import { cn } from '@/utils/cn';

className={cn(
  'base-class',
  condition && 'conditional-class',
  dynamicClass
)}
```

## 📱 Responsive Design

### Breakpoints
```css
sm:  640px   /* Mobile landscape */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Extra large */
```

### Grid Layouts
```tsx
/* Dashboard KPI grid */
<div className="grid-dashboard">
  {/* 1 col mobile, 2 tablet, 4 desktop */}
</div>

/* Card grid */
<div className="grid-cards">
  {/* 1 col mobile, 2 laptop, 3 desktop */}
</div>
```

## 🚀 Development

### Setup
```bash
cd frontend
npm install
```

### Run Development Server
```bash
npm run dev
```
Access at: http://localhost:5173

### Build for Production
```bash
npm run build
```

### TypeScript Type Checking
```bash
tsc --noEmit
```

### Linting
```bash
npm run lint
```

## 🔗 API Integration

All API calls should be added to `src/services/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors for auth tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## 📊 Chart Integration

Use Recharts for data visualization:

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

<LineChart width={600} height={300} data={data}>
  <XAxis dataKey="timestamp" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="value" stroke="#0ea5e9" />
</LineChart>
```

## 🎭 Animation with Framer Motion

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

## 🔔 Toast Notifications

Using Sonner:

```tsx
import { toast } from 'sonner';

// Success
toast.success('Operation successful');

// Error
toast.error('Something went wrong');

// Info
toast.info('Information message');

// Warning
toast.warning('Warning message');
```

## 🎯 Next Steps

1. **Integrate API calls**: Connect all pages to backend API
2. **Add charts**: Implement Recharts visualizations
3. **State management**: Setup Zustand stores
4. **WebSocket**: Real-time data updates
5. **Testing**: Add component tests
6. **Optimization**: Code splitting, lazy loading

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev)

## 🤝 Contributing

Follow these guidelines:
- Use TypeScript for all new files
- Follow existing component patterns
- Use proper semantic HTML
- Ensure responsive design
- Add proper TypeScript types
- Keep components focused and reusable
- Use Tailwind utility classes
- Document complex logic

---

**Built for Polar Research Energy Management System** 🇮🇳
