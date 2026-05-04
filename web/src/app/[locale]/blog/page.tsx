import Link from 'next/link';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface BlogPost {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly date: string;
  readonly readMin: number;
  readonly author: string;
  readonly category: 'Produit' | 'Voyage' | 'Culture' | 'Coulisses';
  readonly featured?: boolean;
}

const POSTS: ReadonlyArray<BlogPost> = [
  {
    slug: 'ouagadougou-vs-abidjan-nuit-ou-jour',
    title: 'Abidjan ↔ Ouagadougou : de nuit ou de jour ?',
    excerpt:
      'Nous avons analysé 18 mois de données sur le trajet le plus populaire de la plateforme. Vitesse, confort, prix — voici ce qui se cache derrière votre choix d\'horaire.',
    date: '2026-04-12',
    readMin: 8,
    author: 'Aïssata Cissé',
    category: 'Voyage',
    featured: true,
  },
  {
    slug: 'mobile-money-comment-ca-marche',
    title: 'Mobile Money : derrière les 15 minutes d\'attente',
    excerpt:
      'Pourquoi un paiement Orange Money met parfois 10 minutes à être confirmé ? Plongée technique dans les IPN, webhooks et SLAs entre opérateurs télécoms.',
    date: '2026-03-30',
    readMin: 12,
    author: 'Thomas Kouakou',
    category: 'Produit',
  },
  {
    slug: 'gbaka-taxi-la-route-doree',
    title: 'Du gbaka au bus VIP : l\'évolution du transport ouest-africain',
    excerpt:
      'Le tro-tro ghanéen, le gbaka ivoirien, le sotrama malien. Histoire des minibus collectifs qui ont irrigué l\'Afrique de l\'Ouest pendant 60 ans.',
    date: '2026-03-14',
    readMin: 15,
    author: 'Koffi Adjoua',
    category: 'Culture',
  },
  {
    slug: 'recrutement-backend-go',
    title: 'Pourquoi nous écrivons notre backend en Go',
    excerpt:
      'Go, Kafka, PostgreSQL, Redis distribué. Retour d\'expérience après 2 ans de production sur une plateforme multi-pays.',
    date: '2026-02-28',
    readMin: 10,
    author: 'Sékou Diallo',
    category: 'Produit',
  },
  {
    slug: 'phare-lighthouse-logo',
    title: 'Le phare, la route, le lever de soleil : derrière notre logo',
    excerpt:
      'Comment nous avons distillé l\'identité "La Route Dorée" en une icône de 180×180 pixels.',
    date: '2026-02-01',
    readMin: 6,
    author: 'Marie Ouédraogo',
    category: 'Coulisses',
  },
  {
    slug: 'wcag-afrique-numerique',
    title: 'WCAG 2.1 AA en Afrique : pourquoi c\'est encore plus critique',
    excerpt:
      '40% de nos utilisateurs accèdent au site via Chrome-on-Android en 3G. Les standards d\'accessibilité ne sont pas optionnels.',
    date: '2026-01-18',
    readMin: 9,
    author: 'Aminata Barry',
    category: 'Produit',
  },
];

const CATEGORY_STYLE: Record<BlogPost['category'], string> = {
  Produit:
    'bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-[var(--color-primary)]/20',
  Voyage:
    'bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)] ring-[var(--color-accent-warm)]/30',
  Culture:
    'bg-[var(--color-accent-gold)]/25 text-[var(--color-accent-warm-ink)] ring-[var(--color-accent-warm-ink)]/25',
  Coulisses: 'bg-black/5 text-[var(--color-text-muted)] ring-black/10',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogPage() {
  const featured = POSTS.find((p) => p.featured);
  const rest = POSTS.filter((p) => !p.featured);

  return (
    <main className="mx-auto flex max-w-[var(--max-content)] flex-col gap-[var(--space-section)] px-[var(--space-page-x)] py-[var(--space-section)]">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
          Journal de bord
        </p>
        <h1 className="display mt-3 max-w-3xl text-[clamp(2.5rem,1rem+4vw,4rem)] font-medium leading-[1.05] tracking-tight">
          Récits, données & <em className="italic text-[var(--color-accent-gold-ink)]">coulisses</em>.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-text-muted)]">
          Ce que nous apprenons en construisant la plateforme et en parcourant les routes de
          l&apos;Afrique de l&apos;Ouest.
        </p>
      </header>

      {featured && (
        <article className="card-hover group relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-light)] to-[oklch(22%_0.14_280)] p-8 text-white shadow-md sm:p-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 85% 15%, oklch(82% 0.14 85 / 0.5), transparent 55%)',
            }}
          />
          <div className="relative max-w-2xl">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent-gold)]">
              À la une
            </span>
            <h2 className="display mt-4 text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
              {featured.title}
            </h2>
            <p className="mt-4 text-white/80">{featured.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {formatDate(featured.date)}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {featured.readMin} min
              </span>
              <span>·</span>
              <span>{featured.author}</span>
            </div>
            <Link
              href="#"
              className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent-gold)] px-5 py-2.5 text-sm font-semibold text-[oklch(12%_0.02_260)] transition-transform hover:-translate-y-0.5"
            >
              Lire l&apos;article
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      )}

      <section>
        <h2 className="display text-2xl font-medium">Tous les articles</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {rest.map((p, i) => (
            <li key={p.slug}>
              <Link
                href="#"
                className="card-hover animate-entrance group flex h-full flex-col gap-3 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-6 shadow-sm"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="default"
                    className={`text-[10px] font-semibold ${CATEGORY_STYLE[p.category]}`}
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {p.category}
                  </Badge>
                </div>
                <h3 className="display text-xl font-medium leading-tight tracking-tight transition-colors group-hover:text-[var(--color-accent-warm-ink)]">
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {p.excerpt}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <span>{formatDate(p.date)}</span>
                  <span>·</span>
                  <span>{p.readMin} min</span>
                  <span>·</span>
                  <span>{p.author}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[var(--radius-xl)] border border-[var(--color-accent-warm)]/20 bg-gradient-to-br from-[var(--color-accent-warm)]/[0.04] to-[var(--color-accent-gold)]/[0.04] p-10 text-center">
        <h2 className="display text-[clamp(1.5rem,1rem+2vw,2.25rem)] font-medium leading-tight tracking-tight">
          Recevez les nouveaux articles
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-text-muted)]">
          Une newsletter mensuelle, pas plus. Sur le voyage, la tech et les cultures ouest-africaines.
        </p>
        <form className="mx-auto mt-6 flex max-w-md items-center gap-2">
          <input
            type="email"
            placeholder="votre@email.com"
            className="flex-1 rounded-[var(--radius-md)] border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent-warm-ink)]/50 focus:ring-2 focus:ring-[var(--color-accent-warm)]/20"
          />
          <button
            type="submit"
            className="rounded-[var(--radius-md)] bg-[var(--color-accent-gold)] px-5 py-2.5 text-sm font-semibold text-[oklch(12%_0.02_260)] transition-transform hover:-translate-y-0.5"
          >
            S&apos;abonner
          </button>
        </form>
      </section>
    </main>
  );
}
