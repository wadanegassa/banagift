import { Skeleton } from '@/components/ui/Skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col border border-border bg-white">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="flex flex-col gap-2 px-4 py-3.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}
