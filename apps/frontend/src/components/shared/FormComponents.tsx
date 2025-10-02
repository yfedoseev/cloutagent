import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

// TextField Component
export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function TextField({
  label,
  error,
  helpText,
  icon,
  size = 'md',
  className,
  required,
  id,
  ...props
}: TextFieldProps) {
  const inputId = id || `input-${label.replace(/\s/g, '-').toLowerCase()}`;

  const sizeClasses = {
    sm: 'px-2 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return (
    <div className="field-group space-y-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-white/70 flex items-center gap-1"
      >
        {label}
        {required && (
          <span className="text-red-400" aria-label="required">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            'w-full bg-white/5 rounded-lg text-white',
            'border-2 border-transparent focus:border-blue-500',
            'transition-all duration-200 placeholder-white/30',
            'focus:outline-none focus:bg-white/10',
            sizeClasses[size],
            icon && 'pl-10',
            error && 'border-red-500 focus:border-red-500',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
          }
          {...props}
        />
      </div>

      {error && (
        <div
          id={`${inputId}-error`}
          className="text-xs text-red-400 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle size={12} aria-hidden="true" />
          {error}
        </div>
      )}

      {helpText && !error && (
        <div id={`${inputId}-help`} className="text-xs text-white/50">
          {helpText}
        </div>
      )}
    </div>
  );
}

// SelectField Component
export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  helpText?: string;
}

export function SelectField({
  label,
  options,
  error,
  helpText,
  className,
  required,
  id,
  ...props
}: SelectFieldProps) {
  const selectId = id || `select-${label.replace(/\s/g, '-').toLowerCase()}`;

  return (
    <div className="field-group space-y-2">
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-white/70 flex items-center gap-1"
      >
        {label}
        {required && (
          <span className="text-red-400" aria-label="required">
            *
          </span>
        )}
      </label>

      <select
        id={selectId}
        className={cn(
          'w-full px-3 py-2 bg-white/5 rounded-lg text-white',
          'border-2 border-transparent focus:border-blue-500',
          'transition-all duration-200',
          'focus:outline-none focus:bg-white/10',
          'text-sm appearance-none cursor-pointer',
          'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23999\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")]',
          'bg-[length:1.25rem] bg-no-repeat bg-[right_0.5rem_center]',
          'pr-10',
          error && 'border-red-500 focus:border-red-500',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined
        }
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <div
          id={`${selectId}-error`}
          className="text-xs text-red-400 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle size={12} aria-hidden="true" />
          {error}
        </div>
      )}

      {helpText && !error && (
        <div id={`${selectId}-help`} className="text-xs text-white/50">
          {helpText}
        </div>
      )}
    </div>
  );
}

// TextareaField Component
export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export function TextareaField({
  label,
  error,
  helpText,
  className,
  required,
  id,
  ...props
}: TextareaFieldProps) {
  const textareaId = id || `textarea-${label.replace(/\s/g, '-').toLowerCase()}`;

  return (
    <div className="field-group space-y-2">
      <label
        htmlFor={textareaId}
        className="text-sm font-medium text-white/70 flex items-center gap-1"
      >
        {label}
        {required && (
          <span className="text-red-400" aria-label="required">
            *
          </span>
        )}
      </label>

      <textarea
        id={textareaId}
        className={cn(
          'w-full px-3 py-2 bg-white/5 rounded-lg text-white',
          'border-2 border-transparent focus:border-blue-500',
          'transition-all duration-200 placeholder-white/30',
          'focus:outline-none focus:bg-white/10',
          'text-sm resize-none',
          error && 'border-red-500 focus:border-red-500',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${textareaId}-error` : helpText ? `${textareaId}-help` : undefined
        }
        {...props}
      />

      {error && (
        <div
          id={`${textareaId}-error`}
          className="text-xs text-red-400 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle size={12} aria-hidden="true" />
          {error}
        </div>
      )}

      {helpText && !error && (
        <div id={`${textareaId}-help`} className="text-xs text-white/50">
          {helpText}
        </div>
      )}
    </div>
  );
}
