import Link from 'next/link';
import { BookOpen, Code2, Webhook, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DocSection {
  readonly id: string;
  readonly icon: typeof BookOpen;
  readonly title: string;
  readonly description: string;
  readonly topics: ReadonlyArray<string>;
}

const SECTIONS: ReadonlyArray<DocSection> = [
  {
    id: 'getting-started',
    icon: Zap,
    title: 'Démarrage rapide',
    description: 'Obtenez votre clé API et faites votre première réservation en 5 minutes.',
    topics: ['Création du compte développeur', 'Authentification JWT', 'Premier appel curl', 'Environnement sandbox'],
  },
  {
    id: 'rest',
    icon: Code2,
    title: 'Référence REST',
    description: 'Documentation exhaustive des endpoints de l\'API v1.',
    topics: ['Search trips', 'Create booking', 'Initiate payment', 'Issue tickets', 'Validate QR'],
  },
  {
    id: 'webhooks',
    icon: Webhook,
    title: 'Webhooks',
    description: 'Recevez des événements en temps réel sur votre serveur.',
    topics: ['Payment webhooks', 'Booking state changes', 'Seat lock expiry', 'Signature HMAC-SHA256'],
  },
  {
    id: 'guides',
    icon: BookOpen,
    title: 'Guides',
    description: 'Walkthroughs pour les intégrations les plus courantes.',
    topics: ['Widget de réservation', 'Intégration ERP', 'Réconciliation financière', 'Anti-fraude'],
  },
];

const ENDPOINTS = [
  { method: 'GET', path: '/search/trips', description: 'Recherche des trajets disponibles' },
  { method: 'POST', path: '/bookings/', description: 'Créer une réservation' },
  { method: 'POST', path: '/payments/', description: 'Initier un paiement' },
  { method: 'POST', path: '/tickets/', description: 'Émettre les billets d\'une réservation' },
  { method: 'POST', path: '/tickets/validate', description: 'Valider un QR code à l\'embarquement' },
  { method: 'GET', path: '/operator/buses', description: 'Lister votre flotte' },
];

const METHOD_STYLE = {
  GET: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  POST: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  PUT: 'bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]',
  DELETE: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
} as const;

export default function OperatorDocsPage() {
  return (
    <main className="mx-auto flex max-w-[var(--max-content)] flex-col gap-[var(--space-section)] px-[var(--space-page-x)] py-[var(--space-section)]">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
          Documentation développeur
        </p>
        <h1 className="display mt-3 max-w-3xl text-[clamp(2.5rem,1rem+4vw,4rem)] font-medium leading-[1.05] tracking-tight">
          Une API <em className="italic text-[var(--color-accent-gold-ink)]">propre</em>, documentée, versionnée.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-text-muted)]">
          Intégrez BusExpress dans votre ERP, votre application maison ou votre widget web.
          REST + webhooks, JWT RS256, rate-limit généreux, sandbox complet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <a href="#getting-started">
              Démarrer
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href="https://api.busexpress.africa" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              OpenAPI spec
            </a>
          </Button>
        </div>
      </header>

      {/* Section cards */}
      <section className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <article
              key={s.id}
              id={s.id}
              className="card-hover animate-entrance flex flex-col gap-4 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-6 shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="display text-xl font-medium">{s.title}</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{s.description}</p>
                </div>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm">
                {s.topics.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-[var(--color-text-muted)]">
                    <span className="h-1 w-1 rounded-full bg-[var(--color-accent-warm-ink)]" />
                    {t}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      {/* Quick start code */}
      <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[oklch(12%_0.02_260)] p-8 text-white shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent-gold)]">
          Premier appel
        </p>
        <h2 className="display mt-2 text-2xl font-medium tracking-tight">
          Lancez votre première recherche
        </h2>
        <pre className="mt-5 overflow-x-auto rounded-[var(--radius-md)] bg-black/30 p-5 font-mono text-xs text-white/90">
{`curl https://api.busexpress.africa/v1/search/trips \\
  -H "Authorization: Bearer $BUSEXPRESS_TOKEN" \\
  -G \\
  --data-urlencode "origin=Abidjan" \\
  --data-urlencode "destination=Ouagadougou" \\
  --data-urlencode "date=2026-04-20"`}
        </pre>
        <p className="mt-4 text-xs text-white/50">
          Environnement sandbox : remplacez <code className="text-[var(--color-accent-gold)]">api.busexpress.africa</code>{' '}
          par <code className="text-[var(--color-accent-gold)]">sandbox.api.busexpress.africa</code>.
        </p>
      </section>

      {/* Endpoints table */}
      <section>
        <h2 className="display text-2xl font-medium">Endpoints les plus utilisés</h2>
        <ul className="mt-6 flex flex-col divide-y divide-black/5 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] shadow-sm">
          {ENDPOINTS.map((e) => (
            <li
              key={`${e.method}-${e.path}`}
              className="flex items-center gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-black/[0.02]"
            >
              <span
                className={`inline-block w-14 rounded-[var(--radius-sm)] px-2 py-0.5 text-center font-mono text-[10px] font-semibold ${METHOD_STYLE[e.method as keyof typeof METHOD_STYLE]}`}
              >
                {e.method}
              </span>
              <code className="font-mono text-sm">{e.path}</code>
              <span className="ml-auto text-xs text-[var(--color-text-muted)]">{e.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-dashed border-black/10 p-6 text-center text-sm text-[var(--color-text-muted)]">
        Support technique : <a href="mailto:devs@busexpress.africa" className="font-medium text-[var(--color-accent-warm-ink)] underline-offset-2 hover:underline">devs@busexpress.africa</a>
        {' '}— réponse sous 4 h ouvrées.
      </section>
    </main>
  );
}
