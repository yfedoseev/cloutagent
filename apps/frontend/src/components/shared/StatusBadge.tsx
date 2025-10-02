import { Loader, Circle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps {
  status: 'idle' | 'running' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  idle: {
    Icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    label: 'Idle',
  },
  running: {
    Icon: null, // Will render spinner
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    label: 'Running',
  },
  success: {
    Icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    label: 'Success',
  },
  error: {
    Icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    label: 'Error',
  },
} as const;

const sizeConfig = {
  sm: {
    container: 'px-2 py-1 text-xs gap-1',
    icon: 'text-xs',
    spinner: 12,
  },
  md: {
    container: 'px-3 py-1.5 text-sm gap-1.5',
    icon: 'text-sm',
    spinner: 14,
  },
  lg: {
    container: 'px-4 py-2 text-base gap-2',
    icon: 'text-base',
    spinner: 16,
  },
} as const;

export function StatusBadge({
  status,
  size = 'md',
  showLabel = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = sizeConfig[size];
  const StatusIcon = config.Icon;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all duration-200',
        config.bgColor,
        config.color,
        sizeClasses.container,
        className,
      )}
      role="status"
      aria-label={`${config.label} status`}
    >
      {status === 'running' ? (
        <Loader
          className="animate-spin"
          size={sizeClasses.spinner}
          aria-hidden="true"
        />
      ) : (
        StatusIcon && <StatusIcon size={sizeClasses.spinner} aria-hidden="true" />
      )}
      {showLabel && (
        <span className="font-semibold">{config.label}</span>
      )}
    </div>
  );
}
