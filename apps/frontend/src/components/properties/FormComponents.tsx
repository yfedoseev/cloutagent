interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function TextInput({
  label,
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  required = false,
}: TextInputProps) {
  const id = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-300 mb-1"
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-gray-700 border rounded text-white ${
          error ? 'border-red-500' : 'border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  error,
  disabled = false,
  required = false,
  helperText,
}: NumberInputProps) {
  const id = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-300 mb-1"
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-gray-700 border rounded text-white ${
          error ? 'border-red-500' : 'border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-gray-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description?: string }[];
  error?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  error,
  disabled = false,
  required = false,
  helperText,
}: SelectProps) {
  const id = `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-300 mb-1"
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-gray-700 border rounded text-white ${
          error ? 'border-red-500' : 'border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-gray-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}

interface TextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  monospace?: boolean;
}

export function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  error,
  placeholder,
  disabled = false,
  required = false,
  helperText,
  monospace = false,
}: TextareaProps) {
  const id = `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-300 mb-1"
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-gray-700 border rounded text-white resize-y ${
          monospace ? 'font-mono text-sm' : ''
        } ${error ? 'border-red-500' : 'border-gray-600'} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-gray-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  helperText?: string;
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  helperText,
}: CheckboxProps) {
  const id = `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm cursor-pointer"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4"
        />
        <span className={`text-gray-300 ${disabled ? 'opacity-50' : ''}`}>
          {label}
        </span>
      </label>
      {helperText && (
        <p className="text-xs text-gray-400 mt-1 ml-6">{helperText}</p>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  error?: string;
  disabled?: boolean;
  helperText?: string;
  showValue?: boolean;
  minLabel?: string;
  maxLabel?: string;
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  error,
  disabled = false,
  helperText,
  showValue = true,
  minLabel,
  maxLabel,
}: SliderProps) {
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-300 mb-1"
      >
        {label} {showValue && `: ${value.toFixed(2)}`}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={`w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>{minLabel || min}</span>
          <span>{maxLabel || max}</span>
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-gray-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}
