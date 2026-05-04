'use client';

import { useState } from 'react';
import { Star, Flag, Check, X, ShieldAlert, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

interface Review {
  readonly id: string;
  readonly rating: number;
  readonly title: string;
  readonly body: string;
  readonly author: string;
  readonly operator: string;
  readonly route: string;
  readonly tripDate: string;
  readonly submittedAt: string;
  readonly flags: ReadonlyArray<'profanity' | 'spam' | 'offensive' | 'off_topic'>;
  readonly status: 'pending' | 'approved' | 'rejected';
}

const MOCK_REVIEWS: ReadonlyArray<Review> = [
  {
    id: 'r-1',
    rating: 5,
    title: 'Voyage parfait, équipage attentionné',
    body: 'Le chauffeur était très professionnel. Arrivée pile à l\'heure, climatisation nickel. La wifi a un peu laché à la frontière mais sinon rien à redire.',
    author: 'Aminata B.',
    operator: 'STC Ghana',
    route: 'Abidjan → Accra',
    tripDate: '2026-04-14',
    submittedAt: 'Il y a 2 h',
    flags: [],
    status: 'pending',
  },
  {
    id: 'r-2',
    rating: 1,
    title: 'Expérience horrible',
    body: 'Bus en retard de 3 heures, aucune information. Le chauffeur était [propos retirés par modération]. Je ne voyagerai plus jamais avec eux.',
    author: 'Jean K.',
    operator: 'Trans Africa',
    route: 'Dakar → Bamako',
    tripDate: '2026-04-15',
    submittedAt: 'Il y a 4 h',
    flags: ['profanity', 'offensive'],
    status: 'pending',
  },
  {
    id: 'r-3',
    rating: 4,
    title: 'Très bon rapport qualité-prix',
    body: 'Bus confortable, prise USB fonctionnelle. Seul bémol : les toilettes à bord étaient fermées sur le trajet retour.',
    author: 'Kwame M.',
    operator: 'UTB Benin',
    route: 'Lomé → Cotonou',
    tripDate: '2026-04-12',
    submittedAt: 'Il y a 8 h',
    flags: [],
    status: 'pending',
  },
  {
    id: 'r-4',
    rating: 5,
    title: 'ACHETEZ MES CHAUSSURES PROMO',
    body: 'Visitez www.promo-chaussures.example pour 50% de réduction, offre limitée !!!',
    author: 'anonymous_47',
    operator: 'STC Ghana',
    route: 'Accra → Kumasi',
    tripDate: '2026-04-16',
    submittedAt: 'Il y a 12 h',
    flags: ['spam', 'off_topic'],
    status: 'pending',
  },
];

const FLAG_LABELS: Record<Review['flags'][number], string> = {
  profanity: 'Propos grossier',
  spam: 'Spam',
  offensive: 'Offensant',
  off_topic: 'Hors sujet',
};

function StarRow({ rating }: { readonly rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i <= rating
              ? 'fill-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
              : 'fill-black/10 text-black/10',
          )}
        />
      ))}
      <span className="ml-1 text-xs font-medium tabular-nums">{rating}.0</span>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [filter, setFilter] = useState<'all' | 'flagged' | 'clean'>('all');
  const filtered = MOCK_REVIEWS.filter((r) => {
    if (filter === 'flagged') return r.flags.length > 0;
    if (filter === 'clean') return r.flags.length === 0;
    return true;
  });

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h2 className="display text-2xl font-medium tracking-tight">Modération des avis</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {MOCK_REVIEWS.length} avis en file · ML a pré-signalé{' '}
          {MOCK_REVIEWS.filter((r) => r.flags.length > 0).length} entrées suspectes.
        </p>
      </header>

      <div className="flex items-center gap-2 text-xs">
        {(['all', 'flagged', 'clean'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-[var(--radius-full)] px-3 py-1 font-medium transition-colors',
              filter === f
                ? 'bg-[var(--color-accent-warm-ink)] text-white'
                : 'border border-black/10 text-[var(--color-text-muted)] hover:border-black/20',
            )}
          >
            {f === 'all' ? 'Tous' : f === 'flagged' ? 'Signalés' : 'Propres'}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {filtered.map((r, i) => (
          <li
            key={r.id}
            className={cn(
              'animate-entrance flex flex-col gap-4 rounded-[var(--radius-xl)] border bg-[var(--color-surface-elevated)] p-5 shadow-sm',
              r.flags.length > 0
                ? 'border-[var(--color-error)]/30 ring-1 ring-[var(--color-error)]/10'
                : 'border-black/5',
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRow rating={r.rating} />
                  {r.flags.length > 0 && (
                    <Badge
                      variant="default"
                      className="gap-1 bg-[var(--color-error)]/10 text-[var(--color-error)] ring-[var(--color-error)]/20 text-[10px] font-semibold uppercase"
                    >
                      <ShieldAlert className="h-2.5 w-2.5" />
                      ML signalé
                    </Badge>
                  )}
                </div>
                <h3 className="display mt-1 text-lg font-medium tracking-tight">{r.title}</h3>
                <p className="mt-1 max-w-2xl text-sm text-[var(--color-text)]">{r.body}</p>

                {r.flags.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {r.flags.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-[var(--color-error)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-error)]"
                      >
                        <Flag className="h-2.5 w-2.5" />
                        {FLAG_LABELS[f]}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                  <span>
                    <span className="font-medium text-[var(--color-text)]">{r.author}</span> ·{' '}
                    {r.submittedAt}
                  </span>
                  <span>·</span>
                  <span>
                    {r.operator} · {r.route}
                  </span>
                  <span>·</span>
                  <span>Trajet du {r.tripDate}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => toast.success('Avis approuvé')}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-success)] transition-colors hover:bg-[var(--color-success)]/20"
                >
                  <Check className="h-3.5 w-3.5" />
                  Publier
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Avis mis en attente')}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-black/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-black/5"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Demander modif.
                </button>
                <button
                  type="button"
                  onClick={() => toast.error('Avis rejeté')}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/20"
                >
                  <X className="h-3.5 w-3.5" />
                  Rejeter
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
