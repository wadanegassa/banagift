import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
      <Loader2 className={cn('h-6 w-6 animate-spin text-accent', className)} />
    </div>
  );
}
