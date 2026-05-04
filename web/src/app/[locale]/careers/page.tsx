import Link from 'next/link';
import { MapPin, Briefcase, ArrowRight, Heart, Coffee, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Role {
  readonly id: string;
  readonly title: string;
  readonly team: string;
  readonly location: string;
  readonly type: 'full-time' | 'part-time' | 'internship';
  readonly description: string;
  readonly tags: ReadonlyArray<string>;
}

const ROLES: ReadonlyArray<Role> = [
  {
    id: 'be-1',
    title: 'Senior Backend Engineer (Go)',
    team: 'Platform',
    location: 'Abidjan · Hybride',
    type: 'full-time',
    description: 'Rejoignez l\'équipe qui construit la plateforme de réservation la plus performante d\'Afrique de l\'Ouest. Vous concevrez des microservices Go haute-disponibilité.',
    tags: ['Go', 'PostgreSQL', 'Kafka', 'Kubernetes'],
  },
  {
    id: 'fe-1',
    title: 'Senior Frontend Engineer (Next.js)',
    team: 'Product',
    location: 'Abidjan ou télétravail',
    type: 'full-time',
    description: 'Vous designez et construisez les interfaces voyageur/opérateur avec Next.js 15 et Tailwind v4. Accessibilité WCAG 2.1 AA obligatoire.',
    tags: ['React', 'TypeScript', 'Tailwind', 'A11y'],
  },
  {
    id: 'pm-1',
    title: 'Product Manager — Opérateurs',
    team: 'Product',
    location: 'Abidjan · Hybride',
    type: 'full-time',
    description: 'Vous travaillez directement avec les compagnies de bus pour identifier leurs besoins et prioriser la roadmap opérateur.',
    tags: ['Product', 'UX', 'Terrain'],
  },
  {
    id: 'ops-1',
    title: 'Responsable partenariats Ghana',
    team: 'Ops',
    location: 'Accra · Temps plein sur site',
    type: 'full-time',
    description: 'Vous ouvrez et entretenez nos relations avec les opérateurs ghanéens. Voyage fréquent entre Accra, Kumasi, Tema.',
    tags: ['Business dev', 'Anglais', 'Twi/Ga bienvenu'],
  },
  {
    id: 'ds-1',
    title: 'Data Scientist — ML Fraude',
    team: 'Platform',
    location: 'Télétravail (UTC+0 ±2h)',
    type: 'full-time',
    description: 'Vous améliorez notre moteur de détection de fraude (MLflow, XGBoost). Seuils configurables, SLA 4h sur score ≥ 0.85.',
    tags: ['Python', 'MLflow', 'XGBoost'],
  },
  {
    id: 'int-1',
    title: 'Stagiaire design produit (6 mois)',
    team: 'Design',
    location: 'Abidjan · Sur site',
    type: 'internship',
    description: 'Vous travaillerez sur les flows voyageur aux côtés du lead design. Portfolio requis, French + English.',
    tags: ['Figma', 'Design system', 'A11y'],
  },
];

const PERKS = [
  { icon: Heart, label: 'Mutuelle santé premium', body: 'Couverture 100% famille incluse' },
  { icon: Wifi, label: 'Télétravail flexible', body: '3 jours/semaine possible sur la plupart des rôles' },
  { icon: Coffee, label: 'Budget apprentissage', body: '1 500 € / an par personne' },
  { icon: Briefcase, label: 'Stock-options', body: 'Plan BSPCE pour tous les CDI' },
];

const TYPE_LABEL = {
  'full-time': 'CDI',
  'part-time': 'Temps partiel',
  internship: 'Stage',
} as const;

export default function CareersPage() {
  return (
    <main className="mx-auto flex max-w-[var(--max-content)] flex-col gap-[var(--space-section)] px-[var(--space-page-x)] py-[var(--space-section)]">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
          Carrières
        </p>
        <h1 className="display mt-3 max-w-3xl text-[clamp(2.5rem,1rem+4vw,4rem)] font-medium leading-[1.05] tracking-tight">
          Construisez <em className="italic text-[var(--color-accent-gold-ink)]">la Route Dorée</em> avec nous.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-text-muted)]">
          Nous recrutons pour transformer le voyage en bus en Afrique de l&apos;Ouest. Équipe
          répartie entre Abidjan, Accra, Dakar, avec télétravail possible sur la plupart des
          postes.
        </p>
      </header>

      <section>
        <h2 className="display text-2xl font-medium">Postes ouverts</h2>
        <ul className="mt-6 flex flex-col divide-y divide-black/5 border-y border-black/5">
          {ROLES.map((role, i) => (
            <li
              key={role.id}
              className="animate-entrance flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" className="text-[10px] uppercase tracking-wider">
                    {role.team}
                  </Badge>
                  <Badge variant="default" className="text-[10px] uppercase tracking-wider">
                    {TYPE_LABEL[role.type]}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                    <MapPin className="h-3 w-3" />
                    {role.location}
                  </span>
                </div>
                <h3 className="display mt-2 text-xl font-medium tracking-tight">{role.title}</h3>
                <p className="mt-1.5 max-w-3xl text-sm text-[var(--color-text-muted)]">
                  {role.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {role.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[var(--radius-full)] bg-black/5 px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <Button asChild className="gap-2 shrink-0">
                <a href={`mailto:jobs@busexpress.africa?subject=Candidature ${encodeURIComponent(role.title)}`}>
                  Postuler
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-8">
        <h2 className="display text-2xl font-medium">Ce que nous offrons</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.label} className="flex flex-col gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold">{p.label}</h3>
                <p className="text-xs text-[var(--color-text-muted)]">{p.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="rounded-[var(--radius-lg)] border border-dashed border-black/10 p-6 text-center text-sm text-[var(--color-text-muted)]">
        Rien qui vous correspond ? Envoyez-nous une candidature spontanée à{' '}
        <a
          href="mailto:jobs@busexpress.africa"
          className="font-medium text-[var(--color-accent-warm-ink)] underline-offset-2 hover:underline"
        >
          jobs@busexpress.africa
        </a>
        .
      </footer>
    </main>
  );
}
