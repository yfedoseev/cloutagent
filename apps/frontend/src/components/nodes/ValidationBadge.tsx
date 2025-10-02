import type { ValidationError } from '@cloutagent/types';

interface ValidationBadgeProps {
  errors: ValidationError[];
}

export function ValidationBadge({ errors }: ValidationBadgeProps) {
  if (errors.length === 0) return null;

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  return (
    <div className="absolute -top-2 -right-2 flex gap-1">
      {errorCount > 0 && (
        <div
          className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          title={`${errorCount} error${errorCount !== 1 ? 's' : ''}`}
        >
          {errorCount}
        </div>
      )}
      {warningCount > 0 && (
        <div
          className="bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          title={`${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
        >
          {warningCount}
        </div>
      )}
    </div>
  );
}
