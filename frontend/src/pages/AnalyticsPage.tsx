import { useState } from 'react';
import {
  TrendingUp,
  Activity,
  Zap,
  Wind,
  Fuel,
  Clock,
  Download,
  Calendar,
  Target,
  CheckCircle2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatEnergy, formatPercent } from '@/utils/format';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

/**
 * Analytics Page
 * Energy performance analysis and baseline comparison
 */

type DateFilter = 'today' | '7days' | '30days' | 'custom';

interface BaselineComparison {
  metric: string;
  baseline: number;
  ai: number;
  improvement: number;
  unit: string;
}

// Mock daily energy data (30 days)
const mockDailyEnergy = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }),
  totalEnergy: 650 + Math.random() * 150,
  renewable: 350 + Math.random() * 100,
  diesel: 250 + Math.random() * 80,
}));

// Mock renewable vs diesel (30 days)
const mockRenewableDiesel = mockDailyEnergy.map((d) => ({
  date: d.date,
  renewable: d.renewable,
  diesel: d.diesel,
}));

// Mock battery SOC (30 days)
const mockBatterySOC = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }),
  avgSOC: 60 + Math.random() * 20,
  minSOC: 40 + Math.random() * 15,
  maxSOC: 75 + Math.random() * 15,
}));

// Mock fuel consumption (30 days)
const mockFuelConsumption = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }),
  baseline: 45 + Math.random() * 15,
  ai: 32 + Math.random() * 12,
}));

// Mock renewable share (30 days)
const mockRenewableShare = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }),
  share: 50 + Math.random() * 20,
}));

// Mock generator runtime (30 days)
const mockGeneratorRuntime = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }),
  gen1: 4 + Math.random() * 3,
  gen2: 2 + Math.random() * 2,
  gen3: 0.5 + Math.random() * 1,
}));

// Mock load profile (24 hours)
const mockLoadProfile = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  avgLoad: 100 + Math.sin((i / 24) * Math.PI * 2) * 30 + Math.random() * 10,
  peakLoad: 115 + Math.sin((i / 24) * Math.PI * 2) * 35 + Math.random() * 12,
}));

