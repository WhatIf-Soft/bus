import Link from 'next/link';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Tier {
  readonly name: string;
  readonly tagline: string;
  readonly commission: string;
  readonly commissionNote: string;
  readonly features: ReadonlyArray<{ readonly label: string; readonly included: boolean }>;
  readonly featured?: boolean;
}

const TIERS: ReadonlyArray<Tier> = [
  {
    name: 'Démarrage',
    tagline: 'Pour les flottes qui veulent essayer',
    commission: '15%',
    commissionNote: 'Commission sur ventes uniquement',
    features: [
      { label: 'Jusqu\'à 5 véhicules', included: true },
      { label: 'Jusqu\'à 50 départs / mois', included: true },
      { label: 'Portail opérateur (lignes, horaires, manifestes, scan)', included: true },
      { label: 'Versements hebdomadaires', included: true },
      { label: 'Support email 48 h', included: true },
      { label: 'Tarification dynamique ML', included: false },
      { label: 'Compte agence multi-utilisateurs', included: false },
      { label: 'API publique', included: false },
    ],
  },
  {
    name: 'Croissance',
    tagline: 'Pour les opérateurs régionaux établis',
    commission: '12,5%',
    commissionNote: 'Commission réduite · SLA 99,5% garanti',
    featured: true,
    features: [
      { label: 'Véhicules illimités', included: true },
      { label: 'Départs illimités', included: true },
      { label: 'Portail opérateur complet', included: true },
      { label: 'Versements hebdomadaires ou à la demande', included: true },
      { label: 'Support téléphone 24/7 en français/anglais', included: true },
      { label: 'Tarification dynamique ML', included: true },
      { label: 'Compte agence multi-utilisateurs (illimités)', included: true },
      { label: 'API publique (certifié)', included: false },
    ],
  },
  {
    name: 'Entreprise',
    tagline: 'Pour les groupes multi-pays',
    commission: 'Sur devis',
    commissionNote: 'Tarif personnalisé selon le volume',
    features: [
      { label: 'Tout ce qui est inclus dans Croissance', included: true },
      { label: 'API publique dédiée + SLA', included: true },
      { label: 'Intégration ERP personnalisée', included: true },
      { label: 'Tarification dynamique ML personnalisée', included: true },
      { label: 'Account Manager dédié', included: true },
      { label: 'Formation sur site illimitée', included: true },
      { label: 'Marque blanche (widget de réservation)', included: true },
      { label: 'Reporting financier quotidien', included: true },
    ],
  },
];

const FAQ = [
  {
    q: 'Y a-t-il des frais d\'installation ?',
    a: 'Aucun. Les tarifs Démarrage et Croissance sont 100% au succès : pas de ventes = pas de frais. Le tarif Entreprise inclut un setup personnalisé dont le coût est convenu à la signature.',
  },
  {
    q: 'Quelles méthodes de paiement sont incluses ?',
    a: 'Toutes : Orange Money, MTN MoMo, Wave, Moov Money, Visa, Mastercard, et paiement en agence. Les frais de passerelle sont déjà absorbés dans la commission BusExpress.',
  },
  {
    q: 'Combien de temps dure l\'onboarding ?',
    a: 'Entre 5 et 10 jours ouvrés après réception des documents KYB (licence, assurance, RIB). Votre équipe est formée en 2 sessions (1 × 2h chacune).',
  },
  {
    q: 'Puis-je changer de tarif en cours de route ?',
    a: 'Oui, à tout moment et sans frais. Nous ajustons automatiquement votre taux pour le mois suivant.',
  },
];

export default function OperatorPricingPage() {
  return (
    <main className="mx-auto flex max-w-[var(--max-content)] flex-col gap-[var(--space-section)] px-[var(--space-page-x)] py-[var(--space-section)]">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
          Tarifs opérateur
        </p>
        <h1 className="display mt-3 text-[clamp(2.5rem,1rem+4vw,4rem)] font-medium leading-[1.05] tracking-tight">
          Payez <em className="italic text-[var(--color-accent-gold-ink)]">uniquement</em> quand vous vendez.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--color-text-muted)]">
          Pas d&apos;abonnement, pas d&apos;engagement. Nous prenons une commission sur les
          ventes que nous vous apportons — et rien d&apos;autre.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {TIERS.map((t, i) => (
          <article
            key={t.name}
            className={`relative flex flex-col gap-5 rounded-[var(--radius-xl)] border p-7 shadow-sm ${
              t.featured
                ? 'border-[var(--color-accent-warm-ink)]/40 bg-gradient-to-br from-[var(--color-accent-warm)]/[0.04] to-[var(--color-accent-gold)]/[0.04] lg:scale-[1.03]'
                : 'border-black/5 bg-[var(--color-surface-elevated)]'
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {t.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[var(--radius-full)] bg-[var(--color-accent-warm-ink)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                Recommandé
              </span>
            )}
            <div>
              <h2 className="display text-2xl font-medium">{t.name}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t.tagline}</p>
            </div>
            <div>
              <p className="display text-5xl font-medium tabular-nums tracking-tight text-[var(--color-primary)]">
                {t.commission}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t.commissionNote}</p>
            </div>
            <ul className="flex flex-col gap-2.5 text-sm">
              {t.features.map((f) => (
                <li key={f.label} className="flex items-start gap-2">
                  {f.included ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]/40" />
                  )}
                  <span className={f.included ? '' : 'text-[var(--color-text-muted)] line-through'}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant={t.featured ? 'primary' : 'secondary'} className="mt-auto w-full">
              <Link href="/fr/operator/register">
                {t.commission === 'Sur devis' ? 'Nous contacter' : 'Commencer'}
              </Link>
            </Button>
          </article>
        ))}
      </section>

      <section>
        <h2 className="display text-2xl font-medium">Questions fréquentes</h2>
        <ul className="mt-6 flex flex-col divide-y divide-black/5 border-y border-black/5">
          {FAQ.map((item) => (
            <li key={item.q} className="py-5">
              <p className="text-base font-semibold">{item.q}</p>
              <p className="mt-2 max-w-3xl text-sm text-[var(--color-text-muted)]">{item.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[var(--radius-xl)] border border-[var(--color-accent-warm)]/20 bg-gradient-to-br from-[var(--color-accent-warm)]/[0.04] to-[var(--color-accent-gold)]/[0.04] p-10 text-center">
        <h2 className="display text-[clamp(1.75rem,1rem+2.5vw,2.75rem)] font-medium leading-[1.05] tracking-tight">
          Commencez en 48 heures
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--color-text-muted)]">
          La plupart de nos partenaires sont en ligne moins d&apos;une semaine après leur
          candidature.
        </p>
        <Button asChild className="mt-6">
          <Link href="/fr/operator/register">Candidater maintenant</Link>
        </Button>
      </section>
    </main>
  );
}
