import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Menu,
  AlertCircle,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Wind,
  TrendingUp,
  Lightbulb,
  Zap,
  AlertTriangle,
  BarChart3,
  Building2,
  Clock,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

/**
 * Header Component
 * Top navigation bar with page title, real-time clock, user info, and system status
 */

interface HeaderProps {
  user?: {
    full_name?: string;
    username: string;
    role: string;
  } | null;
  systemStatus?: 'normal' | 'warning' | 'critical';
  unreadAlertCount?: number;
  onLogout?: () => void;
  onMenuClick?: () => void;
}

// Route → page title + icon mapping
const routeMeta: Record<string, { title: string; icon: React.ElementType }> = {
  '/dashboard':       { title: 'Dashboard',       icon: LayoutDashboard },
  '/station':         { title: 'Station',          icon: Building2 },
  '/weather':         { title: 'Weather',          icon: Wind },
  '/forecasts':       { title: 'Forecasts',        icon: TrendingUp },
  '/recommendations': { title: 'Recommendations', icon: Lightbulb },
  '/optimization':    { title: 'Optimization',     icon: Zap },
  '/alerts':          { title: 'Alerts',           icon: Bell },
  '/emergency':       { title: 'Emergency',        icon: AlertTriangle },
  '/analytics':       { title: 'Analytics',        icon: BarChart3 },
  '/settings':        { title: 'Settings',         icon: Settings },
};

function usePageMeta() {
  const { pathname } = useLocation();
  return routeMeta[pathname] ?? { title: 'POLAR-EMS', icon: LayoutDashboard };
}

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function getInitials(user?: HeaderProps['user']) {
  if (!user) return 'U';
  const name = user.full_name || user.username || 'User';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Header({
  user,
  systemStatus = 'normal',
  unreadAlertCount = 0,
  onLogout,
  onMenuClick,
}: HeaderProps) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pageMeta = usePageMeta();
  const now = useClock();
  const PageIcon = pageMeta.icon;

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  const statusMap = {
    normal:   'online'   as const,
    warning:  'warning'  as const,
    critical: 'critical' as const,
  };

  const statusLabel = {
    normal:   'All Systems Normal',
    warning:  'System Warning',
    critical: 'System Critical',
  };

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header
      className="sticky top-0 z-20"
      style={{
        background: 'rgba(10, 16, 30, 0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between px-5 py-3">
        {/* ── Left: Mobile menu + Page title ── */}
        <div className="flex items-center space-x-4 min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/8 text-gray-400 hover:text-gray-200"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Page Title + Icon */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              <PageIcon size={16} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-100 truncate">
                {pageMeta.title}
              </h1>
              <p
                className="hidden sm:block text-[10px] uppercase tracking-widest truncate"
                style={{ color: 'rgba(148,163,184,0.4)' }}
              >
                POLAR-EMS · Mission Control
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Clock, Status, Alerts, User ── */}
        <div className="flex items-center space-x-2">
          {/* Real-time clock */}
          <div
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <Clock size={12} className="text-gray-500" />
            <div className="text-right">
              <div className="text-xs font-mono font-semibold text-gray-300">
                {timeStr}
              </div>
              <div className="text-[9px] text-gray-600 leading-none">
                {dateStr}
              </div>
            </div>
          </div>

          {/* System Status */}
          <div
            className={cn(
              'hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg',
              systemStatus === 'normal'   && 'border-emerald-500/15',
              systemStatus === 'warning'  && 'border-amber-500/20',
              systemStatus === 'critical' && 'border-red-500/20'
            )}
            style={{
              background: systemStatus === 'critical'
                ? 'rgba(239,68,68,0.06)'
                : systemStatus === 'warning'
                ? 'rgba(245,158,11,0.06)'
                : 'rgba(16,185,129,0.06)',
              border: `1px solid ${
                systemStatus === 'critical'
                  ? 'rgba(239,68,68,0.2)'
                  : systemStatus === 'warning'
                  ? 'rgba(245,158,11,0.2)'
                  : 'rgba(16,185,129,0.15)'
              }`,
            }}
          >
            <StatusIndicator
              status={statusMap[systemStatus]}
              label={statusLabel[systemStatus]}
              size="sm"
            />
          </div>

          {/* Alert notifications */}
          <button
            onClick={() => navigate('/alerts')}
            className={cn(
              'relative p-2 rounded-lg transition-colors',
              unreadAlertCount > 0
                ? 'text-amber-400 hover:bg-amber-400/10'
                : 'text-gray-500 hover:bg-white/6 hover:text-gray-300'
            )}
            aria-label="View alerts"
          >
            <Bell size={18} />
            {unreadAlertCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white rounded-full"
                style={{ background: '#ef4444' }}
              >
                {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div
            className="h-6 w-px mx-1"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/6"
              aria-label="User menu"
            >
              {/* Avatar with initials */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                }}
              >
                {getInitials(user)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-200 leading-none">
                  {user?.full_name || user?.username || 'Operator'}
                </div>
                <div
                  className="text-[10px] capitalize leading-none mt-0.5"
                  style={{ color: 'rgba(148,163,184,0.5)' }}
                >
                  {user?.role || 'Operator'}
                </div>
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  'text-gray-500 transition-transform duration-200 hidden md:block',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl z-20 overflow-hidden animate-fade-in-up"
                  style={{
                    background: 'rgba(14, 22, 40, 0.97)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    animationDuration: '0.15s',
                  }}
                >
                  {/* User info */}
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        }}
                      >
                        {getInitials(user)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-100">
                          {user?.full_name || user?.username || 'Operator'}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {user?.role || 'Operator'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/6 hover:text-gray-100 transition-colors flex items-center space-x-3"
                    >
                      <Settings size={15} className="text-gray-500" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/8 transition-colors flex items-center space-x-3"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile system status banner */}
      {systemStatus !== 'normal' && (
        <div
          className="md:hidden px-5 py-2 text-xs font-medium flex items-center space-x-2"
          style={{
            background:
              systemStatus === 'critical'
                ? 'rgba(239,68,68,0.1)'
                : 'rgba(245,158,11,0.1)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            color: systemStatus === 'critical' ? '#fca5a5' : '#fcd34d',
          }}
        >
          <AlertCircle size={13} />
          <span>{statusLabel[systemStatus]}</span>
        </div>
      )}
    </header>
  );
}
