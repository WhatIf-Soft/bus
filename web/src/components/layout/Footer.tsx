import Link from 'next/link';
import { KenteDivider } from '@/components/ui/KenteDivider';
import { Globe, Shield, Instagram, Twitter, Facebook } from 'lucide-react';

interface FooterColumn {
  readonly title: string;
  readonly links: readonly { readonly label: string; readonly href: string }[];
}

const columns: readonly FooterColumn[] = [
  {
    title: 'Voyageurs',
    links: [
      { label: 'Rechercher', href: '/fr/search' },
      { label: 'Suivi GPS', href: '/fr/tracking' },
      { label: 'Mes réservations', href: '/fr/account/bookings' },
      { label: 'Centre d’aide', href: '/fr/help' },
    ],
  },
  {
    title: 'Opérateurs',
    links: [
      { label: 'Portail opérateur', href: '/fr/operator' },
      { label: 'S’inscrire', href: '/fr/operator/register' },
      { label: 'Tarifs', href: '/fr/operator/pricing' },
      { label: 'Documentation', href: '/fr/operator/docs' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/fr/about' },
      { label: 'Carrières', href: '/fr/careers' },
      { label: 'Presse', href: '/fr/press' },
      { label: 'Blog', href: '/fr/blog' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'CGU', href: '/fr/legal/cgu' },
      { label: 'Confidentialité', href: '/fr/legal/confidentialite' },
      { label: 'Cookies', href: '/fr/legal/cookies' },
      { label: 'Accessibilité', href: '/fr/legal/accessibilite' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[oklch(12%_0.02_260)] text-white/80">
      {/* Top kente accent */}
      <div className="kente-divider h-0.5 w-full" />

      <div className="mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)] py-16">
        {/* Top: claim + socials */}
        <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-12 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-accent-gold)]/80">
              La Route Dorée
            </p>
            <h2 className="display mt-3 text-3xl font-medium leading-[1.1] tracking-tight sm:text-4xl">
              Voyagez à travers l&apos;Afrique
              <span className="block italic text-[var(--color-accent-gold)]">
                en toute confiance.
              </span>
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">
              Newsletter voyageurs
            </label>
            <form className="flex max-w-sm items-center gap-2">
              <input
                type="email"
                placeholder="votre@email.com"
                className="h-11 flex-1 rounded-[var(--radius-md)] border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-[var(--color-accent-gold)] focus:ring-2 focus:ring-[var(--color-accent-gold)]/30"
              />
              <button
                type="submit"
                className="h-11 rounded-[var(--radius-md)] bg-[var(--color-accent-gold)] px-5 text-sm font-medium text-[oklch(12%_0.02_260)] transition-colors hover:bg-[var(--color-accent-warm)]"
              >
                Abonner
              </button>
            </form>
            <p className="text-xs text-white/50">
              1 email/mois. Pas de spam. Désabonnement à tout moment.
            </p>
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 gap-8 pt-12 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-gold)]/80">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-accent-gold)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Huge wordmark — echoes the compact logo's "Bus" + italic "Express" split */}
        <div className="relative mt-16 overflow-hidden">
          <p
            className="pointer-events-none select-none text-[clamp(4rem,8rem,20vw)] font-medium leading-none tracking-[-0.04em] text-white/[0.07]"
            aria-hidden="true"
          >
            <span className="font-extrabold">Bus</span>
            <span className="display italic">Express</span>
          </p>
        </div>

        {/* Bottom: meta */}
        <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 text-white/50">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[var(--color-success)]" />
              PCI-DSS · RGPD
            </span>
            <span>·</span>
            <span>© 2026 BusExpress</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Made in West Africa</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Globe className="h-3.5 w-3.5" />
              <select
                className="cursor-pointer bg-transparent text-white/70 outline-none hover:text-[var(--color-accent-gold)]"
                defaultValue="fr"
                aria-label="Langue"
              >
                <option value="fr" className="bg-[oklch(12%_0.02_260)]">Français</option>
                <option value="en" className="bg-[oklch(12%_0.02_260)]">English</option>
                <option value="ar" className="bg-[oklch(12%_0.02_260)]">العربية</option>
              </select>
              <span>·</span>
              <select
                className="cursor-pointer bg-transparent text-white/70 outline-none hover:text-[var(--color-accent-gold)]"
                defaultValue="xof"
                aria-label="Devise"
              >
                <option value="xof" className="bg-[oklch(12%_0.02_260)]">XOF</option>
                <option value="ghs" className="bg-[oklch(12%_0.02_260)]">GHS</option>
                <option value="eur" className="bg-[oklch(12%_0.02_260)]">EUR</option>
                <option value="usd" className="bg-[oklch(12%_0.02_260)]">USD</option>
              </select>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <a href="https://instagram.com/busexpress" aria-label="Instagram" className="transition-colors hover:text-[var(--color-accent-gold)]">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://twitter.com/busexpress" aria-label="Twitter" className="transition-colors hover:text-[var(--color-accent-gold)]">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://facebook.com/busexpress" aria-label="Facebook" className="transition-colors hover:text-[var(--color-accent-gold)]">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
