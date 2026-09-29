import { useState } from 'react';
import {
  Zap,
  Shield,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  Activity,
  Target,
  Brain,
  Wind,
  Battery,
  Play,
} from 'lucide-react';
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPower, formatPercent, formatEnergy } from '@/utils/format';
import { cn } from '@/utils/cn';

/**
 * Energy Optimization & Dispatch Page
 * AI-driven optimization of energy dispatch schedule
 */

interface OptimizationInput {
  forecastedLoad: number[];
  forecastedWind: number[];
  batterySoc: number;
  generatorAvailability: {
    gen1: boolean;
    gen2: boolean;
    gen3: boolean;
  };
  criticalLoadReq: number;
  reserveReq: number;
}

interface DispatchSchedule {
  hour: number;
  time: string;
  load: number;
  wind: number;
  batteryCharge: number;
  batteryDischarge: number;
  gen1: number;
  gen2: number;
  reserve: number;
  action: string;
}

interface OptimizationResult {
  schedule: DispatchSchedule[];
  decisions: {
    generator: string[];
    battery: string[];
    loadShifting: string[];
    renewableUtilization: string;
  };
  whySchedule: string[];
  comparison: {
    ruleBased: {
      fuelConsumed: number;
      renewableShare: number;
      unmetLoad: number;
    };
    aiOptimized: {
      fuelConsumed: number;
      renewableShare: number;
      unmetLoad: number;
    };
    savings: {
      fuelSaved: number;
      renewableIncrease: number;
      reliability: number;
    };
  };
}

// Mock optimization inputs
const mockInputs: OptimizationInput = {
  forecastedLoad: Array.from({ length: 24 }, (_, i) => {
    const baseLoad = 120;
    const morningPeak = i >= 6 && i <= 9 ? 25 : 0;
    const eveningPeak = i >= 18 && i <= 21 ? 30 : 0;
    const nightDrop = i >= 0 && i <= 5 ? -20 : 0;
    return baseLoad + morningPeak + eveningPeak + nightDrop + Math.random() * 10;
  }),
  forecastedWind: Array.from({ length: 24 }, (_, i) => {
    const baseWind = 65;
    const daytimePeak = i >= 11 && i <= 15 ? 25 : 0;
    const nightBoost = i >= 22 || i <= 4 ? 15 : 0;
    return baseWind + daytimePeak + nightBoost + Math.random() * 10;
  }),
  batterySoc: 68,
  generatorAvailability: {
    gen1: true,
    gen2: true,
    gen3: false,
  },
  criticalLoadReq: 45,
  reserveReq: 20,
};

