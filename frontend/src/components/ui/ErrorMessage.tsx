import { AlertCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Error Message Component
 * Inline error and alert messages
 */
export function ErrorMessage({
  message,
  variant = 'error',
  onDismiss,
  className,
}: {
  message: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  onDismiss?: () => void;
  className?: string;
}) {
  const variantConfig = {
    error: {
      icon: XCircle,
      className: 'alert-critical',
    },
    warning: {
      icon: AlertTriangle,
      className: 'alert-warning',
    },
    info: {
      icon: Info,
      className: 'alert-info',
    },
    success: {
      icon: AlertCircle,
      className: 'alert-success',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn('alert', config.className, className)}>
      <div className="flex items-start">
        <Icon size={20} className="flex-shrink-0 mt-0.5" />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 flex-shrink-0 hover:opacity-75 transition-opacity"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Inline Error Text
 */
export function InlineError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center text-status-critical text-sm mt-1', className)}>
      <AlertCircle size={14} className="mr-1 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Error Banner
 */
export function ErrorBanner({
  title,
  message,
  onRetry,
  onDismiss,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="alert-critical mb-6">
      <div className="flex items-start">
        <XCircle size={24} className="flex-shrink-0" />
        <div className="ml-4 flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm opacity-90">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium underline hover:no-underline"
            >
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 flex-shrink-0 hover:opacity-75 transition-opacity"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
