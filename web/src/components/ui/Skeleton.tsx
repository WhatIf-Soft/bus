import { cn } from '@/lib/cn';

interface SkeletonProps {
  readonly className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-surface)] p-[var(--space-card)]">
      <div className="flex items-center gap-3 pb-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex flex-col gap-2 py-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="pt-4">
        <Skeleton className="h-9 w-24 rounded-[var(--radius-md)]" />
      </div>
    </div>
  );
}

export function SkeletonTripCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-surface)] p-[var(--space-card)]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="my-3 flex items-center gap-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-0.5 flex-1" />
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-24 rounded-[var(--radius-md)]" />
      </div>
    </div>
  );
}
