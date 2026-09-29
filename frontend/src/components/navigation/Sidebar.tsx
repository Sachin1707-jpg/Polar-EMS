import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wind,
  TrendingUp,
  Brain,
  Lightbulb,
  Bell,
  BarChart3,
  Settings,
  Zap,
  AlertTriangle,
  Building2,
  Snowflake,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Sidebar Navigation Component
 * Main navigation sidebar with section groups and status indicator
 */

interface NavItem {
  name: string;
  to: string;
  icon: LucideIcon;
}

const monitoringNav: NavItem[] = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Station', to: '/station', icon: Building2 },
  { name: 'Weather', to: '/weather', icon: Wind },
];

const intelligenceNav: NavItem[] = [
  { name: 'Forecasts', to: '/forecasts', icon: TrendingUp },
  { name: 'AI Prediction', to: '/ai-prediction', icon: Brain },
  { name: 'Recommendations', to: '/recommendations', icon: Lightbulb },
  { name: 'Optimization', to: '/optimization', icon: Zap },
];

const operationsNav: NavItem[] = [
  { name: 'Alerts', to: '/alerts', icon: Bell },
  { name: 'Emergency', to: '/emergency', icon: AlertTriangle },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
];

const secondaryNav: NavItem[] = [
  { name: 'Settings', to: '/settings', icon: Settings },
];

interface NavSectionProps {
  label: string;
  items: NavItem[];
}

function NavSection({ label, items }: NavSectionProps) {
  return (
    <div className="mb-6">
      <div
        className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'rgba(148,163,184,0.4)' }}
      >
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium relative group',
                isActive
                  ? 'text-white nav-active-bar'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active background */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.05) 100%)',
                      border: '1px solid rgba(59,130,246,0.2)',
                    }}
                  />
                )}
                <item.icon
                  size={18}
                  className={cn(
                    'relative z-10 transition-all duration-200 flex-shrink-0',
                    isActive
                      ? 'text-blue-400'
                      : 'text-gray-500 group-hover:text-gray-300'
                  )}
                />
                <span className="relative z-10">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30"
      style={{
        background: 'rgba(10, 16, 30, 0.98)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center space-x-3 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            boxShadow: '0 0 15px rgba(59,130,246,0.4)',
          }}
        >
          <Snowflake size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <div
            className="text-base font-bold tracking-wide leading-none"
            style={{
              background: 'linear-gradient(90deg, #93c5fd, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            POLAR-EMS
          </div>
          <div
            className="text-[9px] uppercase tracking-widest mt-0.5"
            style={{ color: 'rgba(148,163,184,0.4)' }}
          >
            Mission Control
          </div>
        </div>
        {/* Version badge */}
        <div
          className="ml-auto flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(59,130,246,0.12)',
            color: '#60a5fa',
            border: '1px solid rgba(59,130,246,0.25)',
            letterSpacing: '0.03em',
          }}
        >
          v1.0
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <NavSection label="Monitoring" items={monitoringNav} />
        <NavSection label="AI Intelligence" items={intelligenceNav} />
        <NavSection label="Operations" items={operationsNav} />
      </nav>

      {/* Bottom Section */}
      <div
        className="px-3 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Settings */}
        <div className="mb-3">
          {secondaryNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium relative group',
                  isActive
                    ? 'text-white nav-active-bar'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.05) 100%)',
                        border: '1px solid rgba(59,130,246,0.2)',
                      }}
                    />
                  )}
                  <item.icon
                    size={18}
                    className={cn(
                      'relative z-10 flex-shrink-0 transition-colors',
                      isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                    )}
                  />
                  <span className="relative z-10">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* System Status Badge */}
        <div
          className="flex items-center space-x-2 px-4 py-3 rounded-lg"
          style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.15)',
          }}
        >
          <div className="status-online" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-emerald-400">System Online</div>
            <div className="text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>
              All services operational
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Mobile Sidebar Component
 * Responsive sidebar for mobile/tablet
 */
export function MobileSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const allNavItems = [
    ...monitoringNav,
    ...intelligenceNav,
    ...operationsNav,
    ...secondaryNav,
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 lg:hidden"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50 lg:hidden animate-slide-in"
        style={{
          background: 'rgba(10, 16, 30, 0.98)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center space-x-3 px-5 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              boxShadow: '0 0 15px rgba(59,130,246,0.4)',
            }}
          >
            <Snowflake size={18} className="text-white" />
          </div>
          <div
            className="text-base font-bold"
            style={{
              background: 'linear-gradient(90deg, #93c5fd, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            POLAR-EMS
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            {allNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium',
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  )
                }
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
