'use client';

import { toast } from 'sonner';
import { UserCircle2, Building2, Shield } from 'lucide-react';
import { DEMO_USERS } from '@/lib/mock';
import { cn } from '@/lib/cn';

const ROLE_ICONS = {
  voyageur: UserCircle2,
  operateur: Building2,
  admin: Shield,
} as const;

const ROLE_LABELS = {
  voyageur: 'Voyageur',
  operateur: 'Opérateur',
  admin: 'Admin',
} as const;

const ROLE_STYLES = {
  voyageur:
    'bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)] ring-[var(--color-accent-warm)]/30',
  operateur: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-[var(--color-primary)]/20',
  admin: 'bg-[var(--color-accent-gold)]/25 text-[var(--color-accent-warm-ink)] ring-[var(--color-accent-warm-ink)]/25',
} as const;

export function DemoHintBanner() {
  function fill(user: typeof DEMO_USERS[number]) {
    const event = new CustomEvent('bex-demo-fill', {
      detail: { email: user.email, password: user.password },
    });
    window.dispatchEvent(event);
    toast.success(`Identifiants ${ROLE_LABELS[user.role]} pré-remplis`, {
      description: user.hint,
    });
  }

  return (
    <div className="animate-fade flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-accent-warm)]/25 bg-[var(--color-accent-warm)]/[0.04] p-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-warm-ink)]" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-warm-ink)]">
            Essayer la démo
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            Aucune inscription requise — choisissez un rôle et les identifiants sont pré-remplis.
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {DEMO_USERS.map((u) => {
          const Icon = ROLE_ICONS[u.role];
          return (
            <li key={u.email}>
              <button
                type="button"
                onClick={() => fill(u)}
                className="group flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-black/5 bg-white px-3 py-2 text-left transition-colors hover:border-[var(--color-accent-warm-ink)]/30"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] ring-1',
                    ROLE_STYLES[u.role],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {ROLE_LABELS[u.role]}
                    <span className="font-mono text-[10px] font-normal text-[var(--color-text-muted)]">
                      {u.email}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
                    {u.hint}
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-warm-ink)] opacity-0 transition-opacity group-hover:opacity-100">
                  Remplir →
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
