import { cn } from '@/utils/cn';
import type { BadgeProps } from '@/types';

/**
 * Badge Component
 * Status badges for alerts, notifications, and labels
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const variantClasses = {
    critical: 'badge-critical',
    warning: 'badge-warning',
    info: 'badge-info',
    success: 'badge-success',
    default: 'badge-default',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'badge',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Status Badge with dot indicator
 */
export function StatusBadge({
  status,
  label,
  showDot = true,
}: {
  status: 'online' | 'offline' | 'warning' | 'critical' | 'normal';
  label?: string;
  showDot?: boolean;
}) {
  const statusConfig = {
    online: {
      variant: 'success' as const,
      label: label || 'Online',
      dotClass: 'status-online',
    },
    offline: {
      variant: 'default' as const,
      label: label || 'Offline',
      dotClass: 'status-offline',
    },
    warning: {
      variant: 'warning' as const,
      label: label || 'Warning',
      dotClass: 'status-warning',
    },
    critical: {
      variant: 'critical' as const,
      label: label || 'Critical',
      dotClass: 'status-critical',
    },
    normal: {
      variant: 'info' as const,
      label: label || 'Normal',
      dotClass: 'status-normal',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      <div className="flex items-center space-x-1.5">
        {showDot && <span className={config.dotClass} />}
        <span>{config.label}</span>
      </div>
    </Badge>
  );
}

/**
 * Priority Badge for recommendations and alerts
 */
export function PriorityBadge({
  priority,
}: {
  priority: 'critical' | 'high' | 'medium' | 'low';
}) {
  const priorityConfig = {
    critical: { variant: 'critical' as const, label: 'Critical' },
    high: { variant: 'warning' as const, label: 'High' },
    medium: { variant: 'info' as const, label: 'Medium' },
    low: { variant: 'default' as const, label: 'Low' },
  };

  const config = priorityConfig[priority];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Category Badge
 */
export function CategoryBadge({
  category,
}: {
  category: string;
}) {
  return (
    <Badge variant="default">
      {category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
    </Badge>
  );
}
