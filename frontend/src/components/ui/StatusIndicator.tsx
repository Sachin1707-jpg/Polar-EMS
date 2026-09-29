import { cn } from '@/utils/cn';
import type { StatusIndicatorProps } from '@/types';

/**
 * Status Indicator Component
 * Animated dot indicator for real-time status
 */
export function StatusIndicator({
  status,
  label,
  size = 'md',
  showLabel = true,
  animate = true,
}: StatusIndicatorProps) {
  const statusClasses = {
    online: animate ? 'status-online' : 'bg-status-success',
    offline: 'status-offline',
    warning: animate ? 'status-warning' : 'bg-status-warning',
    critical: animate ? 'status-critical' : 'bg-status-critical',
    normal: 'status-normal',
  };

  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const statusLabels = {
    online: 'Online',
    offline: 'Offline',
    warning: 'Warning',
    critical: 'Critical',
    normal: 'Normal',
  };

  return (
    <div className="flex items-center space-x-2">
      <span
        className={cn(
          'rounded-full',
          statusClasses[status],
          sizeClasses[size]
        )}
      />
      {showLabel && (
        <span className={cn('font-medium text-gray-300', textSizeClasses[size])}>
          {label || statusLabels[status]}
        </span>
      )}
    </div>
  );
}
