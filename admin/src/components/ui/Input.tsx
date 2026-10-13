import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      aria-invalid={error ? true : undefined}
      className={cn(
        'w-full rounded border border-border bg-white px-3.5 py-2.5 text-sm text-text placeholder:text-muted/70',
        'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40',
        'disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60',
        error && 'border-danger focus:border-danger focus:ring-danger/30',
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
