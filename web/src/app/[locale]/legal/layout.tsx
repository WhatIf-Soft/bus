import Link from 'next/link';
import type { ReactNode } from 'react';

interface LegalLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

export default async function LegalLayout({ children, params }: LegalLayoutProps) {
  const { locale } = await params;
  const sections = [
    { href: `/${locale}/legal/cgu`, label: 'CGU' },
    { href: `/${locale}/legal/confidentialite`, label: 'Confidentialité' },
    { href: `/${locale}/legal/cookies`, label: 'Cookies' },
    { href: `/${locale}/legal/accessibilite`, label: 'Accessibilité' },
  ];
  return (
    <main className="mx-auto grid max-w-6xl gap-8 p-4 sm:p-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
          Mentions légales
        </p>
        <h2 className="display mt-2 text-2xl font-medium leading-tight tracking-tight">
          La Route Dorée
        </h2>
        <ul className="mt-5 flex flex-col gap-1 text-sm">
          {sections.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="block border-l-2 border-transparent py-1.5 pl-3 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent-warm-ink)] hover:text-[var(--color-text)] aria-[current=page]:border-[var(--color-accent-warm-ink)] aria-[current=page]:text-[var(--color-text)] aria-[current=page]:font-medium"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <article className="prose-legal flex flex-col gap-6">{children}</article>
    </main>
  );
}
