'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface CookieCategory {
  readonly id: 'essential' | 'functional' | 'analytics' | 'marketing';
  readonly label: string;
  readonly description: string;
  readonly cookies: ReadonlyArray<{ name: string; purpose: string; duration: string }>;
  readonly required: boolean;
}

const CATEGORIES: ReadonlyArray<CookieCategory> = [
  {
    id: 'essential',
    label: 'Essentiels',
    description:
      'Indispensables au fonctionnement du site : authentification, panier, préférences de langue, sécurité anti-CSRF. Ils ne peuvent pas être désactivés.',
    required: true,
    cookies: [
      { name: 'bex_session', purpose: 'Session utilisateur', duration: '15 min' },
      { name: 'bex_csrf', purpose: 'Protection CSRF', duration: 'Session' },
      { name: 'bex_locale', purpose: 'Préférence de langue', duration: '12 mois' },
    ],
  },
  {
    id: 'functional',
    label: 'Fonctionnels',
    description:
      'Améliorent votre expérience : recherches récentes, villes favorites, préférences d\'accessibilité.',
    required: false,
    cookies: [
      { name: 'bex_recent_routes', purpose: 'Recherches récentes', duration: '30 jours' },
      { name: 'bex_reduce_motion', purpose: 'Accessibilité', duration: '12 mois' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytiques',
    description:
      'Nous aident à comprendre comment vous utilisez le site pour l\'améliorer. Données anonymisées.',
    required: false,
    cookies: [
      { name: '_pk_id', purpose: 'Visiteur unique (Matomo)', duration: '13 mois' },
      { name: '_pk_ses', purpose: 'Session analytique', duration: '30 min' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description:
      'Personnalisent les publicités et mesurent leur efficacité sur les réseaux sociaux et partenaires.',
    required: false,
    cookies: [{ name: '_fbp', purpose: 'Meta Pixel', duration: '3 mois' }],
  },
];

export default function CookiesPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  function toggle(id: string, required: boolean) {
    if (required) return;
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  }

  function acceptAll() {
    setPrefs({ essential: true, functional: true, analytics: true, marketing: true });
    toast.success('Tous les cookies sont acceptés');
  }

  function rejectOptional() {
    setPrefs({ essential: true, functional: false, analytics: false, marketing: false });
    toast.info('Cookies optionnels refusés');
  }

  function save() {
    toast.success('Préférences cookies enregistrées');
  }

  return (
    <>
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
          Transparence & contrôle
        </p>
        <h1 className="display mt-2 text-4xl font-medium leading-[1.05] tracking-tight">
          Gestion des <span className="italic">cookies</span>
        </h1>
        <p className="mt-3 max-w-prose text-sm text-[var(--color-text-muted)]">
          Nous utilisons des cookies pour fournir, sécuriser et améliorer notre service. Vous
          gardez le contrôle total : activez ou désactivez chaque catégorie ci-dessous.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={acceptAll}>Tout accepter</Button>
        <Button variant="secondary" onClick={rejectOptional}>
          Refuser les optionnels
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {CATEGORIES.map((c) => {
          const enabled = prefs[c.id];
          return (
            <section
              key={c.id}
              className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{c.label}</h3>
                    {c.required && (
                      <span className="inline-block rounded-[var(--radius-full)] bg-[var(--color-accent-warm)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-warm-ink)]">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{c.description}</p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`Activer ${c.label}`}
                  onClick={() => toggle(c.id, c.required)}
                  disabled={c.required}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-warm)]/40',
                    enabled ? 'bg-[var(--color-accent-warm-ink)]' : 'bg-black/10',
                    c.required && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
                      enabled ? 'translate-x-5' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>

              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                  Voir les cookies ({c.cookies.length})
                </summary>
                <table className="mt-3 w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-black/5 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                      <th className="py-2 pr-3 font-semibold">Nom</th>
                      <th className="py-2 pr-3 font-semibold">Finalité</th>
                      <th className="py-2 font-semibold">Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.cookies.map((k) => (
                      <tr key={k.name} className="border-b border-black/5 last:border-b-0">
                        <td className="py-2 pr-3 font-mono text-[11px]">{k.name}</td>
                        <td className="py-2 pr-3">{k.purpose}</td>
                        <td className="py-2 text-[var(--color-text-muted)]">{k.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </section>
          );
        })}
      </div>

      <div className="flex justify-end border-t border-black/5 pt-4">
        <Button onClick={save}>Enregistrer mes préférences</Button>
      </div>
    </>
  );
}
