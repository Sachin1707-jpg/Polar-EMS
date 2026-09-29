import { cn } from '@/utils/cn';
import type { CardProps } from '@/types';

/**
 * Base Card Component
 * Professional container for content with variants
 */
export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  const baseClass = 'card';
  
  const variantClasses = {
    default: '',
    bordered: 'border-2',
    elevated: 'shadow-lg',
  };
  
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        baseClass,
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Interactive Card with hover effect
 */
export function CardHover({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'card-hover p-6',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * Card Header Component
 */
export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Card Footer Component
 */
export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-dark-border', className)}>
      {children}
    </div>
  );
}
