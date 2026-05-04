'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface LockTimerProps {
  readonly expiresAt: string;
  readonly onExpire?: () => void;
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function LockTimer({ expiresAt, onExpire }: LockTimerProps) {
  const target = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const r = target - Date.now();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, onExpire]);

  const warn = remaining <= 2 * 60 * 1000;

  return (
    <div
      role="timer"
      aria-live="polite"
      className={cn(
        'flex w-full items-center justify-between rounded-[var(--radius-lg)] px-4 py-2',
        warn
          ? 'animate-pulse border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/15 text-amber-900'
          : 'border border-[var(--color-accent-warm)]/30 bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]',
      )}
    >
      <span className="flex items-center gap-2 text-sm">
        <span aria-hidden>&#x23F1;</span>
        Siège réservé
      </span>
      <span className="font-mono text-sm tabular-nums">{formatRemaining(remaining)}</span>
    </div>
  );
}