// Mock optimization result
const generateMockResult = (): OptimizationResult => {
  const schedule: DispatchSchedule[] = Array.from({ length: 24 }, (_, i) => {
    const load = mockInputs.forecastedLoad[i];
    const wind = mockInputs.forecastedWind[i];
    const surplus = wind - load;

    let batteryCharge = 0;
    let batteryDischarge = 0;
    let gen1 = 0;
    let gen2 = 0;
    let action = '';

    if (surplus > 10) {
      // High wind period - charge battery, minimize diesel
      batteryCharge = Math.min(surplus * 0.7, 30);
      gen1 = Math.max(30, load + batteryCharge - wind);
      gen2 = 0;
      action = 'Charge battery from excess wind';
    } else if (surplus < -20) {
      // High load, low wind - discharge battery, run generators
      batteryDischarge = Math.min(Math.abs(surplus) * 0.5, 25);
      const remaining = load - wind - batteryDischarge;
      gen1 = Math.min(remaining * 0.6, 60);
      gen2 = Math.max(0, remaining - gen1);
      action = 'Discharge battery + generators';
    } else {
      // Balanced period
      const deficit = Math.max(0, load - wind);
      if (deficit > 10) {
        batteryDischarge = Math.min(deficit * 0.3, 15);
        gen1 = deficit - batteryDischarge;
      } else {
        gen1 = deficit;
      }
      action = 'Balanced operation';
    }

    const reserve = gen1 + gen2 + batteryDischarge - (load - wind);

    return {
      hour: i,
      time: `${i.toString().padStart(2, '0')}:00`,
      load: Math.round(load * 10) / 10,
      wind: Math.round(wind * 10) / 10,
      batteryCharge: Math.round(batteryCharge * 10) / 10,
      batteryDischarge: Math.round(batteryDischarge * 10) / 10,
      gen1: Math.round(gen1 * 10) / 10,
      gen2: Math.round(gen2 * 10) / 10,
      reserve: Math.round(reserve * 10) / 10,
      action,
    };
  });

  return {
    schedule,
    decisions: {
      generator: [
        'Gen #1 operates continuously at variable output (30-60 kW)',
        'Gen #2 activated only during evening peak (18:00-21:00)',
        'Gen #3 kept in standby (currently unavailable)',
        'Generator ramp rates limited to 10 kW/hour for equipment protection',
      ],
      battery: [
        'Charge during high-wind periods (12:00-15:00, 80-95 kW wind)',
        'Discharge during evening peak to reduce diesel dependency',
        'Maintain SOC above 30% for emergency reserve',
        'Temperature-aware charging limits applied (-18°C ambient)',
      ],
      loadShifting: [
        'Defer non-critical lab equipment to 13:00-15:00 window',
        'Pre-heat habitation zones during wind peak (saves evening load)',
        'Schedule water pumping during renewable surplus periods',
      ],
      renewableUtilization: 'Maximize wind generation capture: 87.4% of available wind energy utilized, up from 68.3% baseline.',
    },
    whySchedule: [
      'High wind generation predicted between 12:00-15:00 provides opportunity to charge battery and reduce diesel runtime.',
      'Evening peak load (18:00-21:00) requires generator support but battery discharge offsets 35% of diesel requirement.',
      'Critical loads (45 kW) protected at all times with 20% reserve margin maintained.',
      'Generator #1 operates at optimal efficiency range (45-55 kW) rather than low-efficiency minimum load.',
      'Battery thermal management considered: charging limited during coldest hours (02:00-06:00) to prevent damage.',
      'Load-shifting opportunities identified: 8 kW of deferrable load moved to renewable-rich periods.',
    ],
    comparison: {
      ruleBased: {
        fuelConsumed: 156.8,
        renewableShare: 52.3,
        unmetLoad: 0.0,
      },
      aiOptimized: {
        fuelConsumed: 118.4,
        renewableShare: 68.7,
        unmetLoad: 0.0,
      },
      savings: {
        fuelSaved: 24.5,
        renewableIncrease: 16.4,
        reliability: 100.0,
      },
    },
  };
};

