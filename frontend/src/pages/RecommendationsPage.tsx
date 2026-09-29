import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Battery,
  Wind,
  Fuel,
  Shield,
  Cloud,
  Wrench,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Badge, PriorityBadge, CategoryBadge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';

/**
 * Recommendations Page Component
 * AI Recommendation Center with explainable decision-making
 */

type RecommendationStatus = 'new' | 'accepted' | 'dismissed' | 'applied';
type RecommendationCategory =
  | 'fuel_optimization'
  | 'battery'
  | 'renewable_energy'
  | 'generator'
  | 'critical_load'
  | 'weather'
  | 'maintenance'
  | 'emergency';

interface Recommendation {
  id: number;
  category: RecommendationCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  recommendation: string;
  reason: string;
  expectedImpact: string;
  relatedData: {
    label: string;
    value: string;
    status?: 'good' | 'warning' | 'critical';
  }[];
  timestamp: string;
  status: RecommendationStatus;
  aiFactors: {
    factor: string;
    value: string;
    weight: string;
  }[];
}

// Mock recommendations data
const mockRecommendations: Recommendation[] = [
  {
    id: 1,
    category: 'battery',
    priority: 'high',
    title: 'Charge Battery During High-Wind Period',
    recommendation: 'Charge battery during the upcoming high-wind period (12:00-15:00).',
    reason: 'Wind generation is predicted to peak between 12:00-15:00 while evening demand is expected to increase. Current battery SOC is 72%, allowing room for additional charge.',
    expectedImpact: 'Potential reduction in diesel dependence during evening hours.',
    relatedData: [
      { label: 'Wind Peak', value: '95 kW', status: 'good' },
      { label: 'Battery SOC', value: '72%', status: 'good' },
      { label: 'Evening Load', value: '135 kW', status: 'warning' },
    ],
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'new',
    aiFactors: [
      { factor: 'Forecasted Wind Generation', value: '85-95 kW (12:00-15:00)', weight: 'High' },
      { factor: 'Evening Load Forecast', value: '135 kW (18:00-21:00)', weight: 'High' },
      { factor: 'Current Battery SOC', value: '72%', weight: 'Medium' },
      { factor: 'Generator Status', value: 'Online, 45 kW output', weight: 'Low' },
      { factor: 'Reserve Requirement', value: '20% minimum', weight: 'Medium' },
      { factor: 'Weather Condition', value: 'Stable, clear', weight: 'Low' },
    ],
  },
  {
    id: 2,
    category: 'fuel_optimization',
    priority: 'medium',
    title: 'Reduce Diesel Output During Peak Wind',
    recommendation: 'Reduce diesel generator output to minimum stable load (30 kW) during high wind period.',
    reason: 'Current wind generation (85 kW) exceeds load requirement (75 kW). Diesel generator is producing unnecessary 45 kW.',
    expectedImpact: 'Reduction in fuel consumption and extended generator life.',
    relatedData: [
      { label: 'Current Load', value: '75 kW', status: 'good' },
      { label: 'Wind Output', value: '85 kW', status: 'good' },
      { label: 'Diesel Output', value: '45 kW', status: 'warning' },
    ],
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'new',
    aiFactors: [
      { factor: 'Current Load', value: '75 kW', weight: 'High' },
      { factor: 'Wind Generation', value: '85 kW (stable)', weight: 'High' },
      { factor: 'Diesel Output', value: '45 kW (reducible)', weight: 'High' },
      { factor: 'Battery Available', value: 'Yes (72% SOC)', weight: 'Medium' },
      { factor: 'Load Stability', value: 'Stable for 3+ hours', weight: 'Medium' },
      { factor: 'Fuel Level', value: '78%', weight: 'Low' },
    ],
  },
  {
    id: 3,
    category: 'maintenance',
    priority: 'medium',
    title: 'Schedule Generator #2 Maintenance',
    recommendation: 'Schedule maintenance for Generator #2 during low-load period (2 days from now).',
    reason: 'Generator #2 has operated for 450 hours since last service. Forecast shows sustained low load and high wind availability.',
    expectedImpact: 'Prevent unscheduled downtime and extend equipment life.',
    relatedData: [
      { label: 'Runtime', value: '450 hours', status: 'warning' },
      { label: 'Service Interval', value: '500 hours', status: 'warning' },
      { label: 'Forecast Window', value: '6-hour low load', status: 'good' },
    ],
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'accepted',
    aiFactors: [
      { factor: 'Generator Runtime', value: '450 hours (90% of interval)', weight: 'High' },
      { factor: 'Load Forecast', value: 'Low for 6+ hours (48h ahead)', weight: 'High' },
      { factor: 'Wind Availability', value: 'High (80+ kW predicted)', weight: 'Medium' },
      { factor: 'Backup Generator', value: 'Available (Gen #1 online)', weight: 'High' },
      { factor: 'Critical Operations', value: 'None scheduled', weight: 'Medium' },
      { factor: 'Weather', value: 'Stable conditions', weight: 'Low' },
    ],
  },
  {
    id: 4,
    category: 'weather',
    priority: 'low',
    title: 'Prepare for Temperature Drop',
    recommendation: 'Increase habitation heating capacity allocation for forecasted temperature drop.',
    reason: 'Temperature predicted to drop to -22°C in 18 hours. Heating demand will increase by approximately 15%.',
    expectedImpact: 'Maintain habitation comfort without emergency load shedding.',
    relatedData: [
      { label: 'Current Temp', value: '-15°C', status: 'good' },
      { label: 'Forecast Temp', value: '-22°C', status: 'warning' },
      { label: 'Heating Load', value: '+15% expected', status: 'warning' },
    ],
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'applied',
    aiFactors: [
      { factor: 'Temperature Forecast', value: '-22°C (18h ahead)', weight: 'High' },
      { factor: 'Heating Load Model', value: '+15% at -22°C', weight: 'High' },
      { factor: 'Current Capacity', value: '18.4 kW habitation', weight: 'Medium' },
      { factor: 'Reserve Available', value: '25 kW margin', weight: 'Medium' },
      { factor: 'Duration', value: '12-hour cold period', weight: 'Medium' },
      { factor: 'Priority', value: 'Critical load priority 4', weight: 'High' },
    ],
  },
  {
    id: 5,
    category: 'renewable_energy',
    priority: 'low',
    title: 'Optimal Renewable Energy Window',
    recommendation: 'Schedule non-critical equipment operations between 10:00-14:00 tomorrow.',
    reason: 'High wind generation (90+ kW) predicted during this period with lower overall load.',
    expectedImpact: 'Maximize renewable energy utilization and reduce diesel consumption.',
    relatedData: [
      { label: 'Wind Forecast', value: '90-100 kW', status: 'good' },
      { label: 'Load Forecast', value: '110 kW', status: 'good' },
      { label: 'Surplus', value: '~10 kW available', status: 'good' },
    ],
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: 'dismissed',
    aiFactors: [
      { factor: 'Wind Generation', value: '90-100 kW (high confidence)', weight: 'High' },
      { factor: 'Base Load', value: '110 kW', weight: 'Medium' },
      { factor: 'Non-Critical Loads', value: '15 kW available to schedule', weight: 'Medium' },
      { factor: 'Diesel Price', value: 'High operational cost', weight: 'Low' },
      { factor: 'Battery', value: 'Can absorb excess', weight: 'Low' },
      { factor: 'Weather Stability', value: 'High (92% confidence)', weight: 'Medium' },
    ],
  },
];

