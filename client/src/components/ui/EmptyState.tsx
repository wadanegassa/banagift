import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Gift } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Gift, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-dashed border-border bg-white/50 px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-sage" aria-hidden="true" />
      <h3 className="mt-4 font-serif text-xl text-text">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
