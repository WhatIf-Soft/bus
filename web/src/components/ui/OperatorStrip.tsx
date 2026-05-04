import { Marquee } from './Marquee';

const OPERATORS = [
  'STC Ghana',
  'Africa Trans Express',
  'Sahel Express',
  'Sonef Transport',
  'UTB Benin',
  'Trans Africa',
  'VVT Burkina',
  'Royal Voyages',
  'Baobab Lines',
] as const;

export function OperatorStrip() {
  return (
    <section className="py-[var(--space-section)]">
      <div className="mx-auto mb-8 max-w-[var(--max-content)] px-[var(--space-page-x)]">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
            Partenaires opérateurs
          </span>
          <h2 className="display text-[length:var(--text-heading)] font-medium tracking-tight">
            Des compagnies <em className="text-[var(--color-accent-gold-ink)]">dignes de confiance</em>
          </h2>
          <p className="mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
            Notés, vérifiés, suivis. Chaque opérateur sur BusExpress respecte nos standards de qualité.
          </p>
        </div>
      </div>
      <Marquee speed={55} className="py-6">
        {OPERATORS.map((name) => (
          <span
            key={name}
            className="display shrink-0 text-3xl font-medium tracking-tight text-[var(--color-text)]/70 transition-colors duration-300 hover:text-[var(--color-accent-warm-ink)] sm:text-4xl"
          >
            {name}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
