import { useState } from 'react';
import {
  Zap,
  Wind,
  Battery,
  Fuel,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Shield,
  Activity,
  Power,
  ArrowRight,
  ArrowDownUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { DataModeIndicator } from '@/components/ui/DataModeIndicator';
import { formatPower, formatPercent, formatRelativeTime } from '@/utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useAPI } from '@/hooks/useAPI';
import { dashboardService } from '@/services/api/index';

/**
 * Dashboard Page Component
 * Mission Control - Main system overview with KPIs and real-time data
 */

const mockKPIData = {
  current_load: 125.5,
  renewable_power: 85.3,
  battery_soc: 72.5,
  diesel_output: 45.2,
  renewable_share: 65.4,
  fuel_consumption: 12.8,
  critical_load_status: 'protected' as const,
  system_status: 'normal' as const,
};

const mockEnergyFlowData = {
  wind_to_load: 70.0,
  wind_to_battery: 15.3,
  diesel_to_load: 45.2,
  battery_to_load: 0.0,
  battery_from_wind: 15.3,
  total_generation: 130.5,
  total_load: 125.5,
};

const mockChartData = Array.from({ length: 24 }, (_, i) => ({
  timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
  load: 120 + Math.random() * 30,
  wind: 70 + Math.random() * 40,
  diesel: 30 + Math.random() * 30,
  battery: Math.random() * 20 - 10,
}));

const energyChartData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  load: 120 + Math.random() * 30,
  wind: 70 + Math.random() * 40,
  diesel: 30 + Math.random() * 30,
  battery: Math.random() * 20 - 10,
}));

const batteryChartData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  soc: 75 + Math.sin(i / 3) * 20,
}));

const initialGenerators = [
  { id: 1, name: 'Generator #1', status: 'online' as const, power: 45.2, runtime: 1245, efficiency: 88 },
  { id: 2, name: 'Generator #2', status: 'normal' as const, power: 0, runtime: 856, efficiency: 0 },
  { id: 3, name: 'Generator #3', status: 'offline' as const, power: 0, runtime: 423, efficiency: 0 },
];

const criticalLoads = [
  { name: 'Life Support', status: 'online' as const, power: 12.5, priority: 1 },
  { name: 'Communications', status: 'online' as const, power: 8.3, priority: 2 },
  { name: 'Scientific Equipment', status: 'online' as const, power: 45.7, priority: 3 },
  { name: 'Habitation', status: 'online' as const, power: 18.4, priority: 4 },
];

const aiRecommendation = {
  title: 'Optimize Battery Charging',
  message: 'High wind generation is expected during the next 4 hours. Prioritize battery charging during this period to maximize renewable energy storage.',
  priority: 'high' as const,
  reasoning: 'Wind forecast shows sustained speeds above 12 m/s. Current battery SOC is 72.5%, allowing room for additional charge. This will reduce diesel dependency during low-wind periods.',
  action: 'Increase battery charge rate to 15 kW',
  confidence: 87,
  timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
};

