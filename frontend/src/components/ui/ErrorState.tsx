/**
 * Error State Components
 * Display error messages with retry options
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/utils/cn';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <AlertCircle size={48} className="text-status-critical mb-4" />
      <h3 className="text-lg font-semibold text-gray-100 mb-2">Error Loading Data</h3>
      <p className="text-sm text-gray-400 mb-6 text-center max-w-md">{error}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary btn-sm flex items-center">
          <RefreshCw size={16} className="mr-2" />
          Retry
        </button>
      )}
    </div>
  );
}

export function CardError({ error, onRetry }: ErrorStateProps) {
  return (
    <Card>
      <ErrorState error={error} onRetry={onRetry} />
    </Card>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      {icon && <div className="text-gray-500 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-100 mb-2">{title}</h3>
      {message && <p className="text-sm text-gray-400 mb-6 text-center max-w-md">{message}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-secondary btn-sm">
          {action.label}
        </button>
      )}
    </div>
  );
}
