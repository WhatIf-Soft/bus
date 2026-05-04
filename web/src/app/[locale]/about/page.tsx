import Link from 'next/link';
import { MapPin, Users, Bus, Shield, Award, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const VALUES = [
  {
    icon: Shield,
    title: 'Sécurité avant tout',
    body:
      'Paiements tokenisés PCI-DSS, chauffeurs vérifiés, véhicules inspectés. Votre tranquillité est non-négociable.',
  },
  {
    icon: Heart,
    title: 'Construit localement',
    body:
      "Notre équipe est à Abidjan, Accra, Ouagadougou et Dakar. Nous connaissons chaque gare routière de l'intérieur.",
  },
  {
    icon: Award,
    title: 'Ponctualité mesurée',
    body:
      'Nos opérateurs signent un SLA de 85% de ponctualité. Chaque retard est mesuré et publié mensuellement.',
  },
];

const MILESTONES = [
  { year: '2024', event: 'Fondation de BusExpress à Abidjan' },
  { year: '2024', event: 'Premier trajet : Abidjan → Yamoussoukro' },
  { year: '2025', event: '10 opérateurs partenaires · 50 000 billets vendus' },
  { year: '2026', event: '12 pays desservis · intégration Mobile Money' },
];

const TEAM_STATS = [
  { label: 'Collaborateurs', value: '47' },
  { label: 'Pays desservis', value: '12' },
  { label: 'Opérateurs partenaires', value: '10' },
  { label: 'Voyageurs 2025', value: '50K+' },
];

export default function AboutPage() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-light)] to-[oklch(22%_0.14_280)] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 15% 20%, oklch(82% 0.14 85 / 0.5), transparent 55%), radial-gradient(ellipse 50% 50% at 80% 90%, oklch(72% 0.17 70 / 0.3), transparent 55%)',
          }}
        />
        <div className="relative mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)] py-[var(--space-section)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-accent-gold)]/90">
            À propos
          </p>
          <h1 className="display mt-4 max-w-3xl text-[clamp(2.5rem,1rem+5vw,4.5rem)] font-medium leading-[1.05] tracking-tight">
            La Route Dorée n&apos;est pas un slogan.{' '}
            <span className="italic text-[var(--color-accent-gold)]">
              C&apos;est un engagement.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">
            Nous construisons la plateforme de réservation de bus la plus fiable d&apos;Afrique
            de l&apos;Ouest, en partenariat avec les opérateurs qui font rouler la région depuis
            des décennies.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)] py-[var(--space-section)]">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
              Notre mission
            </p>
            <h2 className="display mt-3 text-[clamp(1.75rem,1rem+2.5vw,3rem)] font-medium leading-[1.05] tracking-tight">
              Rendre chaque trajet en bus <em className="text-[var(--color-accent-gold-ink)]">aussi simple qu&apos;un clic.</em>
            </h2>
          </div>
          <div className="prose max-w-none text-[var(--color-text)]">
            <p className="text-lg leading-relaxed">
              En 2024, quand vous vouliez voyager d&apos;Abidjan à Ouagadougou, vous deviez
              téléphoner cinq compagnies, vous déplacer en gare, ou croiser les doigts sur la
              disponibilité au comptoir. Nous avons décidé que ça devait changer.
            </p>
            <p className="mt-4 leading-relaxed">
              Aujourd&apos;hui, BusExpress réunit les plus grands opérateurs de l&apos;espace
              CEDEAO sur une seule plateforme. Vous cherchez un trajet en 200ms, vous payez en
              Mobile Money ou par carte en 3 clics, et vous suivez votre bus en temps réel. Plus
              de file d&apos;attente. Plus d&apos;incertitude.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[var(--color-surface-elevated)] border-y border-black/5">
        <div className="mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)] py-[var(--space-section)]">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
            Ce qui nous anime
          </p>
          <h2 className="display mt-3 text-[clamp(1.75rem,1rem+2.5vw,3rem)] font-medium leading-[1.05] tracking-tight">
            Trois valeurs <em className="text-[var(--color-accent-gold-ink)]">non-négociables</em>
          </h2>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="animate-entrance rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-bg)] p-6"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="display mt-4 text-xl font-medium">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {v.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)] py-[var(--space-section)]">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {TEAM_STATS.map((s) => (
            <div key={s.label}>
              <p className="display text-4xl font-medium tabular-nums tracking-tight text-[var(--color-primary)] sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-[var(--color-surface-elevated)] border-y border-black/5">
        <div className="mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)] py-[var(--space-section)]">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
            Notre histoire
          </p>
          <h2 className="display mt-3 text-[clamp(1.75rem,1rem+2.5vw,3rem)] font-medium leading-[1.05] tracking-tight">
            De zéro à 12 pays en <em className="italic text-[var(--color-accent-gold-ink)]">18 mois</em>.
          </h2>

          <ol className="mt-10 flex flex-col divide-y divide-black/5 border-y border-black/5">
            {MILESTONES.map((m, i) => (
              <li
                key={i}
                className="animate-entrance flex items-start gap-6 py-6"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="display shrink-0 text-3xl font-medium tabular-nums text-[var(--color-accent-warm-ink)]/40">
                  {m.year}
                </span>
                <p className="text-lg text-[var(--color-text)]">{m.event}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)] py-[var(--space-section)]">
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-accent-warm)]/20 bg-gradient-to-br from-[var(--color-accent-warm)]/[0.06] to-[var(--color-accent-gold)]/[0.06] p-10 text-center">
          <h2 className="display text-[clamp(1.75rem,1rem+2.5vw,2.75rem)] font-medium leading-[1.05] tracking-tight">
            Rejoignez le voyage
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[var(--color-text-muted)]">
            Voyageur, opérateur, investisseur, développeur — il y a une place pour vous dans la
            Route Dorée.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/fr/search">Réserver un trajet</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/fr/operator/register">Devenir opérateur</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/fr/careers">Nous rejoindre</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