export default function OptimizationPage() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    toast.loading('Running AI optimization engine...', { id: 'optimization' });
    // Simulate optimization computation
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const optimizationResult = generateMockResult();
    setResult(optimizationResult);
    setIsOptimizing(false);
    const savings = optimizationResult.comparison.savings;
    toast.success('Optimization Complete!', {
      id: 'optimization',
      description: `Fuel savings: ${savings.fuelSaved.toFixed(1)}% · Renewable increase: +${savings.renewableIncrease.toFixed(1)}%`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Energy Optimization & Dispatch</h1>
          <p className="text-sm text-gray-400 mt-1">
            AI-driven 24-hour dispatch schedule optimization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="info" size="lg">
            <Brain size={16} className="mr-1" />
            AI Optimizer
          </Badge>
          <Badge variant="info" size="lg">
            <span className="mr-1">🔬</span>
            SIMULATED DATA
          </Badge>
        </div>
      </div>

      {/* Optimization Inputs */}
      <Card>
        <CardHeader
          title="Optimization Inputs"
          subtitle="Current conditions and forecasts for next 24 hours"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-dark-surface rounded-lg border border-dark-border">
            <div className="flex items-center space-x-2 mb-2">
              <Activity size={16} className="text-load" />
              <span className="text-xs text-gray-400">Forecasted Load</span>
            </div>
            <div className="text-xl font-bold text-gray-100">
              {formatPower(
                mockInputs.forecastedLoad.reduce((a, b) => a + b, 0) /
                  mockInputs.forecastedLoad.length
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">Avg over 24h</div>
          </div>

          <div className="p-4 bg-dark-surface rounded-lg border border-dark-border">
            <div className="flex items-center space-x-2 mb-2">
              <Wind size={16} className="text-renewable" />
              <span className="text-xs text-gray-400">Forecasted Wind</span>
            </div>
            <div className="text-xl font-bold text-gray-100">
              {formatPower(
                mockInputs.forecastedWind.reduce((a, b) => a + b, 0) /
                  mockInputs.forecastedWind.length
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">Avg over 24h</div>
          </div>

          <div className="p-4 bg-dark-surface rounded-lg border border-dark-border">
            <div className="flex items-center space-x-2 mb-2">
              <Battery size={16} className="text-battery" />
              <span className="text-xs text-gray-400">Battery SOC</span>
            </div>
            <div className="text-xl font-bold text-gray-100">
              {formatPercent(mockInputs.batterySoc)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Current state</div>
          </div>

          <div className="p-4 bg-dark-surface rounded-lg border border-dark-border">
            <div className="flex items-center space-x-2 mb-2">
              <Zap size={16} className="text-diesel" />
              <span className="text-xs text-gray-400">Generators</span>
            </div>
            <div className="text-xl font-bold text-gray-100">
              {Object.values(mockInputs.generatorAvailability).filter(Boolean).length}/3
            </div>
            <div className="text-xs text-gray-400 mt-1">Available</div>
          </div>

          <div className="p-4 bg-dark-surface rounded-lg border border-dark-border">
            <div className="flex items-center space-x-2 mb-2">
              <Shield size={16} className="text-status-critical" />
              <span className="text-xs text-gray-400">Critical Load</span>
            </div>
            <div className="text-xl font-bold text-gray-100">
              {formatPower(mockInputs.criticalLoadReq)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Must satisfy</div>
          </div>

          <div className="p-4 bg-dark-surface rounded-lg border border-dark-border">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={16} className="text-polar-400" />
              <span className="text-xs text-gray-400">Reserve Req.</span>
            </div>
            <div className="text-xl font-bold text-gray-100">
              {formatPercent(mockInputs.reserveReq)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Safety margin</div>
          </div>
        </div>

        {/* Run Optimization Button */}
        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || !!result}
            className={cn(
              'btn-primary btn-lg flex items-center space-x-2 px-8',
              (isOptimizing || result) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isOptimizing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : result ? (
              <>
                <CheckCircle2 size={20} />
                <span>Optimization Complete</span>
              </>
            ) : (
              <>
                <Play size={20} />
                <span>Run AI Optimization</span>
              </>
            )}
          </button>
          {result && (
            <button
              onClick={() => setResult(null)}
              className="btn-secondary btn-lg ml-4"
            >
              Reset
            </button>
          )}
        </div>
      </Card>

      {/* Optimization Results */}
      {result && (
        <div className="space-y-6 animate-slide-in">
          {/* Baseline Comparison */}
          <Card className="bg-gradient-to-br from-polar-900/30 to-dark-card">
            <CardHeader
              title="Performance Comparison"
              subtitle="Rule-based controller vs AI optimizer"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fuel Consumed */}
              <div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Fuel Consumed (24h)
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                    <span className="text-sm text-gray-300">Rule-Based</span>
                    <span className="text-lg font-bold text-gray-100">
                      {formatEnergy(result.comparison.ruleBased.fuelConsumed)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-polar-900/50 rounded-lg border border-polar-600/30">
                    <span className="text-sm text-polar-400 font-medium">AI Optimized</span>
                    <span className="text-lg font-bold text-polar-400">
                      {formatEnergy(result.comparison.aiOptimized.fuelConsumed)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-status-success/10 rounded-lg border border-status-success/30">
                    <span className="text-sm text-status-success font-medium">Saved</span>
                    <span className="text-lg font-bold text-status-success">
                      -{formatPercent(result.comparison.savings.fuelSaved)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Renewable Share */}
              <div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Renewable Share
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                    <span className="text-sm text-gray-300">Rule-Based</span>
                    <span className="text-lg font-bold text-gray-100">
                      {formatPercent(result.comparison.ruleBased.renewableShare)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-polar-900/50 rounded-lg border border-polar-600/30">
                    <span className="text-sm text-polar-400 font-medium">AI Optimized</span>
                    <span className="text-lg font-bold text-polar-400">
                      {formatPercent(result.comparison.aiOptimized.renewableShare)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-status-success/10 rounded-lg border border-status-success/30">
                    <span className="text-sm text-status-success font-medium">Increase</span>
                    <span className="text-lg font-bold text-status-success">
                      +{formatPercent(result.comparison.savings.renewableIncrease)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reliability */}
              <div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Load Reliability
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                    <span className="text-sm text-gray-300">Rule-Based</span>
                    <span className="text-lg font-bold text-gray-100">
                      {formatPercent(100 - result.comparison.ruleBased.unmetLoad)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-polar-900/50 rounded-lg border border-polar-600/30">
                    <span className="text-sm text-polar-400 font-medium">AI Optimized</span>
                    <span className="text-lg font-bold text-polar-400">
                      {formatPercent(100 - result.comparison.aiOptimized.unmetLoad)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-status-success/10 rounded-lg border border-status-success/30">
                    <span className="text-sm text-status-success font-medium">Status</span>
                    <span className="text-sm font-bold text-status-success flex items-center">
                      <CheckCircle2 size={16} className="mr-1" />
                      Perfect
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Dispatch Timeline Visualization */}
          <Card>
            <CardHeader
              title="24-Hour Dispatch Schedule"
              subtitle="Optimized energy source allocation"
            />
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={result.schedule}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="time"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  interval={2}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }} />
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
                  dataKey="load"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Load Demand"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="wind"
                  fill="#10b981"
                  fillOpacity={0.3}
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Wind Generation"
                />
                <Bar dataKey="gen1" stackId="gen" fill="#f59e0b" name="Generator #1" />
                <Bar dataKey="gen2" stackId="gen" fill="#f97316" name="Generator #2" />
                <Line
                  type="monotone"
                  dataKey="batteryDischarge"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Battery Discharge"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* Dispatch Schedule Table */}
          <Card>
            <CardHeader
              title="Detailed Dispatch Schedule"
              subtitle="Hour-by-hour allocation (showing first 12 hours)"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left p-3 text-gray-400 font-semibold">Time</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">Load</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">Wind</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">Bat. Charge</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">Bat. Discharge</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">Gen #1</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">Gen #2</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">Reserve</th>
                    <th className="text-left p-3 text-gray-400 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.slice(0, 12).map((row, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        'border-b border-dark-border hover:bg-dark-surface/50 transition-colors',
                        idx % 2 === 0 && 'bg-dark-surface/30'
                      )}
                    >
                      <td className="p-3 text-gray-100 font-medium">{row.time}</td>
                      <td className="p-3 text-right text-load">{row.load.toFixed(1)} kW</td>
                      <td className="p-3 text-right text-renewable">{row.wind.toFixed(1)} kW</td>
                      <td className="p-3 text-right text-battery">
                        {row.batteryCharge > 0 ? `+${row.batteryCharge.toFixed(1)} kW` : '-'}
                      </td>
                      <td className="p-3 text-right text-polar-400">
                        {row.batteryDischarge > 0 ? `-${row.batteryDischarge.toFixed(1)} kW` : '-'}
                      </td>
                      <td className="p-3 text-right text-diesel">
                        {row.gen1 > 0 ? `${row.gen1.toFixed(1)} kW` : '-'}
                      </td>
                      <td className="p-3 text-right text-diesel">
                        {row.gen2 > 0 ? `${row.gen2.toFixed(1)} kW` : '-'}
                      </td>
                      <td className="p-3 text-right text-status-success">
                        {row.reserve.toFixed(1)} kW
                      </td>
                      <td className="p-3 text-gray-300 text-sm">{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-center">
              <button className="btn-ghost btn-sm">View Full 24-Hour Schedule</button>
            </div>
          </Card>

          {/* AI Decision Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generator Decisions */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-diesel/20 flex items-center justify-center">
                  <Zap size={20} className="text-diesel" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">Generator Decisions</h3>
                  <p className="text-xs text-gray-400">Diesel generator optimization</p>
                </div>
              </div>
              <ul className="space-y-2">
                {result.decisions.generator.map((decision, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-gray-300">
                    <CheckCircle2 size={16} className="text-status-success flex-shrink-0 mt-0.5" />
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Battery Decisions */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-battery/20 flex items-center justify-center">
                  <Battery size={20} className="text-battery" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">Battery Decisions</h3>
                  <p className="text-xs text-gray-400">Energy storage management</p>
                </div>
              </div>
              <ul className="space-y-2">
                {result.decisions.battery.map((decision, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-gray-300">
                    <CheckCircle2 size={16} className="text-status-success flex-shrink-0 mt-0.5" />
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Load Shifting Decisions */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-polar-600/20 flex items-center justify-center">
                  <Activity size={20} className="text-polar-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">Load-Shifting Decisions</h3>
                  <p className="text-xs text-gray-400">Demand flexibility optimization</p>
                </div>
              </div>
              <ul className="space-y-2">
                {result.decisions.loadShifting.map((decision, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-gray-300">
                    <CheckCircle2 size={16} className="text-status-success flex-shrink-0 mt-0.5" />
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Renewable Utilization */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-renewable/20 flex items-center justify-center">
                  <Wind size={20} className="text-renewable" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">Renewable Utilization</h3>
                  <p className="text-xs text-gray-400">Wind power maximization</p>
                </div>
              </div>
              <p className="text-sm text-gray-300">{result.decisions.renewableUtilization}</p>
            </Card>
          </div>

          {/* Why This Schedule? */}
          <Card className="bg-gradient-to-br from-polar-900/30 to-dark-card">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-polar-600/30 flex items-center justify-center flex-shrink-0">
                <Brain size={20} className="text-polar-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">Why This Schedule?</h3>
                <p className="text-xs text-gray-400 mt-1">AI optimization reasoning</p>
              </div>
            </div>
            <div className="space-y-3">
              {result.whySchedule.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-4 bg-dark-surface/50 rounded-lg border border-dark-border"
                >
                  <Info size={16} className="text-polar-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{reason}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Optimization Objective */}
          <Card className="bg-dark-surface/50">
            <div className="flex items-start space-x-3">
              <Target size={20} className="text-polar-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-400">
                <p className="mb-2">
                  <strong className="text-gray-300">Optimization Objective:</strong>
                </p>
                <p className="mb-3">
                  Minimize fuel consumption and generator wear while satisfying all system
                  constraints.
                </p>
                <p className="mb-2">
                  <strong className="text-gray-300">Constraints Respected:</strong>
                </p>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 size={14} className="text-status-success" />
                    <span>Power balance (supply = demand at all times)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 size={14} className="text-status-success" />
                    <span>Generator minimum/maximum output limits</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 size={14} className="text-status-success" />
                    <span>Generator ramp rate limits (equipment protection)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 size={14} className="text-status-success" />
                    <span>Battery SOC limits (30-95%)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 size={14} className="text-status-success" />
                    <span>Temperature-aware battery constraints</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 size={14} className="text-status-success" />
                    <span>Reserve margin requirement (20%)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <AlertTriangle size={14} className="text-status-critical" />
                    <span className="font-semibold">
                      Critical-load protection (45 kW minimum at all times)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
