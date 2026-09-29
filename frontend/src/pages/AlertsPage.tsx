import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  X,
  Clock,
  Zap,
  Battery,
  Wind,
  Fuel,
  Shield,
  Activity,
  Cloud,
  TrendingDown,
  Server,
  Download,
  Calendar,
  Lightbulb,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime, formatEnergy, formatPercent } from '@/utils/format';
import { cn } from '@/utils/cn';

/**
 * Smart Alert Center
 * System alerts, notifications, and daily energy reports
 */

type AlertSeverity = 'info' | 'warning' | 'critical';
type AlertType =
  | 'low_battery'
  | 'high_diesel'
  | 'low_wind'
  | 'renewable_shortage'
  | 'critical_load_risk'
  | 'generator_failure'
  | 'battery_failure'
  | 'sensor_issue'
  | 'weather_risk'
  | 'forecast_anomaly';

interface Alert {
  id: number;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  timestamp: string;
  affectedComponent: string;
  recommendedAction: string;
  status: 'unread' | 'read' | 'acknowledged' | 'resolved';
}

interface DailyEnergyReport {
  date: string;
  energyConsumed: number;
  renewableContribution: number;
  dieselConsumption: number;
  fuelSaving: number;
  batteryActivity: {
    charged: number;
    discharged: number;
    cycles: number;
  };
  criticalLoadEvents: number;
  majorAlerts: {
    critical: number;
    warning: number;
  };
  aiRecommendations: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
}

// Alert configuration
const alertConfig: Record<AlertType, { icon: typeof AlertTriangle; color: string; label: string }> = {
  low_battery: { icon: Battery, color: 'text-battery', label: 'Low Battery' },
  high_diesel: { icon: Fuel, color: 'text-diesel', label: 'High Diesel Consumption' },
  low_wind: { icon: Wind, color: 'text-renewable', label: 'Low Wind' },
  renewable_shortage: { icon: TrendingDown, color: 'text-status-warning', label: 'Renewable Shortage' },
  critical_load_risk: { icon: Shield, color: 'text-status-critical', label: 'Critical Load Risk' },
  generator_failure: { icon: Zap, color: 'text-status-critical', label: 'Generator Failure' },
  battery_failure: { icon: Battery, color: 'text-status-critical', label: 'Battery Failure' },
  sensor_issue: { icon: Server, color: 'text-gray-400', label: 'Sensor/Data Issue' },
  weather_risk: { icon: Cloud, color: 'text-polar-400', label: 'Weather Risk' },
  forecast_anomaly: { icon: Activity, color: 'text-status-warning', label: 'Forecast Anomaly' },
};

// Mock alerts data
const mockAlerts: Alert[] = [
  {
    id: 1,
    severity: 'critical',
    type: 'critical_load_risk',
    title: 'Critical Load Reserve Below Threshold',
    description: 'Available power reserve for critical loads has dropped to 12%, below the required 20% margin. Immediate action required to prevent load shedding.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    affectedComponent: 'Critical Load System (Life Support, Communications)',
    recommendedAction: 'Activate backup generator immediately and reduce non-essential loads.',
    status: 'unread',
  },
  {
    id: 2,
    severity: 'warning',
    type: 'low_battery',
    title: 'Battery SOC Below 40%',
    description: 'Battery state of charge has dropped to 38%. Low wind conditions predicted for next 6 hours may require increased diesel generation.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    affectedComponent: 'Battery Bank #1',
    recommendedAction: 'Monitor battery discharge rate. Consider starting Gen #2 if SOC drops below 30%.',
    status: 'read',
  },
  {
    id: 3,
    severity: 'warning',
    type: 'high_diesel',
    title: 'Elevated Diesel Consumption',
    description: 'Diesel consumption has exceeded baseline by 28% over the past 4 hours. Wind generation is 35% below forecast.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    affectedComponent: 'Generator #1, #2',
    recommendedAction: 'Review current load profile and identify opportunities for load shifting to high-wind periods.',
    status: 'acknowledged',
  },
  {
    id: 4,
    severity: 'info',
    type: 'low_wind',
    title: 'Low Wind Period Expected',
    description: 'Wind generation forecast shows sustained low wind (20-35 kW) for next 12 hours. Plan accordingly for increased diesel reliance.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    affectedComponent: 'Wind Turbine System',
    recommendedAction: 'Defer non-critical operations and ensure fuel reserves are adequate.',
    status: 'read',
  },
  {
    id: 5,
    severity: 'warning',
    type: 'weather_risk',
    title: 'Extreme Cold Warning',
    description: 'Temperature forecast to drop to -28°C in 18 hours. Battery performance may be impacted, and heating demand will increase.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    affectedComponent: 'Battery System, Habitation Heating',
    recommendedAction: 'Apply temperature-aware battery charging limits and pre-allocate capacity for heating loads.',
    status: 'read',
  },
  {
    id: 6,
    severity: 'info',
    type: 'forecast_anomaly',
    title: 'Load Forecast Deviation Detected',
    description: 'Actual load is 15% higher than predicted for current hour. AI model will recalibrate with updated data.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    affectedComponent: 'Load Forecasting Model',
    recommendedAction: 'No action required. System automatically adjusting predictions.',
    status: 'resolved',
  },
  {
    id: 7,
    severity: 'critical',
    type: 'generator_failure',
    title: 'Generator #3 Offline',
    description: 'Generator #3 failed to start during scheduled test. Backup capacity reduced to Gen #1 and Gen #2 only.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    affectedComponent: 'Generator #3',
    recommendedAction: 'Schedule maintenance inspection. Ensure Gen #1 and Gen #2 are operational at all times.',
    status: 'acknowledged',
  },
  {
    id: 8,
    severity: 'info',
    type: 'sensor_issue',
    title: 'Wind Sensor Intermittent',
    description: 'Wind speed sensor #2 showing intermittent readings. System using sensor #1 as primary.',
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    affectedComponent: 'Wind Speed Sensor #2',
    recommendedAction: 'Inspect and clean sensor during next maintenance window.',
    status: 'resolved',
  },
];

