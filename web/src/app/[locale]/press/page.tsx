import Link from 'next/link';
import { Download, ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PressItem {
  readonly date: string;
  readonly outlet: string;
  readonly title: string;
  readonly url: string;
  readonly language: 'fr' | 'en';
}

const COVERAGE: ReadonlyArray<PressItem> = [
  {
    date: '2026-03-28',
    outlet: 'Jeune Afrique',
    title: 'BusExpress : la plateforme ivoirienne qui simplifie le voyage en autocar en Afrique de l\'Ouest',
    url: '#',
    language: 'fr',
  },
  {
    date: '2026-02-14',
    outlet: 'TechCabal',
    title: 'How BusExpress is digitizing West Africa\'s biggest transport sector',
    url: '#',
    language: 'en',
  },
  {
    date: '2026-01-09',
    outlet: 'Fraternité Matin',
    title: '50 000 voyageurs en 2025 : BusExpress enchaîne les records',
    url: '#',
    language: 'fr',
  },
  {
    date: '2025-11-22',
    outlet: 'Rest of World',
    title: 'In West Africa, Mobile Money powers a new generation of travel startups',
    url: '#',
    language: 'en',
  },
  {
    date: '2025-09-03',
    outlet: 'Le Monde Afrique',
    title: 'La Côte d\'Ivoire mise sur la tech pour moderniser ses routes',
    url: '#',
    language: 'fr',
  },
];

const AWARDS = [
  { year: '2026', name: 'Best Fintech Integration — AfricaArena Awards' },
  { year: '2025', name: 'Top 10 Startups to Watch — Jeune Afrique' },
  { year: '2025', name: 'Accessibilité Numérique — Label RGAA CI' },
];

export default function PressPage() {
  return (
    <main className="mx-auto flex max-w-[var(--max-content)] flex-col gap-[var(--space-section)] px-[var(--space-page-x)] py-[var(--space-section)]">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
          Espace presse
        </p>
        <h1 className="display mt-3 max-w-3xl text-[clamp(2.5rem,1rem+4vw,4rem)] font-medium leading-[1.05] tracking-tight">
          Parlons de <em className="italic text-[var(--color-accent-gold-ink)]">BusExpress</em>.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-text-muted)]">
          Ressources, kit média et contacts pour les journalistes, analystes et partenaires.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-6 shadow-sm">
          <h2 className="display text-xl font-medium">Kit média</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Logo, captures d&apos;écran haute résolution, fiche d&apos;identité, biographies de la
            direction.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            <DownloadRow label="Logo BusExpress (SVG + PNG)" size="2,4 Mo" />
            <DownloadRow label="Captures d'écran — 8 visuels" size="14 Mo" />
            <DownloadRow label="Photos équipe dirigeante" size="8 Mo" />
            <DownloadRow label="Fiche d'identité (PDF)" size="320 Ko" />
            <DownloadRow label="Guide de marque" size="4,1 Mo" />
          </ul>
          <Button className="mt-5 w-full gap-2">
            <Download className="h-4 w-4" />
            Télécharger le kit complet (28 Mo)
          </Button>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-6 shadow-sm">
          <h2 className="display text-xl font-medium">Contact presse</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Pour toute demande d&apos;interview, commentaire ou annonce.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Relations presse France & international
              </p>
              <p className="mt-1 font-medium">Aïssata Cissé</p>
              <a
                href="mailto:press@busexpress.africa"
                className="flex items-center gap-1.5 text-sm text-[var(--color-accent-warm-ink)] hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                press@busexpress.africa
              </a>
            </div>
            <div className="border-t border-black/5 pt-3">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Relations presse Afrique de l&apos;Ouest
              </p>
              <p className="mt-1 font-medium">Koffi Adjoua</p>
              <a
                href="mailto:presse.ci@busexpress.africa"
                className="flex items-center gap-1.5 text-sm text-[var(--color-accent-warm-ink)] hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                presse.ci@busexpress.africa
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="display text-2xl font-medium">Nous avons fait la une</h2>
        <ul className="mt-6 flex flex-col divide-y divide-black/5 border-y border-black/5">
          {COVERAGE.map((c, i) => (
            <li
              key={i}
              className="animate-entrance flex items-start gap-4 py-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="min-w-[80px] shrink-0">
                <p className="font-mono text-xs tabular-nums text-[var(--color-text-muted)]">
                  {new Date(c.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-warm-ink)]">
                  {c.outlet} <span className="ml-1 font-normal opacity-60">[{c.language.toUpperCase()}]</span>
                </p>
                <h3 className="mt-1 text-base font-medium leading-tight">{c.title}</h3>
              </div>
              <a
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--color-accent-warm-ink)] hover:underline"
              >
                Lire
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="display text-2xl font-medium">Distinctions</h2>
        <ul className="mt-6 flex flex-col divide-y divide-black/5 border-y border-black/5">
          {AWARDS.map((a) => (
            <li key={a.name} className="flex items-center gap-6 py-4">
              <span className="display text-3xl font-medium tabular-nums text-[var(--color-accent-warm-ink)]/40">
                {a.year}
              </span>
              <p className="text-base">{a.name}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function DownloadRow({ label, size }: { readonly label: string; readonly size: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-black/5 px-3 py-2 text-sm transition-colors hover:border-[var(--color-accent-warm-ink)]/30">
      <span>{label}</span>
      <span className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        {size}
        <Download className="h-3.5 w-3.5" />
      </span>
    </li>
  );
}
