import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { KPICardProps } from '@/types';

/**
 * KPI Card Component
 * Premium mission-control style card for key performance metrics
 */
export function KPICard({
  label,
  value,
  unit,
  trend,
  trendValue,
  status = 'normal',
  icon,
  loading = false,
  className,
}: KPICardProps) {
  const statusColors = {
    critical: 'text-red-400',
    warning: 'text-amber-400',
    normal: 'text-gray-100',
    good: 'text-emerald-400',
  };

  const statusGlows = {
    critical: 'shadow-[0_0_15px_rgba(239,68,68,0.15)] border-red-500/30',
    warning: 'shadow-[0_0_15px_rgba(245,158,11,0.15)] border-amber-500/30',
    normal: 'border-white/10 hover:border-blue-500/30',
    good: 'shadow-[0_0_15px_rgba(16,185,129,0.12)] border-emerald-500/30',
  };

  const statusDotBg = {
    critical: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    normal: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]',
    good: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-4 transition-all duration-300',
        'bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-md',
        'border',
        statusGlows[status],
        className
      )}
    >
      {/* Top row: Label + Icon & Status dot */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
          {label}
        </span>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {icon && (
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-300">
              {icon}
            </div>
          )}
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', statusDotBg[status])} />
        </div>
      </div>

      {/* Value */}
      {loading ? (
        <div className="loading-pulse h-8 w-28 rounded-md bg-slate-800/60" />
      ) : (
        <div className="flex items-baseline flex-wrap gap-1">
          <span className={cn('text-2xl font-bold tracking-tight', statusColors[status])}>
            {value}
          </span>
          {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
        </div>
      )}

      {/* Trend indicator */}
      {trend && trendValue && !loading && (
        <div className={cn('flex items-center text-xs font-semibold mt-2.5', trendColors[trend])}>
          {TrendIcon && <TrendIcon size={14} className="mr-1 flex-shrink-0" />}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Stat Card
 * Compact version for smaller metrics
 */
export function StatCard({
  label,
  value,
  icon,
  loading = false,
  className,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl p-4 bg-slate-900/80 border border-slate-800 backdrop-blur-sm',
        'hover:border-slate-700 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      {loading ? (
        <div className="loading-pulse h-7 w-20 rounded bg-slate-800/60" />
      ) : (
        <div className="text-xl font-bold text-slate-100">{value}</div>
      )}
    </div>
  );
}
