import { cn } from '@/lib/cn';

interface KenteDividerProps {
  readonly className?: string;
}

export function KenteDivider({ className }: KenteDividerProps) {
  return <div className={cn('kente-divider', className)} aria-hidden="true" />;
}