// Mock daily report
const mockDailyReport: DailyEnergyReport = {
  date: new Date().toISOString(),
  energyConsumed: 2847.5,
  renewableContribution: 1654.3,
  dieselConsumption: 142.8,
  fuelSaving: 18.7,
  batteryActivity: {
    charged: 234.5,
    discharged: 198.2,
    cycles: 1.2,
  },
  criticalLoadEvents: 0,
  majorAlerts: {
    critical: 2,
    warning: 3,
  },
  aiRecommendations: 5,
  systemHealth: 'good',
  summary: 'Today\'s operations were efficient with 58.1% renewable contribution. Wind generation was slightly below forecast in the evening, requiring temporary diesel support. All critical loads were maintained without interruption. AI recommendations successfully reduced fuel consumption by 18.7% compared to baseline.',
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<'all' | AlertSeverity | 'unread'>('all');
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [downloading, setDownloading] = useState(false);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return alert.status === 'unread';
    return alert.severity === filter;
  });

  const unreadCount = alerts.filter((a) => a.status === 'unread').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  const handleDismiss = (id: number) => {
    setAlerts(alerts.filter((a) => a.id !== id));
    toast.info('Alert Dismissed', { description: 'Alert removed from the list' });
  };

  const handleMarkRead = (id: number) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, status: 'read' as const } : a)));
    toast.success('Marked as Read');
  };

  const handleAcknowledge = (id: number) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, status: 'acknowledged' as const } : a)));
    const alert = alerts.find(a => a.id === id);
    toast.success('Alert Acknowledged', { description: `"${alert?.title}" has been acknowledged` });
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    toast.loading('Generating PDF report...', { id: 'pdf-report' });
    await new Promise(r => setTimeout(r, 1800));
    setDownloading(false);
    toast.success('Report Downloaded', {
      id: 'pdf-report',
      description: 'Daily-Energy-Report.pdf has been saved to your downloads folder',
    });
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return AlertTriangle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'text-status-critical';
      case 'warning':
        return 'text-status-warning';
      case 'info':
        return 'text-status-info';
    }
  };

  const getSeverityBg = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-status-critical/20 border-status-critical/40';
      case 'warning':
        return 'bg-status-warning/20 border-status-warning/40';
      case 'info':
        return 'bg-status-info/20 border-status-info/40';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'text-status-success';
      case 'good':
        return 'text-status-info';
      case 'fair':
        return 'text-status-warning';
      case 'poor':
        return 'text-status-critical';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Smart Alert Center</h1>
          <p className="text-sm text-gray-400 mt-1">
            System alerts, notifications, and daily energy reports
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Badge variant="warning" size="lg">
              <Bell size={16} className="mr-1" />
              {unreadCount} Unread
            </Badge>
          )}
          <Badge variant="info" size="lg">
            <span className="mr-1">🔬</span>
            SIMULATED DATA
          </Badge>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-status-critical/20 to-dark-card border-status-critical/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Critical</div>
              <div className="text-3xl font-bold text-status-critical">{criticalCount}</div>
            </div>
            <AlertTriangle size={32} className="text-status-critical opacity-50" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-status-warning/20 to-dark-card border-status-warning/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Warning</div>
              <div className="text-3xl font-bold text-status-warning">{warningCount}</div>
            </div>
            <AlertTriangle size={32} className="text-status-warning opacity-50" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-status-info/20 to-dark-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Info</div>
              <div className="text-3xl font-bold text-status-info">
                {alerts.filter((a) => a.severity === 'info').length}
              </div>
            </div>
            <Info size={32} className="text-status-info opacity-50" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-polar-900/30 to-dark-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Unread</div>
              <div className="text-3xl font-bold text-gray-100">{unreadCount}</div>
            </div>
            <Bell size={32} className="text-polar-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Daily Energy Report */}
      <Card className="bg-gradient-to-br from-polar-900/30 to-dark-card border-polar-600/30">
        <CardHeader
          title="Daily Energy Report"
          subtitle={`Station operations summary for ${new Date(mockDailyReport.date).toLocaleDateString()}`}
        />

        {/* Station Energy Summary Card */}
        <div className="mb-6 p-6 bg-dark-surface rounded-xl border border-polar-600/30">
          <div className="flex items-start space-x-3 mb-4">
            <Calendar size={24} className="text-polar-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Station Energy Summary</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {mockDailyReport.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-dark-surface rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Activity size={16} className="text-load" />
              <span className="text-xs text-gray-400">Energy Consumed</span>
            </div>
            <div className="text-2xl font-bold text-gray-100">
              {formatEnergy(mockDailyReport.energyConsumed)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Total station usage</div>
          </div>

          <div className="p-4 bg-dark-surface rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Wind size={16} className="text-renewable" />
              <span className="text-xs text-gray-400">Renewable Contribution</span>
            </div>
            <div className="text-2xl font-bold text-renewable">
              {formatPercent((mockDailyReport.renewableContribution / mockDailyReport.energyConsumed) * 100)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatEnergy(mockDailyReport.renewableContribution)} from wind
            </div>
          </div>

          <div className="p-4 bg-dark-surface rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Fuel size={16} className="text-diesel" />
              <span className="text-xs text-gray-400">Diesel Consumption</span>
            </div>
            <div className="text-2xl font-bold text-diesel">
              {mockDailyReport.dieselConsumption.toFixed(1)} L
            </div>
            <div className="text-xs text-status-success mt-1">
              -{formatPercent(mockDailyReport.fuelSaving)} vs baseline
            </div>
          </div>

          <div className="p-4 bg-dark-surface rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle2 size={16} className="text-status-success" />
              <span className="text-xs text-gray-400">System Health</span>
            </div>
            <div className={cn('text-2xl font-bold capitalize', getHealthColor(mockDailyReport.systemHealth))}>
              {mockDailyReport.systemHealth}
            </div>
            <div className="text-xs text-gray-400 mt-1">Overall operational status</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Battery Activity */}
          <div className="p-4 bg-dark-surface rounded-lg border border-dark-border">
            <div className="flex items-center space-x-2 mb-3">
              <Battery size={18} className="text-battery" />
              <h4 className="text-sm font-semibold text-gray-100">Battery Activity</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Charged</span>
                <span className="text-gray-100 font-medium">
                  {formatEnergy(mockDailyReport.batteryActivity.charged)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discharged</span>
                <span className="text-gray-100 font-medium">
                  {formatEnergy(mockDailyReport.batteryActivity.discharged)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cycles</span>
                <span className="text-gray-100 font-medium">
                  {mockDailyReport.batteryActivity.cycles.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Critical Load & Alerts */}
          <div className="p-4 bg-dark-surface rounded-lg border border-dark-border">
            <div className="flex items-center space-x-2 mb-3">
              <Shield size={18} className="text-status-critical" />
              <h4 className="text-sm font-semibold text-gray-100">Critical Loads & Alerts</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Critical Load Events</span>
                <span className={cn('font-medium', mockDailyReport.criticalLoadEvents === 0 ? 'text-status-success' : 'text-status-warning')}>
                  {mockDailyReport.criticalLoadEvents}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Critical Alerts</span>
                <span className="text-status-critical font-medium">
                  {mockDailyReport.majorAlerts.critical}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Warnings</span>
                <span className="text-status-warning font-medium">
                  {mockDailyReport.majorAlerts.warning}
                </span>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="p-4 bg-dark-surface rounded-lg border border-dark-border">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb size={18} className="text-polar-400" />
              <h4 className="text-sm font-semibold text-gray-100">AI Insights</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Recommendations</span>
                <span className="text-gray-100 font-medium">
                  {mockDailyReport.aiRecommendations}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fuel Savings</span>
                <span className="text-status-success font-medium">
                  {formatPercent(mockDailyReport.fuelSaving)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Optimization Active</span>
                <span className="text-status-success font-medium flex items-center">
                  <CheckCircle2 size={14} className="mr-1" />
                  Yes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="btn-secondary btn-sm flex items-center space-x-2"
          >
            <Download size={16} className={downloading ? 'animate-bounce' : ''} />
            <span>{downloading ? 'Generating...' : 'Download Full Report (PDF)'}</span>
          </button>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-dark-border">
        {(['all', 'critical', 'warning', 'info', 'unread'] as const).map((tab) => (
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

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="text-center py-12">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-status-success opacity-50" />
            <p className="text-gray-400">No alerts to display</p>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const config = alertConfig[alert.type];
            const Icon = config.icon;
            const SeverityIcon = getSeverityIcon(alert.severity);

            return (
              <Card
                key={alert.id}
                className={cn(
                  'transition-all duration-200',
                  alert.status === 'unread' && 'border-l-4 border-l-polar-400',
                  alert.severity === 'critical' && 'border-2 border-status-critical/30',
                  alert.severity === 'warning' && 'border-status-warning/30'
                )}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                          getSeverityBg(alert.severity)
                        )}
                      >
                        <SeverityIcon size={28} className={getSeverityColor(alert.severity)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-100">{alert.title}</h3>
                          <Badge
                            variant={
                              alert.severity === 'critical'
                                ? 'critical'
                                : alert.severity === 'warning'
                                ? 'warning'
                                : 'info'
                            }
                            size="sm"
                          >
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="default" size="sm">
                            <Icon size={12} className="mr-1" />
                            {config.label}
                          </Badge>
                          {alert.status === 'unread' && (
                            <Badge variant="warning" size="sm">
                              <Bell size={12} className="mr-1" />
                              UNREAD
                            </Badge>
                          )}
                          {alert.status === 'acknowledged' && (
                            <Badge variant="success" size="sm">
                              <Eye size={12} className="mr-1" />
                              ACKNOWLEDGED
                            </Badge>
                          )}
                          {alert.status === 'resolved' && (
                            <Badge variant="success" size="sm">
                              <CheckCircle2 size={12} className="mr-1" />
                              RESOLVED
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Clock size={12} />
                          <span>{formatRelativeTime(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="text-gray-400 hover:text-gray-300 transition-colors ml-4"
                      title="Dismiss alert"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Description */}
                  <div className="pl-[72px]">
                    <p className="text-sm text-gray-300 mb-4">{alert.description}</p>

                    {/* Affected Component */}
                    <div className="mb-4 p-3 bg-dark-surface rounded-lg border border-dark-border">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        AFFECTED COMPONENT
                      </div>
                      <p className="text-sm text-gray-100">{alert.affectedComponent}</p>
                    </div>

                    {/* Recommended Action */}
                    <div className="mb-4 p-3 bg-polar-900/20 rounded-lg border border-polar-600/30">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        RECOMMENDED ACTION
                      </div>
                      <p className="text-sm text-polar-400 font-medium">{alert.recommendedAction}</p>
                    </div>

                    {/* Actions */}
                    {alert.status === 'unread' && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="btn-primary btn-sm flex items-center"
                        >
                          <Eye size={16} className="mr-1" />
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="btn-secondary btn-sm flex items-center"
                        >
                          <EyeOff size={16} className="mr-1" />
                          Mark Read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Info Footer */}
      <Card className="bg-dark-surface/50">
        <div className="flex items-start space-x-3">
          <Info size={20} className="text-polar-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="mb-2">
              <strong className="text-gray-300">About Smart Alerts:</strong>
            </p>
            <p className="mb-2">
              Alerts are generated automatically by the AI monitoring system based on sensor data,
              forecasts, and operational thresholds. Critical alerts require immediate attention.
            </p>
            <p>
              Daily energy reports provide a comprehensive summary of station performance and are
              available for download in PDF format for record-keeping.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
