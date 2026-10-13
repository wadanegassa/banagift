import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full appearance-none rounded border border-border bg-white px-3.5 py-2.5 pr-9 text-sm text-text',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40',
          'disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60',
          error && 'border-danger focus:border-danger focus:ring-danger/30',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
  );
});
Select.displayName = 'Select';
