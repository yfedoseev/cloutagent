import { AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { ValidationError } from '@cloutagent/types';
import { Tooltip } from '../shared/Tooltip';
import { cn } from '../../lib/utils';

interface ValidationBadgeProps {
  errors: ValidationError[];
  warnings: ValidationError[];
  onErrorClick?: (error: ValidationError) => void;
  className?: string;
}

function ErrorTooltipContent({
  errors,
  warnings,
}: {
  errors: ValidationError[];
  warnings: ValidationError[];
}) {
  return (
    <div className="space-y-2 max-w-sm">
      {errors.length > 0 && (
        <div>
          <div className="font-semibold text-red-400 mb-1 flex items-center gap-1">
            <AlertCircle size={12} />
            Errors ({errors.length})
          </div>
          <ul className="space-y-1 text-white/80">
            {errors.map((error, i) => (
              <li key={i} className="text-xs">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div>
          <div className="font-semibold text-yellow-400 mb-1 flex items-center gap-1">
            <AlertCircle size={12} />
            Warnings ({warnings.length})
          </div>
          <ul className="space-y-1 text-white/80">
            {warnings.map((warning, i) => (
              <li key={i} className="text-xs">
                • {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ValidationBadge({
  errors,
  warnings,
  onErrorClick,
  className,
}: ValidationBadgeProps) {
  const errorList = errors.filter(e => e.severity === 'error');
  const warningList = warnings.filter(w => w.severity === 'warning');

  if (errorList.length === 0 && warningList.length === 0) return null;

  const handleErrorClick = () => {
    if (onErrorClick && errorList.length > 0) {
      onErrorClick(errorList[0]);
    }
  };

  return (
    <div className="absolute -top-2 -right-2 flex gap-1">
      {/* Error Badge */}
      {errorList.length > 0 && (
        <div className="relative inline-block">
          <Tooltip
            content={<ErrorTooltipContent errors={errorList} warnings={[]} />}
            placement="top"
          >
            <button
              onClick={handleErrorClick}
              className={cn(
                'glass bg-red-500 rounded-full w-6 h-6',
                'text-xs font-bold text-red-400',
                'flex items-center justify-center',
                'transition-all duration-200 hover:scale-110',
                'focus:outline-none focus:ring-2 focus:ring-red-400/50',
                'animate-validation-pulse shadow-lg relative',
                className,
              )}
              title={`${errorList.length} error${errorList.length !== 1 ? 's' : ''}`}
              aria-label={`${errorList.length} ${errorList.length === 1 ? 'error' : 'errors'}${warningList.length > 0 ? `, ${warningList.length} ${warningList.length === 1 ? 'warning' : 'warnings'}` : ''}`}
              type="button"
            >
              {errorList.length}
            </button>
          </Tooltip>
          {/* Icon overlay - visually displayed but separate from button textContent */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <XCircle className="w-3 h-3 translate-x-[6px] translate-y-[-6px] text-red-300" />
          </div>
        </div>
      )}

      {/* Warning Badge */}
      {warningList.length > 0 && (
        <div className="relative inline-block">
          <Tooltip
            content={<ErrorTooltipContent errors={[]} warnings={warningList} />}
            placement="top"
          >
            <button
              className={cn(
                'glass bg-yellow-500 rounded-full w-6 h-6',
                'text-xs font-bold text-yellow-400',
                'flex items-center justify-center',
                'transition-all duration-200 hover:scale-110',
                'focus:outline-none focus:ring-2 focus:ring-yellow-400/50',
                'shadow-lg relative',
                className,
              )}
              title={`${warningList.length} warning${warningList.length !== 1 ? 's' : ''}`}
              aria-label={`${errorList.length > 0 ? `${errorList.length} ${errorList.length === 1 ? 'error' : 'errors'}, ` : ''}${warningList.length} ${warningList.length === 1 ? 'warning' : 'warnings'}`}
              type="button"
            >
              {warningList.length}
            </button>
          </Tooltip>
          {/* Icon overlay - visually displayed but separate from button textContent */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AlertTriangle className="w-3 h-3 translate-x-[6px] translate-y-[-6px] text-yellow-300" />
          </div>
        </div>
      )}
    </div>
  );
}
