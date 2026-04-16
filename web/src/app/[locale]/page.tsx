import Link from 'next/link';
import { SearchForm } from '@/components/search/SearchForm';
import { KenteDivider } from '@/components/ui/KenteDivider';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

interface HomePageProps {
  readonly params: Promise<{ locale: string }>;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const POPULAR_ROUTES = [
  { origin: 'Abidjan', destination: 'Yamoussoukro', price: '6 200', departures: 5 },
  { origin: 'Abidjan', destination: 'Bouake', price: '7 500', departures: 4 },
  { origin: 'Abidjan', destination: 'Accra', price: '15 000', departures: 3 },
  { origin: 'Accra', destination: 'Lome', price: '8 000', departures: 6 },
  { origin: 'Lome', destination: 'Cotonou', price: '5 500', departures: 4 },
  { origin: 'Abidjan', destination: 'Ouagadougou', price: '22 000', departures: 2 },
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: 'Recherchez',
    description: 'Trouvez votre trajet ideal parmi des centaines de destinations',
  },
  {
    number: 2,
    title: 'Reservez',
    description: 'Choisissez vos sieges et payez en toute securite',
  },
  {
    number: 3,
    title: 'Voyagez',
    description: 'Recevez votre billet avec QR code et embarquez',
  },
] as const;

const OPERATORS = ['STC Ghana', 'Africa Trans', 'Sahel Express'] as const;

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const today = todayIso();

  return (
    <>
      {/* HERO — animated gradient + staggered entrance */}
      <section className="hero-gradient hero-particles relative flex min-h-[75vh] items-center justify-center overflow-hidden">
        <div className="relative z-10 mx-auto w-full max-w-2xl px-[var(--space-page-x)] py-20">
          <h1 className="animate-entrance animate-entrance-1 text-center text-[var(--text-hero)] font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-lg">
            Réservez votre bus en un clic
          </h1>
          <p className="animate-entrance animate-entrance-2 mt-4 text-center text-lg text-white/70">
            Voyagez à travers l&apos;Afrique de l&apos;Ouest en toute confiance
          </p>

          <div className="animate-scale-in mt-10 rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm" style={{ animationDelay: '300ms' }}>
            <SearchForm locale={locale} />
          </div>

          <div className="animate-entrance animate-entrance-4 mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 8h12M8 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="4" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="12" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              500+ trajets
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2.5 8h11M8 2.5c-2 2-2 9 0 11M8 2.5c2 2 2 9 0 11" stroke="currentColor" strokeWidth="1" />
              </svg>
              3 pays
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="4" y="1.5" width="8" height="13" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <line x1="6.5" y1="12" x2="9.5" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Mobile Money
            </span>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <KenteDivider />
      <section className="px-[var(--space-page-x)] py-[var(--space-section)]">
        <h2 className="text-center text-[var(--text-heading)] font-semibold">
          Comment ca marche
        </h2>
        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-start gap-8 md:flex-row md:items-start md:gap-8">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div key={step.number} className="flex flex-1 flex-col items-center text-center">
              <span className="step-circle flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-warm)] text-lg font-bold text-white shadow-lg shadow-[var(--color-accent-warm)]/20">
                {step.number}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      <KenteDivider />

      {/* TRAJETS POPULAIRES */}
      <section className="mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)] py-[var(--space-section)]">
        <h2 className="text-center text-[var(--text-heading)] font-semibold">
          Trajets populaires
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
          Decouvrez les itineraires les plus demandes
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {POPULAR_ROUTES.map((route) => (
            <Link
              key={`${route.origin}-${route.destination}`}
              href={`/${locale}/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}&date=${today}`}
              className="card-hover group flex items-center justify-between rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-surface-elevated)] p-4"
            >
              <div>
                <span className="font-semibold">
                  {route.origin} &rarr; {route.destination}
                </span>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  A partir de {route.price} XOF &middot; {route.departures} departs/jour
                </p>
              </div>
              <span className="ml-2 text-[var(--color-accent-warm)] opacity-0 transition group-hover:opacity-100" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* OPERATEURS */}
      <section className="px-[var(--space-page-x)] py-[var(--space-section)]">
        <h2 className="text-center text-[var(--text-heading)] font-semibold">
          Nos operateurs partenaires
        </h2>
        <div className="mt-8 flex items-center justify-center gap-8">
          {OPERATORS.map((name) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <Avatar name={name} size="lg" />
              <span className="text-sm font-medium">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-[var(--color-accent-warm)] py-8 text-center">
        <h2 className="text-xl font-bold text-white">
          Telechargez l&apos;application BusExpress
        </h2>
        <p className="mt-2 text-white/80">
          Accedez a vos billets hors-ligne et recevez des alertes prix
        </p>
        <div className="mt-4">
          <Button variant="secondary" disabled className="border-white text-white">
            Bientot disponible
          </Button>
        </div>
      </section>
    </>
  );
}
