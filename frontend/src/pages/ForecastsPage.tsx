import { useState } from 'react';
import {
  TrendingUp,
  Wind,
  Activity,
  Brain,
  Zap,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatPower } from '@/utils/format';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

/**
 * AI Forecasts Page - Simplified & Professional
 * Clean, easy-to-understand predictions for load and wind power
 */

type ForecastHorizon = '24h' | '48h' | '72h';

// Generate forecast data
const generateForecastData = (hours: number, type: 'load' | 'wind') => {
  const historicalHours = 6;
  
  return Array.from({ length: historicalHours + hours }, (_, i) => {
    const hour = i - historicalHours;
    const isHistorical = i < historicalHours;
    const isPredicted = !isHistorical;
    
    let baseValue, variation;
    if (type === 'load') {
      baseValue = 125 + Math.sin(i / 4) * 20;
      variation = 8;
    } else {
      baseValue = 85 + Math.cos(i / 6) * 25;
      variation = 12;
    }
    
    const actual = isHistorical ? baseValue + (Math.random() - 0.5) * 5 : null;
    const predicted = isPredicted ? baseValue + (Math.random() - 0.5) * 3 : null;
    
    return {
      hour,
      label: hour === 0 ? 'Now' : `${hour > 0 ? '+' : ''}${hour}h`,
      actual,
      predicted,
      confidence: predicted ? [predicted - variation, predicted + variation] : null,
      isHistorical,
    };
  });
};