// Mock forecast accuracy (30 days)
const mockForecastAccuracy = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }),
  loadAccuracy: 92 + Math.random() * 6,
  windAccuracy: 88 + Math.random() * 8,
}));

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-08-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-24');

  // Filter datasets depending on selected DateFilter
  const filterDataset = <T extends any[]>(dataArray: T): T => {
    if (dateFilter === 'today') return dataArray.slice(-1) as T;
    if (dateFilter === '7days') return dataArray.slice(-7) as T;
    if (dateFilter === 'custom') return dataArray.slice(-14) as T;
    return dataArray.slice(-30) as T;
  };

  const dailyEnergyData = filterDataset(mockDailyEnergy);
  const renewableDieselData = filterDataset(mockRenewableDiesel);
  const batterySOCData = filterDataset(mockBatterySOC);
  const fuelConsumptionData = filterDataset(mockFuelConsumption);
  const renewableShareData = filterDataset(mockRenewableShare);
  const generatorRuntimeData = filterDataset(mockGeneratorRuntime);
  const forecastAccuracyData = filterDataset(mockForecastAccuracy);

  // Dynamic KPI aggregation
  const filterDays = dailyEnergyData.length;
  const totalEnergy = dailyEnergyData.reduce((acc, curr) => acc + curr.totalEnergy, 0);
  const renewableEnergy = dailyEnergyData.reduce((acc, curr) => acc + curr.renewable, 0);
  const dieselEnergy = dailyEnergyData.reduce((acc, curr) => acc + curr.diesel, 0);
  const fuelConsumption = Math.round(dailyEnergyData.reduce((acc, curr) => acc + curr.diesel * 0.28, 0) * 10) / 10;
  const renewableShare = Math.round((renewableEnergy / Math.max(1, totalEnergy)) * 1000) / 10;
  const generatorRuntime = Math.round(filterDays * 5.2 * 10) / 10;

  const xAxisInterval = dateFilter === 'today' ? 0 : dateFilter === '7days' ? 1 : 6;
  const timePeriodText = 
    dateFilter === 'today' ? 'Today (24 Hours)' : 
    dateFilter === '7days' ? 'Last 7 Days' : 
    dateFilter === '30days' ? 'Last 30 Days' : 
    `Custom (${customStartDate} to ${customEndDate})`;

  // Dynamic Baseline vs AI Comparison calculation based on filter range
  const scaleFactor = filterDays / 30;
  const dynamicBaselineComparison: BaselineComparison[] = [
    {
      metric: 'Fuel Consumption',
      baseline: Math.round(1324.5 * scaleFactor * 10) / 10,
      ai: Math.round(fuelConsumption * 10) / 10,
      improvement: 22.3,
      unit: 'L',
    },
    {
      metric: 'Renewable Share',
      baseline: 48.7,
      ai: renewableShare,
      improvement: Math.round((renewableShare - 48.7) * 10) / 10,
      unit: '%',
    },
    {
      metric: 'Unmet Load',
      baseline: 0.8,
      ai: 0.0,
      improvement: 100.0,
      unit: '%',
    },
    {
      metric: 'Generator Runtime',
      baseline: Math.round(192.3 * scaleFactor * 10) / 10,
      ai: generatorRuntime,
      improvement: 18.5,
      unit: 'hours',
    },
  ];

  // Export Analytics Report to CSV
  const handleExportReport = () => {
    let csv = `POLAR-EMS Analytics & Performance Report\n`;
    csv += `Export Timestamp,${new Date().toLocaleString()}\n`;
    csv += `Selected Time Period,${timePeriodText}\n\n`;

    csv += `SUMMARY KEY PERFORMANCE INDICATORS\n`;
    csv += `Metric,Value,Unit\n`;
    csv += `Total Energy Consumed,${totalEnergy.toFixed(1)},kWh\n`;
    csv += `Renewable Energy Generated,${renewableEnergy.toFixed(1)},kWh\n`;
    csv += `Diesel Energy Generated,${dieselEnergy.toFixed(1)},kWh\n`;
    csv += `Fuel Consumption,${fuelConsumption.toFixed(1)},Liters\n`;
    csv += `Fuel Saved vs Baseline,22.3,%\n`;
    csv += `Renewable Share,${renewableShare.toFixed(1)},%\n`;
    csv += `Unmet Load,0.0,%\n`;
    csv += `Generator Runtime,${generatorRuntime.toFixed(1)},Hours\n\n`;

    csv += `BASELINE VS AI PERFORMANCE COMPARISON\n`;
    csv += `Metric,Rule-Based Baseline,AI Optimized,Improvement,Unit\n`;
    dynamicBaselineComparison.forEach((item) => {
      csv += `${item.metric},${item.baseline.toFixed(1)},${item.ai.toFixed(1)},+${item.improvement}%,${item.unit}\n`;
    });

    csv += `\nDAILY ENERGY GENERATION BREAKDOWN (${filterDays} Days)\n`;
    csv += `Date,Total Energy (kWh),Renewable (kWh),Diesel (kWh)\n`;
    dailyEnergyData.forEach((row) => {
      csv += `${row.date},${row.totalEnergy.toFixed(1)},${row.renewable.toFixed(1)},${row.diesel.toFixed(1)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `POLAR_EMS_Analytics_Report_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Analytics Report Exported', {
      description: `Downloaded POLAR_EMS_Analytics_Report_${dateFilter}.csv`
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">
            Energy performance analysis and insights ({timePeriodText})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="info" size="lg">
            <span className="mr-1">🔬</span>
            SIMULATED DATA
          </Badge>
        </div>
      </div>

      {/* Date Filter & Export Bar */}
      <Card padding="sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <Calendar size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Time Period:</span>
            {(['today', '7days', '30days', 'custom'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setDateFilter(filter);
                  toast.info(`Filtered data by ${filter === 'today' ? 'Today' : filter === '7days' ? '7 Days' : filter === '30days' ? '30 Days' : 'Custom Range'}`);
                }}
                className={cn(
                  'px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all',
                  dateFilter === filter
                    ? 'bg-polar-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-dark-hover'
                )}
              >
                {filter === 'today' && 'Today'}
                {filter === '7days' && '7 Days'}
                {filter === '30days' && '30 Days'}
                {filter === 'custom' && 'Custom'}
              </button>
            ))}

            {dateFilter === 'custom' && (
              <div className="flex items-center space-x-2 ml-2 bg-dark-bg p-1 rounded-lg border border-dark-border">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-gray-200 text-xs px-2 py-1 focus:outline-none"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-gray-200 text-xs px-2 py-1 focus:outline-none"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportReport}
            className="px-4 py-2 bg-polar-600/20 hover:bg-polar-600/30 text-polar-300 border border-polar-500/40 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <Activity size={20} className="text-gray-400" />
            <TrendingUp size={16} className="text-status-success" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Energy</div>
          <div className="text-2xl font-bold text-gray-100">
            {formatEnergy(totalEnergy)}
          </div>
          <div className="text-xs text-gray-400 mt-1">{timePeriodText}</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <Wind size={20} className="text-renewable" />
            <TrendingUp size={16} className="text-status-success" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Renewable Energy</div>
          <div className="text-2xl font-bold text-renewable">
            {formatEnergy(renewableEnergy)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatPercent(renewableShare)} of total
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <Zap size={20} className="text-diesel" />
            <Activity size={16} className="text-gray-400" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Diesel Energy</div>
          <div className="text-2xl font-bold text-diesel">
            {formatEnergy(dieselEnergy)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatPercent(100 - renewableShare)} of total
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <Fuel size={20} className="text-status-warning" />
            <CheckCircle2 size={16} className="text-status-success" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Fuel Consumption</div>
          <div className="text-2xl font-bold text-gray-100">
            {fuelConsumption.toFixed(1)} L
          </div>
          <div className="text-xs text-status-success mt-1">
            -22.3% vs baseline
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <Target size={20} className="text-status-success" />
            <CheckCircle2 size={16} className="text-status-success" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Fuel Saved</div>
          <div className="text-2xl font-bold text-status-success">
            22.3%
          </div>
          <div className="text-xs text-gray-400 mt-1">AI optimization impact</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <Wind size={20} className="text-renewable" />
            <TrendingUp size={16} className="text-status-success" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Renewable Share</div>
          <div className="text-2xl font-bold text-renewable">
            {formatPercent(renewableShare)}
          </div>
          <div className="text-xs text-status-success mt-1">+11.3% vs baseline</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 size={20} className="text-status-success" />
            <CheckCircle2 size={16} className="text-status-success" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Unmet Load</div>
          <div className="text-2xl font-bold text-status-success">
            0.0%
          </div>
          <div className="text-xs text-status-success mt-1">100% reliability</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <Clock size={20} className="text-gray-400" />
            <Activity size={16} className="text-gray-400" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Generator Runtime</div>
          <div className="text-2xl font-bold text-gray-100">
            {generatorRuntime.toFixed(1)} hrs
          </div>
          <div className="text-xs text-status-success mt-1">-18.5% vs baseline</div>
        </Card>
      </div>

      {/* Baseline vs AI Comparison */}
      <Card className="bg-gradient-to-br from-polar-900/30 to-dark-card border-polar-600/30">
        <CardHeader
          title="Baseline vs AI Performance"
          subtitle={`Demonstrating AI optimization impact (${timePeriodText})`}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicBaselineComparison.map((comparison, index) => (
            <div key={index} className="p-4 bg-dark-surface rounded-lg border border-dark-border">
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {comparison.metric}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Rule-Based</span>
                    <span className="text-sm font-medium text-gray-300">
                      {comparison.baseline.toFixed(1)} {comparison.unit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-dark-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-polar-400 font-medium">AI Optimized</span>
                    <span className="text-sm font-medium text-polar-400">
                      {comparison.ai.toFixed(1)} {comparison.unit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-dark-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-polar-600"
                      style={{
                        width: `${Math.min(100, (comparison.ai / Math.max(1, comparison.baseline)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-dark-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Improvement</span>
                    <span className="text-sm font-bold text-status-success">
                      {comparison.improvement >= 0 ? '+' : ''}
                      {formatPercent(comparison.improvement)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Energy Consumption */}
        <Card>
          <CardHeader
            title="Daily Energy Consumption"
            subtitle={`${timePeriodText}`}
          />
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyEnergyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                interval={xAxisInterval}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalEnergy"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
                name="Total Energy (kWh)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Renewable vs Diesel */}
        <Card>
          <CardHeader
            title="Renewable vs Diesel Generation"
            subtitle={`${timePeriodText}`}
          />
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={renewableDieselData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                interval={xAxisInterval}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="renewable"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Renewable (kWh)"
              />
              <Area
                type="monotone"
                dataKey="diesel"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
                name="Diesel (kWh)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Battery SOC */}
        <Card>
          <CardHeader
            title="Battery State of Charge"
            subtitle={`${timePeriodText}`}
          />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={batterySOCData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                interval={xAxisInterval}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
                label={{ value: '%', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgSOC"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Average SOC (%)"
              />
              <Line
                type="monotone"
                dataKey="minSOC"
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Min SOC (%)"
              />
              <Line
                type="monotone"
                dataKey="maxSOC"
                stroke="#10b981"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Max SOC (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Fuel Consumption */}
        <Card>
          <CardHeader
            title="Fuel Consumption"
            subtitle={`Baseline vs AI (${timePeriodText})`}
          />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fuelConsumptionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                interval={xAxisInterval}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{ value: 'Liters', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Rule-Based (L)"
              />
              <Line
                type="monotone"
                dataKey="ai"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="AI Optimized (L)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Renewable Share */}
        <Card>
          <CardHeader
            title="Renewable Share"
            subtitle={`${timePeriodText}`}
          />
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={renewableShareData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                interval={xAxisInterval}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
                label={{ value: '%', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="share"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.4}
                name="Renewable Share (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Generator Runtime */}
        <Card>
          <CardHeader
            title="Generator Runtime"
            subtitle={`${timePeriodText}`}
          />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={generatorRuntimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                interval={xAxisInterval}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Bar dataKey="gen1" stackId="a" fill="#f59e0b" name="Gen #1 (hrs)" />
              <Bar dataKey="gen2" stackId="a" fill="#f97316" name="Gen #2 (hrs)" />
              <Bar dataKey="gen3" stackId="a" fill="#ea580c" name="Gen #3 (hrs)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Load Profile */}
        <Card>
          <CardHeader
            title="Load Profile"
            subtitle="24-hour average pattern"
          />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockLoadProfile}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="hour"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                interval={3}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{ value: 'kW', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgLoad"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Avg Load (kW)"
              />
              <Line
                type="monotone"
                dataKey="peakLoad"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Peak Load (kW)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Forecast Accuracy */}
        <Card>
          <CardHeader
            title="Forecast Accuracy"
            subtitle={`Model performance (${timePeriodText})`}
          />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastAccuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                interval={xAxisInterval}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                domain={[80, 100]}
                label={{ value: '%', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="loadAccuracy"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Load Forecast (%)"
              />
              <Line
                type="monotone"
                dataKey="windAccuracy"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Wind Forecast (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
