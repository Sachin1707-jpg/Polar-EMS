import { useState } from 'react';
import {
  Wind,
  Zap,
  Battery,
  Beaker,
  Home,
  Radio,
  Shield,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
  Info,
  Lightbulb,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPower } from '@/utils/format';
import { cn } from '@/utils/cn';

/**
 * Station Visualization Page
 * Interactive polar station energy flow visualization
 */

type ComponentType =
  | 'wind'
  | 'diesel'
  | 'battery'
  | 'research'
  | 'habitation'
  | 'communications'
  | 'critical';

interface Component {
  id: string;
  type: ComponentType;
  name: string;
  icon: typeof Wind;
  power: number;
  status: 'online' | 'offline' | 'warning';
  health: number;
  description: string;
  recentEvents: string[];
  aiRecommendation: string | null;
  alerts: number;
}

// interface EnergyFlow { from: string; to: string; power: number; active: boolean; }

// Mock component data
const mockComponents: Component[] = [
  {
    id: 'wind-turbine',
    type: 'wind',
    name: 'Wind Turbine System',
    icon: Wind,
    power: 85.4,
    status: 'online',
    health: 94,
    description: '3x 30kW wind turbines providing primary renewable generation',
    recentEvents: [
      'Wind speed: 12.3 m/s (optimal range)',
      'Power output increased to 85.4 kW (3 min ago)',
      'All turbines operational',
    ],
    aiRecommendation: 'Optimal wind conditions. Charging battery at 20 kW.',
    alerts: 0,
  },
  {
    id: 'diesel-gen',
    type: 'diesel',
    name: 'Diesel Generators',
    icon: Zap,
    power: 35.2,
    status: 'online',
    health: 88,
    description: '3x 60kW diesel generators (Gen #1 active, Gen #2 standby)',
    recentEvents: [
      'Gen #1 operating at 35.2 kW (58% capacity)',
      'Gen #2 in standby mode',
      'Gen #3 offline (scheduled maintenance)',
    ],
    aiRecommendation: 'Consider reducing Gen #1 output during high wind period.',
    alerts: 1,
  },
  {
    id: 'battery',
    type: 'battery',
    name: 'Battery Storage',
    icon: Battery,
    power: -18.5,
    status: 'online',
    health: 96,
    description: '200 kWh lithium battery bank (currently charging)',
    recentEvents: [
      'SOC: 68% (+2% in last hour)',
      'Charging at 18.5 kW from wind surplus',
      'Temperature: -12°C (within safe range)',
    ],
    aiRecommendation: 'Charging during high wind period. Will reach 85% in 2.3 hours.',
    alerts: 0,
  },
  {
    id: 'research-labs',
    type: 'research',
    name: 'Research Laboratories',
    icon: Beaker,
    power: 42.8,
    status: 'online',
    health: 100,
    description: 'Scientific equipment and lab facilities',
    recentEvents: [
      'Ice core analysis equipment: 12.5 kW',
      'Atmospheric monitoring: 8.3 kW',
      'General lab equipment: 22.0 kW',
    ],
    aiRecommendation: 'Defer non-critical lab operations to 13:00-15:00 wind peak window.',
    alerts: 0,
  },
  {
    id: 'habitation',
    type: 'habitation',
    name: 'Living Quarters',
    icon: Home,
    power: 28.4,
    status: 'online',
    health: 100,
    description: 'Heating, lighting, and life support for crew',
    recentEvents: [
      'Heating: 18.5 kW (external temp: -18°C)',
      'Lighting: 4.2 kW',
      'Ventilation & life support: 5.7 kW',
    ],
    aiRecommendation: 'Pre-heat habitation during wind peak to reduce evening load.',
    alerts: 0,
  },
  {
    id: 'communications',
    type: 'communications',
    name: 'Communications',
    icon: Radio,
    power: 8.6,
    status: 'online',
    health: 100,
    description: 'Satellite and radio communication systems',
    recentEvents: [
      'Satellite uplink: 5.2 kW',
      'Radio systems: 2.1 kW',
      'Network equipment: 1.3 kW',
    ],
    aiRecommendation: null,
    alerts: 0,
  },
  {
    id: 'critical-infrastructure',
    type: 'critical',
    name: 'Critical Infrastructure',
    icon: Shield,
    power: 12.4,
    status: 'online',
    health: 100,
    description: 'Water treatment, fire suppression, emergency systems',
    recentEvents: [
      'Water treatment: 6.8 kW',
      'Fire suppression: 2.3 kW',
      'Emergency systems: 3.3 kW',
    ],
    aiRecommendation: null,
    alerts: 0,
  },
];

