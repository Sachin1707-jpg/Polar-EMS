import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { DataModeProvider } from '@/contexts/DataModeContext';
import { PageLoading } from '@/components/ui/LoadingSpinner';

// Lazy load pages for better performance
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const WeatherPage = React.lazy(() => import('@/pages/WeatherPage'));
const ForecastsPage = React.lazy(() => import('@/pages/ForecastsPage'));
const AIPredictionPage = React.lazy(() => import('@/pages/AIPredictionPage'));
const RecommendationsPage = React.lazy(() => import('@/pages/RecommendationsPage'));
const OptimizationPage = React.lazy(() => import('@/pages/OptimizationPage'));
const AlertsPage = React.lazy(() => import('@/pages/AlertsPage'));
const EmergencyPage = React.lazy(() => import('@/pages/EmergencyPage'));
const AnalyticsPage = React.lazy(() => import('@/pages/AnalyticsPage'));
const StationPage = React.lazy(() => import('@/pages/StationPage'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const SimulationCenterPage = React.lazy(() => import('@/pages/SimulationCenterPage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // TODO: Replace with actual auth check from store
  const isAuthenticated = true; // Placeholder

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Main App Component
 * Application routing and layout structure
 */
function App() {
  // TODO: Get these from Zustand stores
  const user = null;
  const systemStatus: 'normal' | 'warning' | 'critical' = 'normal';
  const unreadAlertCount = 0;

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout');
  };

  return (
    <DataModeProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoading message="Loading..." />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout
                  user={user}
                  systemStatus={systemStatus}
                  unreadAlertCount={unreadAlertCount}
                  onLogout={handleLogout}
                />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/forecasts" element={<ForecastsPage />} />
            <Route path="/ai-prediction" element={<AIPredictionPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/optimization" element={<OptimizationPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/station" element={<StationPage />} />
            <Route path="/simulation" element={<SimulationCenterPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </DataModeProvider>
  );
}

export default App;
