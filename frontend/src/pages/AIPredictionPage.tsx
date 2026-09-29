import { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Zap,
  Battery,
  Wind,
  AlertTriangle,
  RefreshCw,
  Clock,
  Calendar,
  Thermometer,
  Sparkles,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import {
  aiPredictionService,
  AIPredictionResponse,
  DayForecast,
} from '@/services/api/aiPrediction.service';

/**
 * AI Prediction Page
 * 7-Day Energy Forecast, Risk Assessment, and AI Recommendations for Polar Science Station
 */

const loadingStepMessages = [
  'Analyzing historical data...',
  'Processing current conditions...',
  'Generating 7-day forecast...',
  'Evaluating energy risks...',
  'Generating AI recommendations...',
];

export default function AIPredictionPage() {
  const [data, setData] = useState<AIPredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState<number>(0);
  const [selectedMetric, setSelectedMetric] = useState<'energy' | 'renewable' | 'battery' | 'generator'>('energy');
  const [selectedDay, setSelectedDay] = useState<DayForecast | null>(null);

  const fetchPrediction = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setLoadingStepIndex(0);
    } else {
      setLoading(true);
    }

    try {
      if (isRefresh) {
        // Step progress simulator
        for (let step = 0; step < loadingStepMessages.length; step++) {
          setLoadingStepIndex(step);
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }

      const res = await aiPredictionService.get7DayPrediction();
      setData(res);
      if (res['7day_forecast_table'] && res['7day_forecast_table'].length > 0) {
        setSelectedDay(res['7day_forecast_table'][3]); // Default to Day 4 (Peak Risk Day)
      }

      if (isRefresh) {
        toast.success(`Prediction updated at ${new Date().toLocaleTimeString()}`);
      }
    } catch {
      toast.error('Failed to load AI prediction data. Using simulated offline model.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 font-sans">
        <Brain className="text-polar-400 animate-pulse" size={48} />
        <div className="text-lg font-bold text-gray-200">AI 7-Day Prediction Pipeline Engine</div>
        <div className="flex items-center space-x-2 text-sm text-polar-400 font-mono">
          <RefreshCw size={16} className="animate-spin" />
          <span>{loadingStepMessages[loadingStepIndex] || 'Processing microgrid forecast...'}</span>
        </div>
      </div>
    );
  }

  const current = data.current_conditions;
  const daysTable = data['7day_forecast_table'];
  const chartSeries = data.chart_series;
  const demandPred = data.energy_demand_prediction;
  const renewablePred = data.renewable_generation_prediction;
  const batteryPred = data.battery_forecast;
  const genPred = data.generator_forecast;
  const risks = data.risk_assessment;
  const aiInsights = data.ai_insights;
  const aiRecs = data.ai_recommendations;

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* SECTION 2: PAGE HEADER */}
      <div className="bg-gradient-to-r from-dark-card via-polar-950/80 to-dark-card border border-dark-border p-5 rounded-xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <Brain className="text-polar-400" size={28} />
            <h1 className="text-2xl font-bold text-gray-100">AI Energy Prediction</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            7-day forecast for energy demand, renewable generation, battery health, and operational recommendations.
          </p>
        </div>

        {/* Top Indicators & Actions */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="bg-dark-surface px-3 py-1.5 rounded-lg border border-dark-border flex items-center space-x-2">
            <span className="text-gray-400">Prediction Status:</span>
            <span className="text-status-success font-bold flex items-center">
              <span className="w-2 h-2 rounded-full bg-status-success inline-block mr-1.5 animate-pulse" />
              {data.prediction_status}
            </span>
          </div>

          <div className="bg-dark-surface px-3 py-1.5 rounded-lg border border-dark-border flex items-center space-x-2">
            <Clock size={14} className="text-polar-400" />
            <span className="text-gray-400">Data Updated:</span>
            <span className="text-gray-200">{new Date(data.updated_at).toLocaleTimeString()}</span>
          </div>

          <div className="bg-dark-surface px-3 py-1.5 rounded-lg border border-dark-border flex items-center space-x-2">
            <Calendar size={14} className="text-polar-400" />
            <span className="text-gray-400">Horizon:</span>
            <span className="text-polar-300 font-bold">{data.prediction_horizon}</span>
          </div>

          {/* SECTION 20: REFRESH PREDICTION BUTTON */}
          <button
            onClick={() => fetchPrediction(true)}
            disabled={refreshing}
            className="btn-primary text-xs flex items-center space-x-2 py-2 px-4 shadow-lg hover:shadow-polar-500/20"
          >
            <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
            <span>{refreshing ? 'REFRESHING...' : 'REFRESH PREDICTION'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 5: CURRENT CONDITIONS */}

      {/* SECTION 5: CURRENT CONDITIONS */}
      <Card>
        <CardHeader
          title="CURRENT CONDITIONS"
          subtitle="Actual real-time telemetry from polar research station sensors"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 font-mono text-xs">
          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl">
            <div className="text-[11px] text-gray-400 flex items-center space-x-1 mb-1">
              <Thermometer size={14} className="text-blue-400" />
              <span>Temperature</span>
            </div>
            <div className="text-lg font-bold text-gray-100">{current.temperature_c}°C</div>
            <div className="text-[10px] text-gray-500">Severe Cold</div>
          </div>

          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl">
            <div className="text-[11px] text-gray-400 flex items-center space-x-1 mb-1">
              <Wind size={14} className="text-cyan-400" />
              <span>Wind Speed</span>
            </div>
            <div className="text-lg font-bold text-polar-300">{current.wind_speed_ms} m/s</div>
            <div className="text-[10px] text-gray-500">Moderate Wind</div>
          </div>

          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl">
            <div className="text-[11px] text-gray-400 flex items-center space-x-1 mb-1">
              <Sparkles size={14} className="text-yellow-400" />
              <span>Weather</span>
            </div>
            <div className="text-sm font-bold text-gray-200 truncate mt-1">{current.weather_condition}</div>
            <div className="text-[10px] text-gray-500">Telemetry Active</div>
          </div>

          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl">
            <div className="text-[11px] text-gray-400 flex items-center space-x-1 mb-1">
              <Zap size={14} className="text-yellow-400" />
              <span>Current Load</span>
            </div>
            <div className="text-lg font-bold text-yellow-400">{current.current_load_kw} kW</div>
            <div className="text-[10px] text-gray-500">Station Demand</div>
          </div>

          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl">
            <div className="text-[11px] text-gray-400 flex items-center space-x-1 mb-1">
              <Wind size={14} className="text-polar-400" />
              <span>Renewable</span>
            </div>
            <div className="text-lg font-bold text-polar-400">{current.renewable_generation_kw} kW</div>
            <div className="text-[10px] text-gray-500">Wind Turbine Output</div>
          </div>

          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl">
            <div className="text-[11px] text-gray-400 flex items-center space-x-1 mb-1">
              <Battery size={14} className="text-emerald-400" />
              <span>Battery SOC</span>
            </div>
            <div className="text-lg font-bold text-emerald-400">{current.battery_soc_percent}%</div>
            <div className="text-[10px] text-gray-500">Buffer Reserve</div>
          </div>

          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl col-span-2 sm:col-span-1">
            <div className="text-[11px] text-gray-400 flex items-center space-x-1 mb-1">
              <Flame size={14} className="text-orange-400" />
              <span>Generator</span>
            </div>
            <div className="text-sm font-bold text-status-success mt-1">{current.generator_status}</div>
            <div className="text-[10px] text-gray-500">Ready on Demand</div>
          </div>
        </div>
      </Card>

      {/* SECTION 6 & 17: 7-DAY FORECAST TABLE & INTERACTIVE DAY DETAIL INSPECTOR */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-3 mb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Calendar className="text-polar-400" size={18} />
              7-Day AI Forecast Summary
            </h2>
            <p className="text-xs text-gray-400">Click any day to inspect detailed forecasts and recommendations</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-dark-border text-gray-400 uppercase text-[11px]">
                <th className="py-2.5 px-3">Day</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Energy Demand</th>
                <th className="py-2.5 px-3">Renewable</th>
                <th className="py-2.5 px-3">Battery SOC</th>
                <th className="py-2.5 px-3">Generator Need</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              {daysTable.map((row) => {
                const isSelected = selectedDay?.day_index === row.day_index;
                const isHighRisk = row.risk_level === 'HIGH';
                const isMedRisk = row.risk_level === 'MEDIUM';

                return (
                  <tr
                    key={row.day_index}
                    onClick={() => setSelectedDay(row)}
                    className={cn(
                      'cursor-pointer transition-all hover:bg-polar-900/20',
                      isSelected && 'bg-polar-900/40 font-semibold ring-1 ring-polar-500/40'
                    )}
                  >
                    <td className="py-3 px-3 font-bold text-gray-100">{row.label}</td>
                    <td className="py-3 px-3 text-gray-400">{row.date}</td>
                    <td className="py-3 px-3 text-yellow-400 font-bold">{row.demand_kwh} kWh</td>
                    <td className="py-3 px-3 text-polar-400 font-bold">{row.renewable_kwh} kWh</td>
                    <td className="py-3 px-3 text-emerald-400">{row.battery_soc_percent}%</td>
                    <td className="py-3 px-3">
                      <span className={cn(row.generator_need_hours > 0 ? 'text-orange-400 font-bold' : 'text-gray-400')}>
                        {row.generator_need_hours} h ({row.generator_need_level})
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={isHighRisk ? 'critical' : isMedRisk ? 'warning' : 'success'} size="sm">
                        {row.risk_level}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(row);
                        }}
                        className="text-[11px] px-2 py-1 rounded bg-dark-bg border border-dark-border text-polar-300 hover:border-polar-400"
                      >
                        {isSelected ? 'Inspecting' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Day Inspector Box */}
        {selectedDay && (
          <div className="mt-4 p-4 bg-polar-950/40 border border-polar-600/40 rounded-xl animate-fade-in font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-polar-600/30 pb-2 mb-3 gap-2">
              <div className="flex items-center space-x-2">
                <Badge variant={selectedDay.risk_level === 'HIGH' ? 'critical' : selectedDay.risk_level === 'MEDIUM' ? 'warning' : 'success'} size="md">
                  {selectedDay.label} Inspector
                </Badge>
                <span className="text-xs font-mono text-gray-300">{selectedDay.date} ({selectedDay.day_name})</span>
              </div>
              <span className="text-xs font-mono text-polar-300">{selectedDay.weather_condition}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-dark-card border border-dark-border rounded-lg">
                <span className="text-gray-400 block text-[10px]">PREDICTED DEMAND VS RENEWABLE</span>
                <div className="mt-1 text-sm font-bold text-gray-100">
                  Demand: <span className="text-yellow-400">{selectedDay.demand_kwh} kWh</span>
                </div>
                <div className="text-sm font-bold text-gray-100">
                  Renewable: <span className="text-polar-400">{selectedDay.renewable_kwh} kWh</span>
                </div>
              </div>

              <div className="p-3 bg-dark-card border border-dark-border rounded-lg">
                <span className="text-gray-400 block text-[10px]">BATTERY & GENERATOR NEED</span>
                <div className="mt-1 text-sm font-bold text-gray-100">
                  Battery SOC: <span className="text-emerald-400">{selectedDay.battery_soc_percent}%</span>
                </div>
                <div className="text-sm font-bold text-gray-100">
                  Generator Runtime: <span className="text-orange-400">{selectedDay.generator_need_hours} Hours</span>
                </div>
              </div>

              <div className="p-3 bg-dark-card border border-dark-border rounded-lg">
                <span className="text-gray-400 block text-[10px]">WEATHER IMPACT & AI ADVICE</span>
                <div className="mt-1 text-xs text-gray-300 font-sans">
                  Temp: <span className="font-mono text-blue-400">{selectedDay.temperature_c}°C</span> | Wind: <span className="font-mono text-cyan-400">{selectedDay.wind_speed_ms} m/s</span>
                </div>
                <p className="mt-1 text-xs text-polar-300 font-sans italic">"{selectedDay.ai_day_advice}"</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* SECTION 7: MAIN FORECAST CHART */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-3 mb-4 gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-100">7-Day Energy Forecast Chart</h3>
            <p className="text-xs text-gray-400">Interactive trend visualization for demand, renewables, battery SOC, and generator requirement</p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex space-x-1 bg-dark-bg p-1 rounded-lg border border-dark-border font-mono text-xs">
            {(['energy', 'renewable', 'battery', 'generator'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={cn(
                  'px-3 py-1.5 rounded-md uppercase font-semibold transition-all',
                  selectedMetric === metric ? 'bg-polar-600 text-white' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {selectedMetric === 'energy' ? (
              <AreaChart data={chartSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} unit=" kWh" />
                <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#2d3748', borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Area type="monotone" dataKey="demand_kwh" name="Predicted Energy Demand (kWh)" stroke="#eab308" fillOpacity={1} fill="url(#colorDemand)" />
                <Area type="monotone" dataKey="available_supply_kwh" name="Available Supply Capacity (kWh)" stroke="#38bdf8" fillOpacity={1} fill="url(#colorSupply)" />
              </AreaChart>
            ) : selectedMetric === 'renewable' ? (
              <AreaChart data={chartSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRenewable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} unit=" kWh" />
                <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#2d3748', borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Area type="monotone" dataKey="renewable_kwh" name="Predicted Wind Generation (kWh)" stroke="#38bdf8" fillOpacity={1} fill="url(#colorRenewable)" />
              </AreaChart>
            ) : selectedMetric === 'battery' ? (
              <LineChart data={chartSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#2d3748', borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <ReferenceLine y={35} label={{ value: 'Reserve Limit (35%)', fill: '#ef4444', fontSize: 11 }} stroke="#ef4444" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="battery_soc_percent" name="Predicted Battery SOC (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            ) : (
              <BarChart data={chartSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} unit=" kW" />
                <Tooltip contentStyle={{ backgroundColor: '#141b2d', borderColor: '#2d3748', borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Bar dataKey="generator_kw" name="Generator Output Requirement (kW)" fill="#fb923c" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* SECTION 8, 9, 10, 11, 12: DETAILED PREDICTION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* SECTION 8: ENERGY DEMAND PREDICTION */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Zap className="text-yellow-400" size={18} />
              Energy Demand Forecast
            </h3>
            <Badge variant="warning" size="sm">
              Trend: {demandPred.trend}
            </Badge>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Current Load:</span>
              <span className="font-bold text-yellow-400">{demandPred.current_load_kw} kW</span>
            </div>
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">7-Day Average Demand:</span>
              <span className="font-bold text-gray-100">{demandPred['7day_avg_kwh']} kWh/day</span>
            </div>
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Min / Max Predicted:</span>
              <span className="font-bold text-gray-100">{demandPred['7day_min_kwh']} / {demandPred['7day_max_kwh']} kWh</span>
            </div>

            <p className="text-xs text-gray-400 font-sans mt-2 leading-relaxed">
              {demandPred.trend_explanation}
            </p>
          </div>
        </Card>

        {/* SECTION 9: RENEWABLE GENERATION PREDICTION */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Wind className="text-polar-400" size={18} />
              Renewable Generation
            </h3>
            <Badge variant="info" size="sm">
              {renewablePred.expected_contribution_percent}% Share
            </Badge>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">7-Day Wind Output:</span>
              <span className="font-bold text-polar-400">{renewablePred['7day_total_kwh']} kWh</span>
            </div>
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">High-Generation Window:</span>
              <span className="font-bold text-status-success">{renewablePred.high_generation_period}</span>
            </div>
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Low-Generation Window:</span>
              <span className="font-bold text-status-critical">{renewablePred.low_generation_period}</span>
            </div>

            <p className="text-xs text-gray-400 font-sans mt-2 leading-relaxed">
              "{renewablePred.insight}"
            </p>
          </div>
        </Card>

        {/* SECTION 10: BATTERY FORECAST & RESERVE RISK */}
        <Card className={cn(batteryPred.has_reserve_risk && 'border-status-critical/50 bg-status-critical/5')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Battery className="text-emerald-400" size={18} />
              Battery Forecast
            </h3>
            <Badge variant={batteryPred.has_reserve_risk ? 'critical' : 'success'} size="sm">
              Min: {batteryPred.min_predicted_soc_percent}%
            </Badge>
          </div>

          {batteryPred.has_reserve_risk && (
            <div className="p-2.5 mb-3 bg-status-critical/20 border border-status-critical/40 rounded-lg flex items-center space-x-2 text-status-critical text-xs font-bold font-mono">
              <AlertTriangle size={16} />
              <span>⚠ BATTERY RESERVE RISK (SOC &lt; 35%)</span>
            </div>
          )}

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Current SOC:</span>
              <span className="font-bold text-emerald-400">{batteryPred.current_soc_percent}%</span>
            </div>
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Predicted SOC Range:</span>
              <span className="font-bold text-gray-100">{batteryPred.min_predicted_soc_percent}% – {batteryPred.max_predicted_soc_percent}%</span>
            </div>
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Discharge Window:</span>
              <span className="font-bold text-yellow-400">{batteryPred.expected_discharge_period}</span>
            </div>
          </div>
        </Card>

        {/* SECTION 11: GENERATOR REQUIREMENT */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Flame className="text-orange-400" size={18} />
              Generator Requirement
            </h3>
            <Badge variant="warning" size="sm">
              {genPred.total_runtime_hours}h Needed
            </Badge>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Predicted Runtime:</span>
              <span className="font-bold text-orange-400">{genPred.total_runtime_hours} Hours</span>
            </div>
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Peak Demand Period:</span>
              <span className="font-bold text-gray-100">{genPred.high_demand_period}</span>
            </div>
            <div className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Backup Readiness:</span>
              <span className="font-bold text-status-success">Auto-Start Ready</span>
            </div>

            <p className="text-xs text-gray-400 font-sans mt-2 leading-relaxed">
              "{genPred.insight}"
            </p>
          </div>
        </Card>


      </div>

      {/* SECTION 13: 7-DAY RISK ASSESSMENT */}
      <Card>
        <CardHeader
          title="7-DAY RISK ASSESSMENT"
          subtitle="Calculated risk ratings based on 7-day predicted microgrid energy balance"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-3.5 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-xs font-medium text-gray-400">Energy Shortage Risk</span>
            <div className="my-2">
              <Badge variant={risks.energy_shortage_risk === 'HIGH' ? 'critical' : 'success'} size="md">
                🔴 {risks.energy_shortage_risk}
              </Badge>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">Days 4–5 Deficit</span>
          </div>

          <div className="p-3.5 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-xs font-medium text-gray-400">Battery Reserve Risk</span>
            <div className="my-2">
              <Badge variant={risks.battery_reserve_risk === 'HIGH' ? 'critical' : 'warning'} size="md">
                🟡 {risks.battery_reserve_risk}
              </Badge>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">Min SOC 32%</span>
          </div>

          <div className="p-3.5 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-xs font-medium text-gray-400">Generator Dependency</span>
            <div className="my-2">
              <Badge variant={risks.generator_dependency === 'HIGH' ? 'critical' : 'warning'} size="md">
                🔴 {risks.generator_dependency}
              </Badge>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">19 Hours Required</span>
          </div>

          <div className="p-3.5 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-xs font-medium text-gray-400">Critical-Load Risk</span>
            <div className="my-2">
              <Badge variant="success" size="md">
                🟢 {risks.critical_load_risk}
              </Badge>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">100% Protected</span>
          </div>

          <div className="p-3.5 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-xs font-medium text-gray-400">Renewable Uncertainty</span>
            <div className="my-2">
              <Badge variant="warning" size="md">
                🟡 {risks.renewable_uncertainty}
              </Badge>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">Wind Shift Expected</span>
          </div>
        </div>
      </Card>

      {/* SECTION 14 & 15: AI INSIGHTS & AI RECOMMENDATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 14: AI INSIGHTS */}
        <Card className="bg-gradient-to-br from-polar-950/40 via-dark-card to-dark-card border-polar-600/30">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="text-polar-400" size={20} />
            <h3 className="text-base font-bold text-gray-100">AI INSIGHTS</h3>
          </div>

          <div className="space-y-2.5 text-xs text-gray-200">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="p-2.5 bg-dark-surface/60 border border-dark-border rounded-lg flex items-start space-x-2.5">
                <span className="text-polar-400 font-bold font-mono">0{idx + 1}.</span>
                <p className="leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 15: AI RECOMMENDATIONS */}
        <Card className="bg-dark-card border-dark-border">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="text-yellow-400" size={20} />
            <h3 className="text-base font-bold text-gray-100">AI RECOMMENDATIONS</h3>
          </div>

          <div className="space-y-3 text-xs">
            {aiRecs.map((rec) => (
              <div key={rec.id} className="p-3 bg-dark-surface border border-dark-border rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-100">{rec.title}</h4>
                  <Badge variant={rec.type === 'RECOMMENDATION' ? 'warning' : 'info'} size="sm">
                    {rec.type}
                  </Badge>
                </div>
                <p className="text-gray-300 leading-relaxed font-sans mt-1">{rec.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}
