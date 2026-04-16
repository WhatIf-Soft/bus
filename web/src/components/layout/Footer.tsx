import Link from 'next/link';
import { KenteDivider } from '@/components/ui/KenteDivider';

interface FooterColumn {
  readonly title: string;
  readonly links: readonly { readonly label: string; readonly href: string }[];
}

const columns: readonly FooterColumn[] = [
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/about' },
      { label: 'Carrières', href: '/careers' },
    ],
  },
  {
    title: 'Voyageurs',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Support', href: '/account/support' },
      { label: 'Fidélité', href: '/loyalty' },
    ],
  },
  {
    title: 'Opérateurs',
    links: [
      { label: 'Portail opérateur', href: '/operator' },
      { label: "S'inscrire", href: '/operator/register' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'CGU', href: '/legal/terms' },
      { label: 'Confidentialité', href: '/legal/privacy' },
      { label: 'Cookies', href: '/legal/cookies' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[var(--color-surface)] px-[var(--space-page-x)] py-12">
      <div className="mx-auto max-w-[var(--max-content)]">
        <KenteDivider className="mb-10" />

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-accent-warm)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-lg font-bold text-[var(--color-primary)]">
            BusExpress
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Made in West Africa 🌍
          </p>
        </div>
      </div>
    </footer>
  );
}
