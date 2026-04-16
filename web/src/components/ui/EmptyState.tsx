import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  readonly icon: ReactNode;
  readonly heading: string;
  readonly description: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ icon, heading, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-warm)]/10 text-[var(--color-accent-warm)]">
        {icon}
      </div>
      <h3 className="text-[var(--text-subheading)] font-semibold text-[var(--color-text)]">
        {heading}
      </h3>
      <p className="mt-1.5 max-w-sm text-[var(--text-base)] text-[var(--color-text-muted)]">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
