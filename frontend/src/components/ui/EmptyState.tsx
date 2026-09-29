import { Inbox, AlertCircle, Search, Database, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Empty State Component
 * Professional empty state for data lists and views
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="w-16 h-16 bg-dark-surface rounded-full flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * No Data Empty State
 */
export function NoData({
  message = 'No data available',
  action,
}: {
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <EmptyState
      icon={Database}
      title={message}
      description="There is currently no data to display. Check back later or adjust your filters."
      action={action}
    />
  );
}

/**
 * No Results Empty State
 */
export function NoResults({
  searchTerm,
  onClear,
}: {
  searchTerm?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        searchTerm
          ? `No results match "${searchTerm}". Try adjusting your search.`
          : 'No results match your current filters.'
      }
      action={
        onClear && (
          <button onClick={onClear} className="btn-secondary btn-sm">
            Clear filters
          </button>
        )
      }
    />
  );
}

/**
 * Error Empty State
 */
export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Oops!"
      description={message}
      action={
        onRetry && (
          <button onClick={onRetry} className="btn-primary btn-sm">
            Try again
          </button>
        )
      }
    />
  );
}
