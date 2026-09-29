/**
 * Global State Management using Zustand
 */
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  
  clearAuth: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  setUser: (user) => set({ user }),
}));

export const useDashboardStore = create((set) => ({
  systemStatus: null,
  energyHistory: [],
  equipmentStatus: [],
  loading: false,
  error: null,
  lastUpdate: null,
  
  setSystemStatus: (status) => set({ 
    systemStatus: status, 
    lastUpdate: new Date(),
    error: null 
  }),
  
  setEnergyHistory: (history) => set({ energyHistory: history }),
  
  setEquipmentStatus: (equipment) => set({ equipmentStatus: equipment }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  updateRealtime: (data) => {
    // Update with real-time data from WebSocket
    set((state) => ({
      systemStatus: { ...state.systemStatus, ...data },
      lastUpdate: new Date(),
    }));
  },
}));

export const useForecastStore = create((set) => ({
  loadForecast: [],
  windForecast: [],
  accuracy: null,
  loading: false,
  
  setLoadForecast: (forecast) => set({ loadForecast: forecast }),
  setWindForecast: (forecast) => set({ windForecast: forecast }),
  setAccuracy: (accuracy) => set({ accuracy }),
  setLoading: (loading) => set({ loading }),
}));

export const useRecommendationStore = create((set) => ({
  recommendations: [],
  loading: false,
  
  setRecommendations: (recommendations) => set({ recommendations }),
  
  addRecommendation: (recommendation) => set((state) => ({
    recommendations: [recommendation, ...state.recommendations],
  })),
  
  updateRecommendation: (id, updates) => set((state) => ({
    recommendations: state.recommendations.map((rec) =>
      rec.id === id ? { ...rec, ...updates } : rec
    ),
  })),
  
  removeRecommendation: (id) => set((state) => ({
    recommendations: state.recommendations.filter((rec) => rec.id !== id),
  })),
  
  setLoading: (loading) => set({ loading }),
}));

export const useAlertStore = create((set) => ({
  alerts: [],
  alertSummary: null,
  unreadCount: 0,
  loading: false,
  
  setAlerts: (alerts) => set({ 
    alerts,
    unreadCount: alerts.filter((a) => !a.acknowledged).length,
  }),
  
  setAlertSummary: (summary) => set({ alertSummary: summary }),
  
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts],
    unreadCount: state.unreadCount + 1,
  })),
  
  acknowledgeAlert: (id) => set((state) => ({
    alerts: state.alerts.map((alert) =>
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  
  resolveAlert: (id) => set((state) => ({
    alerts: state.alerts.map((alert) =>
      alert.id === id ? { ...alert, resolved: true } : alert
    ),
  })),
  
  setLoading: (loading) => set({ loading }),
}));

export const useOptimizationStore = create((set) => ({
  currentSchedule: null,
  scheduleHistory: [],
  loading: false,
  
  setCurrentSchedule: (schedule) => set({ currentSchedule: schedule }),
  setScheduleHistory: (history) => set({ scheduleHistory: history }),
  setLoading: (loading) => set({ loading }),
}));

export const useWeatherStore = create((set) => ({
  currentWeather: null,
  forecast: [],
  loading: false,
  
  setCurrentWeather: (weather) => set({ currentWeather: weather }),
  setForecast: (forecast) => set({ forecast }),
  setLoading: (loading) => set({ loading }),
}));

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  notifications: [],
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { 
      id: Date.now(), 
      timestamp: new Date(),
      ...notification 
    }],
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  
  clearNotifications: () => set({ notifications: [] }),
}));
