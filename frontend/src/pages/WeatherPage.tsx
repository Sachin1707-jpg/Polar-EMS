import {
  Cloud,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  Navigation,
  AlertTriangle,
  TrendingUp,
  Snowflake,
  Eye,
  Sun,
  ArrowDown,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import {
  formatTemperature,
  formatWindSpeed,
  formatPressure,
  formatRelativeTime,
  formatPower,
} from '@/utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts';

/**
 * Weather Page Component
 * Weather & Environmental Intelligence with energy impact analysis
 */

// Current weather data (from weather service/API)
const currentWeather = {
  temperature: -15.2,
  windSpeed: 12.5,
  windDirection: 315, // degrees
  windDirectionLabel: 'NW',
  pressure: 1013,
  humidity: 68,
  cloudCover: 25,
  visibility: 10,
  condition: 'Clear',
  conditionIcon: 'clear',
  timestamp: new Date().toISOString(),
  dataSource: 'Weather API',
  isSimulated: true,
};

// Weather forecast data (next 48 hours)
const weatherForecast = Array.from({ length: 48 }, (_, i) => ({
  hour: i,
  timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
  temperature: -15 + Math.sin(i / 6) * 5 + (Math.random() - 0.5) * 2,
  windSpeed: 12 + Math.sin(i / 8) * 4 + (Math.random() - 0.5) * 2,
  windDirection: 315 + (Math.random() - 0.5) * 30,
  condition: i % 12 < 8 ? 'Clear' : 'Cloudy',
  precipitation: Math.random() > 0.9 ? 10 : 0,
}));

// AI Energy Forecast (separate from weather)
const energyForecast = Array.from({ length: 48 }, (_, i) => ({
  hour: i,
  timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
  predictedWindPower: Math.max(0, weatherForecast[i].windSpeed ** 3 * 0.15 + (Math.random() - 0.5) * 10),
  confidenceLower: 0,
  confidenceUpper: 0,
})).map((item) => ({
  ...item,
  confidenceLower: Math.max(0, item.predictedWindPower - 15),
  confidenceUpper: item.predictedWindPower + 15,
}));

// Weather Risk Assessment
const weatherRisk = {
  level: 'normal' as 'normal' | 'warning' | 'critical',
  message: 'Conditions are within normal operational parameters',
  factors: [
    { type: 'wind', status: 'normal' as 'normal' | 'warning' | 'critical', message: 'Wind speed optimal for generation (12.5 m/s)' },
    { type: 'temperature', status: 'normal' as 'normal' | 'warning' | 'critical', message: 'Temperature within equipment limits' },
    { type: 'visibility', status: 'normal' as 'normal' | 'warning' | 'critical', message: 'Good visibility for operations' },
  ],
};

// Weather → Energy Impact Analysis
const weatherImpacts = [
  {
    weatherFactor: 'Wind Speed',
    currentValue: '12.5 m/s',
    impact: 'Wind Generation Forecast',
    result: '~85 kW available',
    status: 'good' as 'good' | 'normal' | 'warning' | 'critical',
    icon: Wind,
    description: 'Current wind conditions optimal for renewable generation',
  },
  {
    weatherFactor: 'Temperature',
    currentValue: '-15.2°C',
    impact: 'Battery Operating Conditions',
    result: 'Reduced efficiency',
    status: 'normal' as 'good' | 'normal' | 'warning' | 'critical',
    icon: Thermometer,
    description: 'Cold temperatures reduce battery capacity by ~15%',
  },
  {
    weatherFactor: 'Wind Direction',
    currentValue: 'NW (315°)',
    impact: 'Turbine Alignment',
    result: 'Optimal orientation',
    status: 'good' as 'good' | 'normal' | 'warning' | 'critical',
    icon: Navigation,
    description: 'Wind direction favorable for turbine placement',
  },
];

export default function WeatherPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">
            Weather & Environmental Intelligence
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Current conditions and energy impact analysis
          </p>
        </div>
        <Badge variant="info" size="lg">
          <span className="mr-1">🔬</span>
          SIMULATED DATA
        </Badge>
      </div>

      {/* CURRENT CONDITIONS SECTION */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-100">Current Conditions</h2>
          <Badge variant="success" size="sm">
            <StatusIndicator status="online" size="sm" showLabel={false} />
            <span className="ml-1">{currentWeather.dataSource}</span>
          </Badge>
        </div>

        {/* Current Weather Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <StatCard
            label="Temperature"
            value={formatTemperature(currentWeather.temperature)}
            icon={<Thermometer size={20} />}
          />
          <StatCard
            label="Wind Speed"
            value={formatWindSpeed(currentWeather.windSpeed)}
            icon={<Wind size={20} />}
          />
          <StatCard
            label="Wind Direction"
            value={currentWeather.windDirectionLabel}
            icon={<Navigation size={20} />}
          />
          <StatCard
            label="Pressure"
            value={formatPressure(currentWeather.pressure)}
            icon={<Gauge size={20} />}
          />
          <StatCard
            label="Humidity"
            value={`${currentWeather.humidity}%`}
            icon={<Droplets size={20} />}
          />
          <StatCard
            label="Visibility"
            value={`${currentWeather.visibility}+ km`}
            icon={<Eye size={20} />}
          />
        </div>

        {/* Current Condition Detail Card */}
        <Card className="bg-gradient-to-br from-dark-card to-dark-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-polar-600/20 rounded-2xl flex items-center justify-center">
                {currentWeather.condition === 'Clear' ? (
                  <Sun size={48} className="text-polar-400" />
                ) : (
                  <Cloud size={48} className="text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-100 mb-1">
                  {currentWeather.condition}
                </h3>
                <p className="text-gray-400 text-sm">
                  Cloud Cover: {currentWeather.cloudCover}%
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Last Updated: {formatRelativeTime(currentWeather.timestamp)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-gray-100 mb-2">
                {formatTemperature(currentWeather.temperature)}
              </div>
              <p className="text-sm text-gray-400">
                Feels like: {formatTemperature(currentWeather.temperature - 5)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* WEATHER FORECAST SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-100">Weather Forecast</h2>
            <Badge variant="default" size="sm">48-Hour Outlook</Badge>
          </div>
          <p className="text-sm text-gray-400">
            Source: Weather Service API
          </p>
        </div>

        {/* Temperature Forecast Chart */}
        <Card className="mb-6">
          <CardHeader title="Temperature Forecast" subtitle="Next 48 hours" />
          <div className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weatherForecast.filter((_, i) => i % 3 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis
                  dataKey="hour"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: 'Hours Ahead', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141b2d',
                    border: '1px solid #2d3748',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatTemperature(value), 'Temperature']}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Wind Speed Forecast Chart */}
        <Card>
          <CardHeader title="Wind Speed Forecast" subtitle="Next 48 hours" />
          <div className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weatherForecast.filter((_, i) => i % 3 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis
                  dataKey="hour"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: 'Hours Ahead', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: 'Wind Speed (m/s)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141b2d',
                    border: '1px solid #2d3748',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatWindSpeed(value), 'Wind Speed']}
                />
                <Line
                  type="monotone"
                  dataKey="windSpeed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* WEATHER → ENERGY IMPACT SECTION */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-100">Weather → Energy Impact</h2>
          <Badge variant="info" size="sm">AI Analysis</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {weatherImpacts.map((impact, index) => (
            <Card key={index} className="hover:border-dark-accent transition-colors">
              <div className="text-center mb-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                  impact.status === 'good'
                    ? 'bg-status-success/20'
                    : impact.status === 'warning'
                    ? 'bg-status-warning/20'
                    : 'bg-status-info/20'
                }`}>
                  <impact.icon
                    size={32}
                    className={
                      impact.status === 'good'
                        ? 'text-status-success'
                        : impact.status === 'warning'
                        ? 'text-status-warning'
                        : 'text-status-info'
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Weather Factor
                  </div>
                  <div className="text-lg font-semibold text-gray-100">
                    {impact.weatherFactor}
                  </div>
                  <div className="text-sm text-polar-400 font-medium">
                    {impact.currentValue}
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown size={24} className="text-gray-600" />
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Impact On
                  </div>
                  <div className="text-base font-semibold text-gray-100">
                    {impact.impact}
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown size={24} className="text-gray-600" />
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Result
                  </div>
                  <div className={`text-lg font-bold ${
                    impact.status === 'good'
                      ? 'text-status-success'
                      : impact.status === 'warning'
                      ? 'text-status-warning'
                      : 'text-gray-100'
                  }`}>
                    {impact.result}
                  </div>
                </div>

                <div className="pt-3 border-t border-dark-border">
                  <p className="text-xs text-gray-400 text-center">
                    {impact.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* AI ENERGY FORECAST SECTION (Separate) */}
      <div className="border-t-2 border-polar-600/30 pt-6">
        <div className="flex items-center space-x-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-100">AI Energy Forecast</h2>
          <Badge variant="warning" size="sm">
            <TrendingUp size={14} className="mr-1" />
            Separate Model
          </Badge>
        </div>

        <div className="bg-polar-900/20 border border-polar-600/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className="text-polar-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-300">
                <strong className="text-polar-400">Note:</strong> The AI Energy Forecast uses weather
                predictions as input but applies a separate XGBoost model trained on historical energy
                patterns. Weather forecasting and energy forecasting are distinct processes.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader
            title="Wind Generation Forecast"
            subtitle="AI-predicted renewable power output (48 hours)"
            action={
              <Badge variant="success" size="sm">XGBoost Model</Badge>
            }
          />
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={energyForecast.filter((_, i) => i % 3 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis
                  dataKey="hour"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: 'Hours Ahead', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141b2d',
                    border: '1px solid #2d3748',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatPower(value), 'Predicted Power']}
                />
                <Area
                  type="monotone"
                  dataKey="confidenceUpper"
                  stroke="none"
                  fill="#10b981"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="confidenceLower"
                  stroke="none"
                  fill="#10b981"
                  fillOpacity={0.1}
                />
                <Line
                  type="monotone"
                  dataKey="predictedWindPower"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={false}
                  name="Predicted Power"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-1 bg-renewable mr-2" />
                <span className="text-gray-400">AI Forecast</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-renewable/20 mr-2" />
                <span className="text-gray-400">95% Confidence Interval</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* WEATHER RISK SECTION */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Weather Risk Assessment</h2>

        <Card className={`border-2 ${
          weatherRisk.level === 'critical'
            ? 'border-status-critical/30 bg-status-critical/5'
            : weatherRisk.level === 'warning'
            ? 'border-status-warning/30 bg-status-warning/5'
            : 'border-status-success/30 bg-status-success/5'
        }`}>
          <div className="flex items-start space-x-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              weatherRisk.level === 'critical'
                ? 'bg-status-critical/20'
                : weatherRisk.level === 'warning'
                ? 'bg-status-warning/20'
                : 'bg-status-success/20'
            }`}>
              {weatherRisk.level === 'normal' ? (
                <Snowflake size={28} className="text-status-success" />
              ) : (
                <AlertTriangle size={28} className="text-status-warning" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-100">
                  Weather Risk: {weatherRisk.level.toUpperCase()}
                </h3>
                <Badge
                  variant={
                    weatherRisk.level === 'critical'
                      ? 'critical'
                      : weatherRisk.level === 'warning'
                      ? 'warning'
                      : 'success'
                  }
                >
                  {weatherRisk.level.toUpperCase()}
                </Badge>
              </div>
              <p className="text-gray-300 mb-4">{weatherRisk.message}</p>

              <div className="space-y-3">
                {weatherRisk.factors.map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-dark-surface rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <StatusIndicator status={factor.status} size="sm" showLabel={false} />
                      <span className="text-sm font-medium text-gray-100 capitalize">
                        {factor.type}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">{factor.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Source Information */}
      <Card className="bg-dark-surface/50">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="mb-2">
              <strong className="text-gray-300">Data Sources:</strong>
            </p>
            <ul className="space-y-1 ml-4">
              <li>• <strong>Current Weather:</strong> {currentWeather.dataSource} (Real-time)</li>
              <li>• <strong>Weather Forecast:</strong> Weather Service API (Updated hourly)</li>
              <li>• <strong>Energy Forecast:</strong> POLAR-EMS AI Model (XGBoost, trained on historical data)</li>
              <li>• <strong>Status:</strong> All systems operational, data is simulated for demonstration</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
