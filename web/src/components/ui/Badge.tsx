import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const variantStyles = {
  default:
    'bg-[var(--color-text)]/10 text-[var(--color-text)]',
  success:
    'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  warning:
    'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  error:
    'bg-[var(--color-error)]/15 text-[var(--color-error)]',
  gold:
    'bg-[var(--color-accent-gold)]/25 text-[var(--color-accent-gold-ink)]',
  warm:
    'bg-[var(--color-accent-warm)]/20 text-[var(--color-accent-warm-ink)]',
  primary:
    'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
} as const;

type BadgeVariant = keyof typeof variantStyles;

interface BadgeProps {
  readonly children: ReactNode;
  readonly variant?: BadgeVariant;
  readonly className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5',
        'text-[length:var(--text-xs)] font-medium leading-tight',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