// Mock energy flows (currently using hardcoded flows in component)
// const mockEnergyFlows: EnergyFlow[] = [
//   { from: 'wind-turbine', to: 'research-labs', power: 32.1, active: true },
//   { from: 'wind-turbine', to: 'habitation', power: 28.4, active: true },
//   { from: 'wind-turbine', to: 'battery', power: 18.5, active: true },
//   { from: 'diesel-gen', to: 'communications', power: 8.6, active: true },
//   { from: 'diesel-gen', to: 'research-labs', power: 10.7, active: true },
//   { from: 'diesel-gen', to: 'critical-infrastructure', power: 12.4, active: true },
//   { from: 'battery', to: 'habitation', power: 0, active: false },
// ];

const componentConfig: Record<
  ComponentType,
  { color: string; bgColor: string; borderColor: string }
> = {
  wind: { color: 'text-renewable', bgColor: 'bg-renewable/10', borderColor: 'border-renewable/40' },
  diesel: { color: 'text-diesel', bgColor: 'bg-diesel/10', borderColor: 'border-diesel/40' },
  battery: { color: 'text-battery', bgColor: 'bg-battery/10', borderColor: 'border-battery/40' },
  research: { color: 'text-gray-300', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/40' },
  habitation: { color: 'text-gray-300', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/40' },
  communications: { color: 'text-gray-300', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/40' },
  critical: { color: 'text-status-critical', bgColor: 'bg-status-critical/10', borderColor: 'border-status-critical/40' },
};

export default function StationPage() {
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  const handleComponentClick = (component: Component) => {
    setSelectedComponent(component);
  };

  const handleClose = () => {
    setSelectedComponent(null);
  };

  const totalGeneration = mockComponents
    .filter((c) => c.type === 'wind' || c.type === 'diesel')
    .reduce((sum, c) => sum + c.power, 0);

  const totalLoad = mockComponents
    .filter((c) => c.type === 'research' || c.type === 'habitation' || c.type === 'communications' || c.type === 'critical')
    .reduce((sum, c) => sum + c.power, 0);

  const batteryPower = mockComponents.find((c) => c.type === 'battery')?.power || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Polar Station Visualization</h1>
          <p className="text-sm text-gray-400 mt-1">
            Interactive energy flow and component status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success" size="lg">
            <CheckCircle2 size={16} className="mr-1" />
            All Systems Operational
          </Badge>
          <Badge variant="info" size="lg">
            <span className="mr-1">🔬</span>
            SIMULATED DATA
          </Badge>
        </div>
      </div>

      {/* Energy Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-renewable/10 to-dark-card border-renewable/30">
          <div className="flex items-center justify-between mb-2">
            <Activity size={20} className="text-renewable" />
            <TrendingUp size={16} className="text-status-success" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Generation</div>
          <div className="text-2xl font-bold text-gray-100">{formatPower(totalGeneration)}</div>
          <div className="text-xs text-gray-400 mt-1">Wind + Diesel</div>
        </Card>

        <Card className="bg-gradient-to-br from-load/10 to-dark-card border-load/30">
          <div className="flex items-center justify-between mb-2">
            <Zap size={20} className="text-load" />
            <Activity size={16} className="text-gray-400" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Load</div>
          <div className="text-2xl font-bold text-gray-100">{formatPower(totalLoad)}</div>
          <div className="text-xs text-gray-400 mt-1">Station consumption</div>
        </Card>

        <Card className={cn(
          'bg-gradient-to-br to-dark-card',
          batteryPower < 0 ? 'from-battery/10 border-battery/30' : 'from-status-warning/10 border-status-warning/30'
        )}>
          <div className="flex items-center justify-between mb-2">
            <Battery size={20} className={batteryPower < 0 ? 'text-battery' : 'text-status-warning'} />
            <Activity size={16} className="text-gray-400" />
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Battery</div>
          <div className="text-2xl font-bold text-gray-100">
            {batteryPower < 0 ? 'Charging' : 'Discharging'}
          </div>
          <div className="text-xs text-gray-400 mt-1">{formatPower(Math.abs(batteryPower))}</div>
        </Card>
      </div>

      {/* Station Visualization */}
      <Card className="bg-gradient-to-br from-polar-900/30 to-dark-card">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Polar Research Station</h2>
            <p className="text-sm text-gray-400">Click any component for detailed information</p>
          </div>

          {/* Visualization Grid */}
          <div className="relative max-w-6xl mx-auto">
            {/* Top Row: Generation Sources */}
            <div className="grid grid-cols-3 gap-8 mb-16">
              {/* Wind Turbine */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleComponentClick(mockComponents[0])}
                  className="group relative"
                >
                  <div
                    className={cn(
                      'w-32 h-32 rounded-2xl border-2 flex items-center justify-center transition-all duration-300',
                      'hover:scale-110 hover:shadow-glow cursor-pointer',
                      componentConfig.wind.bgColor,
                      componentConfig.wind.borderColor
                    )}
                  >
                    <Wind size={48} className={componentConfig.wind.color} />
                  </div>
                  {mockComponents[0].alerts > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-status-warning rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{mockComponents[0].alerts}</span>
                    </div>
                  )}
                </button>
                <div className="mt-3 text-center">
                  <div className="text-sm font-semibold text-gray-100">{mockComponents[0].name}</div>
                  <div className="text-xs text-renewable font-medium">{formatPower(mockComponents[0].power)}</div>
                  <Badge variant="success" size="sm" className="mt-1">
                    <CheckCircle2 size={10} className="mr-1" />
                    Online
                  </Badge>
                </div>
              </div>

              {/* Battery */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleComponentClick(mockComponents[2])}
                  className="group relative"
                >
                  <div
                    className={cn(
                      'w-32 h-32 rounded-2xl border-2 flex items-center justify-center transition-all duration-300',
                      'hover:scale-110 hover:shadow-glow cursor-pointer',
                      componentConfig.battery.bgColor,
                      componentConfig.battery.borderColor
                    )}
                  >
                    <Battery size={48} className={componentConfig.battery.color} />
                  </div>
                </button>
                <div className="mt-3 text-center">
                  <div className="text-sm font-semibold text-gray-100">{mockComponents[2].name}</div>
                  <div className={cn(
                    'text-xs font-medium',
                    mockComponents[2].power < 0 ? 'text-battery' : 'text-status-warning'
                  )}>
                    {mockComponents[2].power < 0 ? 'Charging' : 'Discharging'} {formatPower(Math.abs(mockComponents[2].power))}
                  </div>
                  <Badge variant="info" size="sm" className="mt-1">
                    SOC: 68%
                  </Badge>
                </div>
              </div>

              {/* Diesel Generator */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleComponentClick(mockComponents[1])}
                  className="group relative"
                >
                  <div
                    className={cn(
                      'w-32 h-32 rounded-2xl border-2 flex items-center justify-center transition-all duration-300',
                      'hover:scale-110 hover:shadow-glow cursor-pointer',
                      componentConfig.diesel.bgColor,
                      componentConfig.diesel.borderColor
                    )}
                  >
                    <Zap size={48} className={componentConfig.diesel.color} />
                  </div>
                  {mockComponents[1].alerts > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-status-warning rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{mockComponents[1].alerts}</span>
                    </div>
                  )}
                </button>
                <div className="mt-3 text-center">
                  <div className="text-sm font-semibold text-gray-100">{mockComponents[1].name}</div>
                  <div className="text-xs text-diesel font-medium">{formatPower(mockComponents[1].power)}</div>
                  <Badge variant="success" size="sm" className="mt-1">
                    <CheckCircle2 size={10} className="mr-1" />
                    Online
                  </Badge>
                </div>
              </div>
            </div>

            {/* Energy Flow Indicator */}
            <div className="flex items-center justify-center mb-16">
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Energy Flow</div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-1 bg-gradient-to-r from-renewable via-battery to-diesel animate-pulse" />
                  <Activity size={16} className="text-polar-400" />
                  <div className="w-24 h-1 bg-gradient-to-r from-diesel via-battery to-gray-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Bottom Row: Load Components */}
            <div className="grid grid-cols-4 gap-6">
              {/* Research Labs */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleComponentClick(mockComponents[3])}
                  className="group relative"
                >
                  <div
                    className={cn(
                      'w-24 h-24 rounded-xl border-2 flex items-center justify-center transition-all duration-300',
                      'hover:scale-110 hover:shadow-glow cursor-pointer',
                      componentConfig.research.bgColor,
                      componentConfig.research.borderColor
                    )}
                  >
                    <Beaker size={32} className={componentConfig.research.color} />
                  </div>
                </button>
                <div className="mt-2 text-center">
                  <div className="text-xs font-semibold text-gray-100">{mockComponents[3].name}</div>
                  <div className="text-xs text-gray-400">{formatPower(mockComponents[3].power)}</div>
                </div>
              </div>

              {/* Habitation */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleComponentClick(mockComponents[4])}
                  className="group relative"
                >
                  <div
                    className={cn(
                      'w-24 h-24 rounded-xl border-2 flex items-center justify-center transition-all duration-300',
                      'hover:scale-110 hover:shadow-glow cursor-pointer',
                      componentConfig.habitation.bgColor,
                      componentConfig.habitation.borderColor
                    )}
                  >
                    <Home size={32} className={componentConfig.habitation.color} />
                  </div>
                </button>
                <div className="mt-2 text-center">
                  <div className="text-xs font-semibold text-gray-100">{mockComponents[4].name}</div>
                  <div className="text-xs text-gray-400">{formatPower(mockComponents[4].power)}</div>
                </div>
              </div>

              {/* Communications */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleComponentClick(mockComponents[5])}
                  className="group relative"
                >
                  <div
                    className={cn(
                      'w-24 h-24 rounded-xl border-2 flex items-center justify-center transition-all duration-300',
                      'hover:scale-110 hover:shadow-glow cursor-pointer',
                      componentConfig.communications.bgColor,
                      componentConfig.communications.borderColor
                    )}
                  >
                    <Radio size={32} className={componentConfig.communications.color} />
                  </div>
                </button>
                <div className="mt-2 text-center">
                  <div className="text-xs font-semibold text-gray-100">{mockComponents[5].name}</div>
                  <div className="text-xs text-gray-400">{formatPower(mockComponents[5].power)}</div>
                </div>
              </div>

              {/* Critical Infrastructure */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleComponentClick(mockComponents[6])}
                  className="group relative"
                >
                  <div
                    className={cn(
                      'w-24 h-24 rounded-xl border-2 flex items-center justify-center transition-all duration-300',
                      'hover:scale-110 hover:shadow-glow cursor-pointer',
                      componentConfig.critical.bgColor,
                      componentConfig.critical.borderColor
                    )}
                  >
                    <Shield size={32} className={componentConfig.critical.color} />
                  </div>
                </button>
                <div className="mt-2 text-center">
                  <div className="text-xs font-semibold text-gray-100">{mockComponents[6].name}</div>
                  <div className="text-xs text-gray-400">{formatPower(mockComponents[6].power)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Component Detail Panel */}
      {selectedComponent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div
                  className={cn(
                    'w-16 h-16 rounded-xl border-2 flex items-center justify-center',
                    componentConfig[selectedComponent.type].bgColor,
                    componentConfig[selectedComponent.type].borderColor
                  )}
                >
                  <selectedComponent.icon
                    size={32}
                    className={componentConfig[selectedComponent.type].color}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-100">{selectedComponent.name}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selectedComponent.description}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Status */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-dark-surface rounded-lg">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current Power</div>
                <div className={cn(
                  'text-xl font-bold',
                  componentConfig[selectedComponent.type].color
                )}>
                  {selectedComponent.power < 0 && 'Charging '}
                  {formatPower(Math.abs(selectedComponent.power))}
                </div>
              </div>
              <div className="p-4 bg-dark-surface rounded-lg">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</div>
                <Badge
                  variant={
                    selectedComponent.status === 'online'
                      ? 'success'
                      : selectedComponent.status === 'warning'
                      ? 'warning'
                      : 'critical'
                  }
                >
                  {selectedComponent.status === 'online' && <CheckCircle2 size={12} className="mr-1" />}
                  {selectedComponent.status === 'warning' && <AlertCircle size={12} className="mr-1" />}
                  {selectedComponent.status.toUpperCase()}
                </Badge>
              </div>
              <div className="p-4 bg-dark-surface rounded-lg">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Health</div>
                <div className="flex items-center space-x-2">
                  <div className="text-xl font-bold text-gray-100">{selectedComponent.health}%</div>
                  <div className="flex-1 h-2 bg-dark-bg rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full',
                        selectedComponent.health >= 90
                          ? 'bg-status-success'
                          : selectedComponent.health >= 70
                          ? 'bg-status-warning'
                          : 'bg-status-critical'
                      )}
                      style={{ width: `${selectedComponent.health}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Activity size={18} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wide">
                  Recent Events
                </h3>
              </div>
              <div className="space-y-2">
                {selectedComponent.recentEvents.map((event, index) => (
                  <div
                    key={index}
                    className="p-3 bg-dark-surface rounded-lg border border-dark-border"
                  >
                    <p className="text-sm text-gray-300">{event}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendation */}
            {selectedComponent.aiRecommendation && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb size={18} className="text-polar-400" />
                  <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wide">
                    AI Recommendation
                  </h3>
                </div>
                <div className="p-4 bg-polar-900/20 rounded-lg border border-polar-600/30">
                  <p className="text-sm text-polar-400">{selectedComponent.aiRecommendation}</p>
                </div>
              </div>
            )}

            {/* Alerts */}
            {selectedComponent.alerts > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle size={18} className="text-status-warning" />
                  <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wide">
                    Active Alerts ({selectedComponent.alerts})
                  </h3>
                </div>
                <div className="p-4 bg-status-warning/10 rounded-lg border border-status-warning/30">
                  <p className="text-sm text-status-warning">
                    Generator #3 offline - Scheduled maintenance (estimated completion: 4 hours)
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Legend */}
      <Card className="bg-dark-surface/50">
        <div className="flex items-start space-x-3">
          <Info size={20} className="text-polar-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="mb-2">
              <strong className="text-gray-300">Energy Flow Visualization:</strong>
            </p>
            <p className="mb-2">
              This interactive diagram shows real-time energy generation, storage, and consumption
              across the polar research station. Click any component to view detailed status,
              recent events, and AI recommendations.
            </p>
            <div className="flex items-center space-x-6 mt-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-renewable" />
                <span className="text-xs">Wind Generation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-diesel" />
                <span className="text-xs">Diesel Generation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-battery" />
                <span className="text-xs">Battery Storage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-xs">Loads</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
