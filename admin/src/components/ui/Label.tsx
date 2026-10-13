import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label className={cn('block text-sm font-medium text-text mb-1.5', className)} {...props}>
      {children}
      {required && (
        <span className="text-accent ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