// Category icons and colors
const categoryConfig: Record<
  RecommendationCategory,
  { icon: typeof Zap; color: string; label: string }
> = {
  fuel_optimization: { icon: Fuel, color: 'text-diesel', label: 'Fuel Optimization' },
  battery: { icon: Battery, color: 'text-battery', label: 'Battery' },
  renewable_energy: { icon: Wind, color: 'text-renewable', label: 'Renewable Energy' },
  generator: { icon: Zap, color: 'text-load', label: 'Generator' },
  critical_load: { icon: Shield, color: 'text-status-critical', label: 'Critical Load' },
  weather: { icon: Cloud, color: 'text-polar-400', label: 'Weather' },
  maintenance: { icon: Wrench, color: 'text-gray-400', label: 'Maintenance' },
  emergency: { icon: AlertTriangle, color: 'text-status-critical', label: 'Emergency' },
};

export default function RecommendationsPage() {
  const [filter, setFilter] = useState<'all' | RecommendationStatus>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState(mockRecommendations);

  const filteredRecommendations =
    filter === 'all'
      ? recommendations
      : recommendations.filter((rec) => rec.status === filter);

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAccept = (id: number, title: string) => {
    setRecommendations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'accepted' as const } : r)
    );
    toast.success('Recommendation Accepted', {
      description: `"${title}" has been accepted and scheduled for execution.`,
    });
  };

  const handleDismiss = (id: number, title: string) => {
    setRecommendations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'dismissed' as const } : r)
    );
    toast.info('Recommendation Dismissed', {
      description: `"${title}" dismissed. AI will adjust its model.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AI Recommendation Center</h1>
          <p className="text-sm text-gray-400 mt-1">
            Operational guidance based on predictions and station conditions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success" size="lg">
            <Brain size={16} className="mr-1" />
            AI Engine
          </Badge>
          <Badge variant="info" size="lg">
            <span className="mr-1">🔬</span>
            SIMULATED DATA
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-dark-border">
        {(['all', 'new', 'accepted', 'applied', 'dismissed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${
              filter === tab ? 'text-polar-400' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
            {filter === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-polar-400" />
            )}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-polar-900/30 to-dark-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">New</div>
              <div className="text-3xl font-bold text-gray-100">
                {mockRecommendations.filter((r) => r.status === 'new').length}
              </div>
            </div>
            <Clock size={32} className="text-polar-400 opacity-50" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/20 to-dark-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Accepted</div>
              <div className="text-3xl font-bold text-gray-100">
                {mockRecommendations.filter((r) => r.status === 'accepted').length}
              </div>
            </div>
            <CheckCircle2 size={32} className="text-status-success opacity-50" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/20 to-dark-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Applied</div>
              <div className="text-3xl font-bold text-gray-100">
                {mockRecommendations.filter((r) => r.status === 'applied').length}
              </div>
            </div>
            <TrendingUp size={32} className="text-status-info opacity-50" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800/20 to-dark-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dismissed</div>
              <div className="text-3xl font-bold text-gray-100">
                {mockRecommendations.filter((r) => r.status === 'dismissed').length}
              </div>
            </div>
            <XCircle size={32} className="text-gray-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.map((rec) => {
          const config = categoryConfig[rec.category];
          const Icon = config.icon;
          const isExpanded = expandedId === rec.id;

          return (
            <Card
              key={rec.id}
              className={cn(
                'transition-all duration-200',
                rec.priority === 'critical' && 'border-2 border-status-critical/30',
                rec.priority === 'high' && 'border-2 border-status-warning/30',
                rec.status === 'applied' && 'opacity-75'
              )}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        rec.priority === 'critical'
                          ? 'bg-status-critical/20'
                          : rec.priority === 'high'
                          ? 'bg-status-warning/20'
                          : 'bg-polar-600/20'
                      }`}
                    >
                      <Icon size={28} className={config.color} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-100">{rec.title}</h3>
                        <PriorityBadge priority={rec.priority} />
                        <CategoryBadge category={config.label} />
                        {rec.status === 'new' && (
                          <Badge variant="warning" size="sm">
                            <Clock size={12} className="mr-1" />
                            NEW
                          </Badge>
                        )}
                        {rec.status === 'accepted' && (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 size={12} className="mr-1" />
                            ACCEPTED
                          </Badge>
                        )}
                        {rec.status === 'applied' && (
                          <Badge variant="info" size="sm">
                            <TrendingUp size={12} className="mr-1" />
                            APPLIED
                          </Badge>
                        )}
                        {rec.status === 'dismissed' && (
                          <Badge variant="default" size="sm">
                            <XCircle size={12} className="mr-1" />
                            DISMISSED
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatRelativeTime(rec.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      RECOMMENDATION
                    </div>
                    <p className="text-base text-gray-100 font-medium">
                      "{rec.recommendation}"
                    </p>
                  </div>

                  {/* Why */}
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      WHY?
                    </div>
                    <p className="text-sm text-gray-300">{rec.reason}</p>
                  </div>

                  {/* Expected Impact */}
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      EXPECTED IMPACT
                    </div>
                    <p className="text-sm text-polar-400 font-medium">{rec.expectedImpact}</p>
                  </div>

                  {/* Related Data */}
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      RELATED DATA
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {rec.relatedData.map((data, index) => (
                        <div
                          key={index}
                          className="p-3 bg-dark-surface rounded-lg border border-dark-border"
                        >
                          <div className="text-xs text-gray-400 mb-1">{data.label}</div>
                          <div
                            className={cn(
                              'text-base font-semibold',
                              data.status === 'good' && 'text-status-success',
                              data.status === 'warning' && 'text-status-warning',
                              data.status === 'critical' && 'text-status-critical',
                              !data.status && 'text-gray-100'
                            )}
                          >
                            {data.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Why Did AI Recommend This? */}
                <div className="border-t border-dark-border pt-4">
                  <button
                    onClick={() => toggleExpanded(rec.id)}
                    className="flex items-center space-x-2 text-sm font-medium text-polar-400 hover:text-polar-300 transition-colors"
                  >
                    <Brain size={16} />
                    <span>Why did AI recommend this?</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 p-4 bg-polar-900/20 rounded-lg border border-polar-600/30 animate-slide-in">
                      <div className="flex items-start space-x-3 mb-4">
                        <Info size={20} className="text-polar-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-300">
                          <p className="mb-2">
                            <strong className="text-gray-100">AI Decision Factors:</strong>
                          </p>
                          <p>
                            The AI engine analyzed the following factors to generate this
                            recommendation. Each factor is weighted based on its relevance to
                            operational safety and efficiency.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {rec.aiFactors.map((factor, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-dark-surface rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-100 mb-1">
                                {factor.factor}
                              </div>
                              <div className="text-xs text-gray-400">{factor.value}</div>
                            </div>
                            <Badge
                              variant={
                                factor.weight === 'High'
                                  ? 'warning'
                                  : factor.weight === 'Medium'
                                  ? 'info'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {factor.weight} Weight
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {rec.status === 'new' && (
                  <div className="flex items-center space-x-3 pt-4 border-t border-dark-border">
                    <button
                      onClick={() => handleAccept(rec.id, rec.title)}
                      className="btn-primary btn-sm flex items-center"
                    >
                      <CheckCircle2 size={16} className="mr-1" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleDismiss(rec.id, rec.title)}
                      className="btn-secondary btn-sm flex items-center"
                    >
                      <XCircle size={16} className="mr-1" />
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        toggleExpanded(rec.id);
                        toast.info('AI Reasoning', { description: 'Scroll down to see the AI decision factors for this recommendation' });
                      }}
                      className="btn-ghost btn-sm"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Explainer Footer */}
      <Card className="bg-dark-surface/50">
        <div className="flex items-start space-x-3">
          <Info size={20} className="text-polar-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="mb-2">
              <strong className="text-gray-300">About AI Recommendations:</strong>
            </p>
            <p className="mb-2">
              Recommendations are generated by analyzing forecasts, current system state, and
              operational patterns. Each recommendation includes reasoning and expected impact to
              maintain transparency.
            </p>
            <p>
              Click "Why did AI recommend this?" to see the specific factors and weights used in
              the decision-making process.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