export default function ForecastsPage() {
  const [horizon, setHorizon] = useState<ForecastHorizon>('24h');
  
  const hours = horizon === '24h' ? 24 : horizon === '48h' ? 48 : 72;
  const loadData = generateForecastData(hours, 'load');
  const windData = generateForecastData(hours, 'wind');
  
  // Calculate simple statistics
  const loadStats = {
    avgPredicted: 125.4,
    peak: 145.8,
    accuracy: 96,
  };
  
  const windStats = {
    avgPredicted: 82.1,
    peak: 95.7,
    accuracy: 91,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center space-x-3">
            <div className="w-10 h-10 bg-polar-600/20 rounded-xl flex items-center justify-center">
              <Brain size={24} className="text-polar-400" />
            </div>
            <span>AI Predictions</span>
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Smart forecasting for energy demand and renewable generation
          </p>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center space-x-2 bg-dark-surface rounded-lg p-1">
          {(['24h', '48h', '72h'] as ForecastHorizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                horizon === h
                  ? 'bg-polar-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {h.replace('h', ' Hours')}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-load/20 rounded-lg flex items-center justify-center">
              <Activity size={20} className="text-load" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Avg Load Forecast</div>
              <div className="text-lg font-bold text-gray-100">
                {formatPower(loadStats.avgPredicted)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-load/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-load" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Peak Load</div>
              <div className="text-lg font-bold text-gray-100">
                {formatPower(loadStats.peak)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-renewable/20 rounded-lg flex items-center justify-center">
              <Wind size={20} className="text-renewable" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Avg Wind Power</div>
              <div className="text-lg font-bold text-gray-100">
                {formatPower(windStats.avgPredicted)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-renewable/20 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-renewable" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Peak Wind Power</div>
              <div className="text-lg font-bold text-gray-100">
                {formatPower(windStats.peak)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Load Forecast Chart */}
      <Card>
        <CardHeader
          title="Energy Demand Forecast"
          subtitle={`AI prediction for the next ${hours} hours`}
        />
        <div className="p-6">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={loadData}>
              <defs>
                <linearGradient id="loadConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              
              <XAxis
                dataKey="hour"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value === 0) return 'Now';
                  if (value % 6 === 0) return `${value > 0 ? '+' : ''}${value}h`;
                  return '';
                }}
              />
              
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                formatter={(value: any, name: string) => {
                  if (value === null) return ['', name];
                  return [formatPower(Number(value)), name === 'actual' ? 'Actual' : 'Predicted'];
                }}
                labelFormatter={(value) => `Hour: ${value > 0 ? '+' : ''}${value}`}
              />
              
              <Legend />
              
              {/* Current time marker */}
              <ReferenceLine
                x={0}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
              
              {/* Confidence band */}
              <Area
                type="monotone"
                dataKey={(d: any) => d.confidence ? d.confidence[1] : null}
                stroke="none"
                fill="url(#loadConfidence)"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey={(d: any) => d.confidence ? d.confidence[0] : null}
                stroke="none"
                fill="url(#loadConfidence)"
                connectNulls
              />
              
              {/* Historical actual line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#6b7280"
                strokeWidth={2.5}
                name="Actual"
                dot={false}
                connectNulls={false}
              />
              
              {/* Predicted line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="AI Forecast"
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Simple legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-gray-400">Past (Actual)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-load"></div>
              <span className="text-gray-400">Future (Predicted)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 bg-load/20 rounded"></div>
              <span className="text-gray-400">Confidence Range</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Wind Forecast Chart */}
      <Card>
        <CardHeader
          title="Wind Power Forecast"
          subtitle={`Renewable energy prediction for the next ${hours} hours`}
        />
        <div className="p-6">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={windData}>
              <defs>
                <linearGradient id="windConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              
              <XAxis
                dataKey="hour"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value === 0) return 'Now';
                  if (value % 6 === 0) return `${value > 0 ? '+' : ''}${value}h`;
                  return '';
                }}
              />
              
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                formatter={(value: any, name: string) => {
                  if (value === null) return ['', name];
                  return [formatPower(Number(value)), name === 'actual' ? 'Actual' : 'Predicted'];
                }}
                labelFormatter={(value) => `Hour: ${value > 0 ? '+' : ''}${value}`}
              />
              
              <Legend />
              
              {/* Current time marker */}
              <ReferenceLine
                x={0}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
              
              {/* Confidence band */}
              <Area
                type="monotone"
                dataKey={(d: any) => d.confidence ? d.confidence[1] : null}
                stroke="none"
                fill="url(#windConfidence)"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey={(d: any) => d.confidence ? d.confidence[0] : null}
                stroke="none"
                fill="url(#windConfidence)"
                connectNulls
              />
              
              {/* Historical actual line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#6b7280"
                strokeWidth={2.5}
                name="Actual"
                dot={false}
                connectNulls={false}
              />
              
              {/* Predicted line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#10b981"
                strokeWidth={3}
                name="AI Forecast"
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Simple legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-gray-400">Past (Actual)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-renewable"></div>
              <span className="text-gray-400">Future (Predicted)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 bg-renewable/20 rounded"></div>
              <span className="text-gray-400">Confidence Range</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Energy Balance Prediction */}
      <Card className="bg-gradient-to-br from-polar-900/20 to-dark-surface">
        <CardHeader
          title="Next 24 Hours: Energy Balance"
          subtitle="Will we have enough renewable energy?"
        />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Load */}
            <div className="text-center p-4 bg-dark-surface/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Expected Demand</div>
              <div className="text-3xl font-bold text-load mb-1">
                {formatPower(loadStats.avgPredicted)}
              </div>
              <div className="text-xs text-gray-500">Average load</div>
            </div>

            {/* Wind */}
            <div className="text-center p-4 bg-dark-surface/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Expected Generation</div>
              <div className="text-3xl font-bold text-renewable mb-1">
                {formatPower(windStats.avgPredicted)}
              </div>
              <div className="text-xs text-gray-500">Average wind power</div>
            </div>

            {/* Gap */}
            <div className="text-center p-4 bg-status-warning/10 border border-status-warning/30 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Energy Gap</div>
              <div className="text-3xl font-bold text-status-warning mb-1">
                {formatPower(loadStats.avgPredicted - windStats.avgPredicted)}
              </div>
              <div className="text-xs text-status-warning">
                Diesel/Battery needed
              </div>
            </div>
          </div>
        </div>
      </Card>


    </div>
  );
}
