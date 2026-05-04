import { SearchForm } from '@/components/search/SearchForm';
import { KenteDivider } from '@/components/ui/KenteDivider';
import { FeatureGrid } from '@/components/ui/FeatureGrid';
import { StatsStrip } from '@/components/ui/StatsStrip';
import { RouteBento } from '@/components/ui/RouteBento';
import { OperatorStrip } from '@/components/ui/OperatorStrip';
import { PaymentStrip } from '@/components/ui/PaymentStrip';

interface HomePageProps {
  readonly params: Promise<{ locale: string }>;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const POPULAR_ROUTES = [
  { origin: 'Abidjan', destination: 'Ouagadougou', price: '22 000', departures: 2, duration: '16h' },
  { origin: 'Abidjan', destination: 'Yamoussoukro', price: '6 200', departures: 5, duration: '3h30' },
  { origin: 'Accra', destination: 'Lomé', price: '8 000', departures: 6, duration: '4h' },
  { origin: 'Lomé', destination: 'Cotonou', price: '5 500', departures: 4, duration: '3h' },
  { origin: 'Abidjan', destination: 'Accra', price: '15 000', departures: 3, duration: '10h' },
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

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const today = todayIso();

  return (
    <>
      {/* HERO — animated gradient + grain + staggered entrance */}
      <section className="hero-gradient hero-particles grain grain-strong relative flex items-center justify-center overflow-hidden">
        <div className="relative z-10 mx-auto w-full max-w-6xl px-[var(--space-page-x)] py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="animate-entrance animate-entrance-1 text-xs uppercase tracking-[0.3em] text-[var(--color-accent-gold)]/90 sm:text-sm">
              La Route Dorée
            </p>
            <h1 className="display animate-entrance animate-entrance-2 mt-3 text-balance text-[clamp(2.25rem,1rem+4.5vw,4.5rem)] font-medium leading-[1] tracking-tight text-white">
              Réservez votre bus
              <span className="block italic text-[var(--color-accent-gold)]">en un clic.</span>
            </h1>
            <p className="animate-entrance animate-entrance-3 mx-auto mt-5 max-w-xl text-base text-white/70 sm:text-lg">
              Voyagez à travers l&apos;Afrique de l&apos;Ouest avec{' '}
              <em className="font-display not-italic text-[var(--color-accent-gold)]/90">
                500+ trajets
              </em>
              , Mobile Money et suivi GPS.
            </p>
          </div>

          <div
            className="animate-scale-in mt-8 p-0 sm:p-1"
            style={{ animationDelay: '300ms' }}
          >
            <SearchForm locale={locale} />
          </div>

          <div className="mt-6 sm:mt-8">
            <FeatureGrid />
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <StatsStrip />

      {/* COMMENT CA MARCHE — editorial numbered list */}
      <section className="mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)] py-[var(--space-section)]">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <span className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
              3 étapes
            </span>
            <h2 className="display mt-3 text-[clamp(1.75rem,1rem+2.5vw,3rem)] font-medium leading-[1.05] tracking-tight">
              Réservé,
              <span className="italic text-[var(--color-accent-gold-ink)]"> payé,</span>
              <br />
              en route.
            </h2>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              Trois étapes simples pour voyager en toute confiance à travers l&apos;Afrique de l&apos;Ouest.
            </p>
          </div>
          <ol className="flex flex-col divide-y divide-black/5 border-y border-black/5">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li
                key={step.number}
                className="animate-entrance flex items-start gap-6 py-8"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="display shrink-0 text-5xl font-medium tabular-nums text-[var(--color-accent-warm)]/20 sm:text-6xl">
                  0{step.number}
                </span>
                <div>
                  <h3 className="display text-2xl font-medium tracking-tight">{step.title}</h3>
                  <p className="mt-2 max-w-md text-[var(--color-text-muted)]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <KenteDivider />

      {/* POPULAR ROUTES — editorial bento */}
      <section className="mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)] py-[var(--space-section)]">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <span className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
            Trajets populaires
          </span>
          <h2 className="display text-[clamp(1.75rem,1rem+2.5vw,3rem)] font-medium leading-[1.05] tracking-tight">
            Les itinéraires les plus <em className="text-[var(--color-accent-gold-ink)]">empruntés</em>
          </h2>
        </div>
        <RouteBento routes={POPULAR_ROUTES} locale={locale} today={today} />
      </section>

      {/* OPERATORS MARQUEE */}
      <OperatorStrip />

      {/* PAYMENT METHODS */}
      <PaymentStrip />
    </>
  );
}
