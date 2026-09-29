import { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Wind,
  Battery,
  Thermometer,
  TrendingUp,
  Eye,
  Brain,
  Lightbulb,
  Settings as SettingsIcon,
  Shield,
  BarChart3,
  AlertTriangle,
  Snowflake,
  Activity,
  Database,
  Cpu,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { formatPower, formatPercent } from '@/utils/format';
import { cn } from '@/utils/cn';

/**
 * Landing Page Component
 * Public-facing introduction page for POLAR-EMS
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  // Demo system status (clearly marked as simulated)
  const demoStatus = {
    systemStatus: 'normal' as const,
    renewableGeneration: 85.3,
    batterySoc: 72.5,
    currentLoad: 125.5,
    temperature: -15.2,
    criticalLoadStatus: 'protected' as const,
  };

  const workflowSteps = [
    {
      id: 1,
      icon: Eye,
      title: 'Observe',
      description: 'Continuous monitoring of energy systems, weather, and equipment',
      color: 'text-blue-400',
    },
    {
      id: 2,
      icon: Brain,
      title: 'Predict',
      description: 'AI-powered forecasts for load demand and renewable generation',
      color: 'text-purple-400',
    },
    {
      id: 3,
      icon: Lightbulb,
      title: 'Recommend',
      description: 'Intelligent operational suggestions based on system state',
      color: 'text-yellow-400',
    },
    {
      id: 4,
      icon: SettingsIcon,
      title: 'Optimize',
      description: 'MILP-based energy dispatch for minimum fuel consumption',
      color: 'text-green-400',
    },
    {
      id: 5,
      icon: Shield,
      title: 'Protect',
      description: 'Critical load protection and failure detection systems',
      color: 'text-red-400',
    },
    {
      id: 6,
      icon: BarChart3,
      title: 'Analyze',
      description: 'Historical performance tracking and efficiency metrics',
      color: 'text-cyan-400',
    },
  ];

  const capabilities = [
    {
      icon: TrendingUp,
      title: 'AI Forecasting',
      description: 'XGBoost-powered 24-48h load and generation predictions',
    },
    {
      icon: Wind,
      title: 'Renewable Integration',
      description: 'Maximize wind energy utilization with intelligent dispatch',
    },
    {
      icon: Battery,
      title: 'Battery Intelligence',
      description: 'Optimal charge/discharge scheduling and SOC management',
    },
    {
      icon: Zap,
      title: 'Fuel Optimization',
      description: 'MILP optimization reduces diesel consumption up to 30%',
    },
    {
      icon: AlertTriangle,
      title: 'Smart Alerts',
      description: 'Real-time notifications for critical system events',
    },
    {
      icon: Activity,
      title: 'Failure Response',
      description: 'Anomaly detection and automated failure handling',
    },
    {
      icon: Shield,
      title: 'Critical Load Protection',
      description: 'Ensure uninterrupted power for essential operations',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Comprehensive performance tracking and reporting',
    },
  ];

  const architectureSteps = [
    { label: 'Data Collection', icon: Database },
    { label: 'AI Forecast', icon: Brain },
    { label: 'Optimization', icon: Cpu },
    { label: 'Dispatch', icon: Zap },
    { label: 'Monitoring', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-gradient-polar">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-card/95 backdrop-blur-sm border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Snowflake className="text-white" size={24} />
              </div>
              <div>
                <div className="text-xl font-bold text-gradient">POLAR-EMS</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                  AI Energy Intelligence
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary flex items-center"
            >
              Launch Mission Control
              <ArrowRight size={18} className="ml-2" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="animate-fade-in">
              {/* Project Badge */}
              <div className="inline-flex items-center space-x-2 mb-6">
                <Badge variant="info" size="lg">
                  Polar Research Energy System
                </Badge>
                <Badge variant="default" size="lg">
                  MoES - NCPOR
                </Badge>
              </div>

              {/* Hero Title */}
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-100 mb-6 leading-tight">
                AI Energy Intelligence for the World's{' '}
                <span className="text-gradient">Harshest Stations</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Predict demand. Optimize energy. Protect critical operations.
              </p>

              {/* Description */}
              <p className="text-gray-400 mb-10 leading-relaxed">
                POLAR-EMS is an AI-driven energy management system designed for
                polar research stations. It combines machine learning forecasting,
                mathematical optimization, and intelligent automation to minimize
                diesel consumption while ensuring reliable power for critical
                scientific operations in extreme environments.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary btn-lg flex items-center justify-center"
                >
                  <Zap size={20} className="mr-2" />
                  Launch Mission Control
                  <ArrowRight size={18} className="ml-2" />
                </button>
                <button
                  onClick={() => {
                    document
                      .getElementById('technology')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-secondary btn-lg flex items-center justify-center"
                >
                  <Brain size={20} className="mr-2" />
                  Explore Technology
                </button>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative animate-fade-in">
              <div className="relative">
                {/* Main Visual Card */}
                <Card className="p-8 border-2 border-polar-600/30">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-accent rounded-2xl mb-4">
                      <Snowflake size={48} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-100 mb-2">
                      Polar Research Station
                    </h3>
                    <p className="text-sm text-gray-400">
                      Extreme Environment Energy Management
                    </p>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-dark-surface rounded-lg">
                      <div className="text-3xl font-bold text-renewable mb-1">68%</div>
                      <div className="text-xs text-gray-400">Renewable Energy</div>
                    </div>
                    <div className="text-center p-4 bg-dark-surface rounded-lg">
                      <div className="text-3xl font-bold text-polar-400 mb-1">-15°C</div>
                      <div className="text-xs text-gray-400">Operating Temp</div>
                    </div>
                    <div className="text-center p-4 bg-dark-surface rounded-lg">
                      <div className="text-3xl font-bold text-status-success mb-1">30%</div>
                      <div className="text-xs text-gray-400">Fuel Savings</div>
                    </div>
                    <div className="text-center p-4 bg-dark-surface rounded-lg">
                      <div className="text-3xl font-bold text-gray-100 mb-1">24/7</div>
                      <div className="text-xs text-gray-400">AI Monitoring</div>
                    </div>
                  </div>
                </Card>

                {/* Floating Accent Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-polar-600/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Status Strip */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 bg-dark-card/50 border-y border-dark-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Live System Status
            </h3>
            <Badge variant="info" size="sm">
              <span className="mr-1">🔬</span>
              DEMO DATA
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg">
              <StatusIndicator status={demoStatus.systemStatus} size="sm" showLabel={false} />
              <div>
                <div className="text-xs text-gray-400">System Status</div>
                <div className="text-sm font-semibold text-gray-100 capitalize">
                  {demoStatus.systemStatus}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg">
              <Wind size={20} className="text-renewable" />
              <div>
                <div className="text-xs text-gray-400">Renewable Gen</div>
                <div className="text-sm font-semibold text-gray-100">
                  {formatPower(demoStatus.renewableGeneration)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg">
              <Battery size={20} className="text-battery" />
              <div>
                <div className="text-xs text-gray-400">Battery SOC</div>
                <div className="text-sm font-semibold text-gray-100">
                  {formatPercent(demoStatus.batterySoc)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg">
              <Zap size={20} className="text-load" />
              <div>
                <div className="text-xs text-gray-400">Current Load</div>
                <div className="text-sm font-semibold text-gray-100">
                  {formatPower(demoStatus.currentLoad)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg">
              <Thermometer size={20} className="text-polar-400" />
              <div>
                <div className="text-xs text-gray-400">Weather</div>
                <div className="text-sm font-semibold text-gray-100">
                  {demoStatus.temperature}°C
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg">
              <Shield size={20} className="text-status-success" />
              <div>
                <div className="text-xs text-gray-400">Critical Load</div>
                <div className="text-sm font-semibold text-status-success capitalize">
                  {demoStatus.criticalLoadStatus}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How POLAR-EMS Works */}
      <section id="technology" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-100 mb-4">
              How POLAR-EMS Works
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Six-stage intelligent workflow from observation to optimization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step, index) => (
              <div key={step.id} onMouseEnter={() => setActiveStep(index)}>
                <Card
                  className={cn(
                    'cursor-pointer transition-all duration-300',
                    activeStep === index
                      ? 'border-2 border-polar-600 shadow-glow-sm'
                      : 'hover:border-dark-accent'
                  )}
                >
                <div className="flex items-start space-x-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      activeStep === index ? 'bg-polar-600/20' : 'bg-dark-surface'
                    )}
                  >
                    <step.icon size={24} className={step.color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">
                        {step.title}
                      </h3>
                      <span className="text-2xl font-bold text-gray-600">
                        {step.id}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                </div>
              </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-100 mb-4">
              Core Capabilities
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Advanced features powered by AI and optimization algorithms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((capability, index) => (
              <Card
                key={index}
                className="hover:border-dark-accent transition-all duration-300 group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <capability.icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    {capability.title}
                  </h3>
                  <p className="text-sm text-gray-400">{capability.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Visualization */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-100 mb-4">
              System Architecture
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Simple, powerful workflow from data to action
            </p>
          </div>

          <Card className="p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0 lg:space-x-6">
              {architectureSteps.map((step, index) => (
                <Fragment key={index}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gradient-accent rounded-2xl flex items-center justify-center mb-4">
                      <step.icon size={32} className="text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-100 mb-1">
                      {step.label}
                    </h4>
                    <div className="text-2xl font-bold text-gray-600">
                      {index + 1}
                    </div>
                  </div>
                  {index < architectureSteps.length - 1 && (
                    <div className="hidden lg:block">
                      <ArrowRight size={32} className="text-gray-600" />
                    </div>
                  )}
                  {index < architectureSteps.length - 1 && (
                    <div className="lg:hidden">
                      <div className="w-0.5 h-12 bg-gray-600" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-card">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-100 mb-6">
            Ready to Experience POLAR-EMS?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Explore the complete AI-driven energy management system designed for
            polar research stations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary btn-lg flex items-center justify-center"
            >
              <Zap size={20} className="mr-2" />
              Launch Mission Control
              <ArrowRight size={18} className="ml-2" />
            </button>
          </div>

          {/* Tech Stack Badges */}
          <div className="mt-12 pt-12 border-t border-dark-border">
            <p className="text-sm text-gray-400 mb-4">Built with modern technology</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="default">React + TypeScript</Badge>
              <Badge variant="default">FastAPI</Badge>
              <Badge variant="default">XGBoost ML</Badge>
              <Badge variant="default">MILP Optimization</Badge>
              <Badge variant="default">Real-time WebSocket</Badge>
              <Badge variant="default">PostgreSQL</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-dark-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Snowflake className="text-white" size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-100">POLAR-EMS</div>
                <div className="text-xs text-gray-400">AI Energy Intelligence</div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">
                Polar Station Microgrid Infrastructure
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Ministry of Earth Sciences • National Centre for Polar and Ocean Research
              </p>
            </div>
            <div className="text-xs text-gray-500">
              © 2026 POLAR-EMS. Built for Polar Research Energy Management.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
