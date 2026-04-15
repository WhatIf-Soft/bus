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
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-sm tabular-nums',
        warn ? 'bg-amber-100 text-amber-900' : 'bg-black/5 text-[var(--color-text)]',
      )}
    >
      <span aria-hidden>⏱</span>
      Siège réservé · {formatRemaining(remaining)}
    </div>
  );
}