const initialAlerts = [
  {
    id: 1,
    severity: 'critical' as const,
    title: 'Battery Temperature Critical',
    message: 'Battery pack temperature exceeds safe operating range',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 2,
    severity: 'warning' as const,
    title: 'Diesel Generator Temperature Elevated',
    message: 'Generator #1 operating 5°C above normal',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 3,
    severity: 'info' as const,
    title: 'High Wind Forecast',
    message: 'Wind speeds expected to reach 15 m/s in next 6 hours',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
];

export default function DashboardPage() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [recommendationAccepted, setRecommendationAccepted] = useState(false);
  const [recommendationDismissed, setRecommendationDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: kpiData,
    refetch: refetchKPI,
  } = useAPI({
    apiFn: () => dashboardService.getKPI(),
    mockData: mockKPIData,
    immediate: true,
    pollInterval: 5000,
  });

  const displayKpiData = kpiData || mockKPIData;

  const { data: _energyFlowData } = useAPI({
    apiFn: () => dashboardService.getEnergyFlow(),
    mockData: mockEnergyFlowData,
    immediate: true,
    pollInterval: 5000,
  });

  const { data: chartData } = useAPI({
    apiFn: () => dashboardService.getChartData(24),
    mockData: mockChartData,
    immediate: true,
  });

  const displayChartData = chartData?.map((d) => ({
    hour: new Date(d.timestamp).getHours() + ':00',
    load: d.load,
    wind: d.wind,
    diesel: d.diesel,
    battery: d.battery,
  })) || energyChartData;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchKPI();
    setTimeout(() => setRefreshing(false), 800);
    toast.success('Dashboard data refreshed', { description: 'All KPIs updated with latest readings' });
  };

  const handleAcceptRecommendation = () => {
    setRecommendationAccepted(true);
    toast.success('Recommendation Accepted', {
      description: `Action applied: "${aiRecommendation.action}"`,
    });
  };

  const handleDismissRecommendation = () => {
    setRecommendationDismissed(true);
    toast.info('Recommendation Dismissed', { description: 'AI will adjust and generate new suggestions' });
  };

  const handleAcknowledge = (id: number, title: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
    toast.success('Alert Acknowledged', { description: `"${title}" has been acknowledged` });
  };

  const handleViewAllAlerts = () => {
    window.location.href = '/alerts';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Mission Control</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time energy management dashboard</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-xs text-gray-400">Last Updated</div>
            <div className="text-sm font-medium text-gray-300">{formatRelativeTime(new Date().toISOString())}</div>
          </div>
          <DataModeIndicator showToggle={true} />
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={18} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TOP SECTION - KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Current Load" value={formatPower(displayKpiData.current_load)} status="normal" icon={<Zap size={18} />} />
        <KPICard label="Renewable Power" value={formatPower(displayKpiData.renewable_power)} status="good" icon={<Wind size={18} />} />
        <KPICard label="Battery SOC" value={formatPercent(displayKpiData.battery_soc)} status="normal" icon={<Battery size={18} />} />
        <KPICard label="Diesel Output" value={formatPower(displayKpiData.diesel_output)} status="normal" icon={<Fuel size={18} />} />
        <KPICard label="Renewable Share" value={formatPercent(displayKpiData.renewable_share)} status="good" icon={<TrendingUp size={18} />} />
        <KPICard label="Fuel Rate" value={`${displayKpiData.fuel_consumption.toFixed(1)} L/h`} status="normal" icon={<Activity size={18} />} />
        <KPICard label="Critical Loads" value="Protected" status="good" icon={<Shield size={18} />} />
        <KPICard label="System Status" value="Operational" status="good" icon={<CheckCircle2 size={18} />} />
      </div>

      {/* ENERGY FLOW */}
      <Card>
        <CardHeader title="Energy Flow" subtitle="Real-time power distribution" />
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8">
            <div className="flex flex-col space-y-6 lg:w-1/4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-renewable/20 rounded-xl flex items-center justify-center border-2 border-renewable"><Wind size={28} className="text-renewable" /></div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Wind</div>
                  <div className="text-xl font-bold text-renewable">{formatPower(displayKpiData.renewable_power)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-battery/20 rounded-xl flex items-center justify-center border-2 border-battery"><Battery size={28} className="text-battery" /></div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Battery</div>
                  <div className="text-xl font-bold text-battery">{formatPercent(displayKpiData.battery_soc)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-diesel/20 rounded-xl flex items-center justify-center border-2 border-diesel"><Fuel size={28} className="text-diesel" /></div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Diesel</div>
                  <div className="text-xl font-bold text-diesel">{formatPower(displayKpiData.diesel_output)}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center lg:w-2/4">
              <div className="relative">
                <div className="absolute -left-20 top-1/2 -translate-y-1/2 hidden lg:block"><ArrowRight size={40} className="text-gray-600" /></div>
                <div className="absolute -right-20 top-1/2 -translate-y-1/2 hidden lg:block"><ArrowRight size={40} className="text-gray-600" /></div>
                <div className="w-48 h-48 bg-gradient-accent rounded-3xl flex flex-col items-center justify-center border-4 border-polar-400 shadow-glow-md">
                  <Zap size={48} className="text-white mb-2" />
                  <div className="text-white font-bold text-lg">MICROGRID</div>
                  <div className="text-white/80 text-sm mt-1">Energy Hub</div>
                </div>
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 lg:hidden"><ArrowDownUp size={32} className="text-gray-600" /></div>
              </div>
            </div>

            <div className="flex flex-col space-y-6 lg:w-1/4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-load/20 rounded-xl flex items-center justify-center border-2 border-load"><Zap size={28} className="text-load" /></div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Total Load</div>
                  <div className="text-xl font-bold text-load">{formatPower(displayKpiData.current_load)}</div>
                  <div className="text-xs text-gray-400 mt-1">{formatPercent(displayKpiData.renewable_share)} renewable</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 24-HOUR ENERGY CHART */}
      <Card>
        <CardHeader title="24-Hour Energy Profile" subtitle="Load, generation, and battery contribution" />
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="hour" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ backgroundColor: '#141b2d', border: '1px solid #2d3748', borderRadius: '8px' }} labelStyle={{ color: '#f3f4f6' }} />
              <Legend />
              <Line type="monotone" dataKey="load" stroke="#8b5cf6" strokeWidth={2} name="Load" dot={false} />
              <Line type="monotone" dataKey="wind" stroke="#10b981" strokeWidth={2} name="Wind" dot={false} />
              <Line type="monotone" dataKey="diesel" stroke="#f59e0b" strokeWidth={2} name="Diesel" dot={false} />
              <Line type="monotone" dataKey="battery" stroke="#3b82f6" strokeWidth={2} name="Battery" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* BATTERY SOC CHART */}
      <Card>
        <CardHeader title="Battery State of Charge" subtitle="24-hour SOC profile" />
        <div className="p-6">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={batteryChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="hour" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 100]} label={{ value: 'SOC (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ backgroundColor: '#141b2d', border: '1px solid #2d3748', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="soc" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* GENERATOR + CRITICAL LOADS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Generator Status" subtitle="Diesel generators operational state" />
          <div className="space-y-4">
            {initialGenerators.map((gen) => (
              <div key={gen.id} className="p-4 bg-dark-surface rounded-lg border border-dark-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gen.status === 'online' ? 'bg-status-success/20' : 'bg-gray-700/50'}`}>
                      <Power size={20} className={gen.status === 'online' ? 'text-status-success' : 'text-gray-500'} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-100">{gen.name}</div>
                      <div className="text-xs text-gray-400">Runtime: {gen.runtime}h</div>
                    </div>
                  </div>
                  <StatusBadge status={gen.status} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Power Output</div>
                    <div className="font-semibold text-gray-100">{formatPower(gen.power)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Efficiency</div>
                    <div className="font-semibold text-gray-100">{gen.efficiency > 0 ? `${gen.efficiency}%` : 'N/A'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Critical Loads" subtitle="Essential systems protection status" />
          <div className="space-y-4">
            {criticalLoads.map((load) => (
              <div key={load.name} className="p-4 bg-dark-surface rounded-lg border border-dark-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Shield size={20} className="text-status-success" />
                    <div>
                      <div className="font-semibold text-gray-100">{load.name}</div>
                      <div className="text-xs text-gray-400">Priority {load.priority}</div>
                    </div>
                  </div>
                  <StatusBadge status={load.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Current Draw</span>
                  <span className="font-semibold text-gray-100">{formatPower(load.power)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI RECOMMENDATION */}
      {!recommendationAccepted && !recommendationDismissed && (
        <Card className="border-2 border-polar-600/30">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 bg-gradient-accent rounded-xl flex items-center justify-center flex-shrink-0">
              <Lightbulb size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 flex items-center">
                    AI RECOMMENDATION
                    <Badge variant="warning" size="sm" className="ml-3">{aiRecommendation.priority.toUpperCase()}</Badge>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(aiRecommendation.timestamp)} • Confidence: {aiRecommendation.confidence}%
                  </p>
                </div>
              </div>
              <p className="text-gray-100 mb-4 text-base font-medium">"{aiRecommendation.message}"</p>
              <div className="space-y-3 mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-400">Reasoning: </span>
                  <span className="text-sm text-gray-300">{aiRecommendation.reasoning}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-400">Recommended Action: </span>
                  <span className="text-sm text-polar-400 font-medium">{aiRecommendation.action}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAcceptRecommendation}
                  className="btn-primary btn-sm flex items-center"
                >
                  <CheckCircle2 size={16} className="mr-1" /> Accept
                </button>
                <button
                  onClick={handleDismissRecommendation}
                  className="btn-secondary btn-sm flex items-center"
                >
                  <XCircle size={16} className="mr-1" /> Dismiss
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {recommendationAccepted && (
        <Card className="border-2 border-status-success/30 bg-status-success/5">
          <div className="flex items-center space-x-3">
            <CheckCircle2 size={24} className="text-status-success flex-shrink-0" />
            <div>
              <div className="font-semibold text-status-success">Recommendation Applied</div>
              <div className="text-sm text-gray-400">{aiRecommendation.action} — executing now</div>
            </div>
          </div>
        </Card>
      )}

      {/* ACTIVE ALERTS */}
      <Card>
        <CardHeader
          title="Active Alerts"
          subtitle="System notifications requiring attention"
          action={
            <button
              onClick={handleViewAllAlerts}
              className="btn-secondary btn-sm"
            >
              View All
            </button>
          }
        />
        <div className="space-y-3">
          {alerts.filter(a => !a.acknowledged).length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-status-success opacity-50" />
              <p className="text-gray-400 text-sm">All alerts acknowledged</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.acknowledged ? 'opacity-50' :
                  alert.severity === 'critical'
                    ? 'bg-status-critical/10 border-status-critical/30'
                    : alert.severity === 'warning'
                    ? 'bg-status-warning/10 border-status-warning/30'
                    : 'bg-status-info/10 border-status-info/30'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle
                    size={20}
                    className={
                      alert.severity === 'critical' ? 'text-status-critical' :
                      alert.severity === 'warning' ? 'text-status-warning' : 'text-status-info'
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-100">{alert.title}</h4>
                      <Badge variant={alert.severity} size="sm">{alert.severity}</Badge>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        <Clock size={12} className="inline mr-1" />
                        {formatRelativeTime(alert.timestamp)}
                      </span>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(alert.id, alert.title)}
                          className="text-xs text-polar-400 hover:text-polar-300 font-medium transition-colors px-2 py-1 rounded hover:bg-polar-400/10"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.acknowledged && (
                        <span className="text-xs text-status-success font-medium flex items-center">
                          <CheckCircle2 size={12} className="mr-1" /> Done
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
