import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PropertyGroupProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PropertyGroup({
  title,
  icon,
  defaultOpen = false,
  children,
  className,
}: PropertyGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn('property-group border-b border-white/10', className)}>
      <button
        onClick={toggleOpen}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between',
          'hover:bg-white/5 transition-colors duration-200',
          'focus:outline-none focus:bg-white/5',
        )}
        aria-expanded={isOpen}
        aria-controls={`group-content-${title.replace(/\s/g, '-')}`}
        type="button"
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-lg flex-shrink-0" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="font-medium text-white/90 text-sm">{title}</span>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'transition-transform duration-200 text-white/60',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={`group-content-${title.replace(/\s/g, '-')}`}
          className={cn(
            'px-4 py-3 space-y-3',
            'animate-in slide-in-from-top-2 duration-200',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
