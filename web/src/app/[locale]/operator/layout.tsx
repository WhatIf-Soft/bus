'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface OperatorLayoutProps {
  readonly children: ReactNode;
}

// Backend uses lowercase role strings (operateur/admin); shared-types enum uses
// uppercase. Compare via case-insensitive lowercased values.
function isOperatorRole(role: string): boolean {
  const r = role.toLowerCase();
  return r === 'operateur' || r === 'admin';
}

const tabs = [
  { href: '', label: 'Profil' },
  { href: '/fleet', label: 'Flotte' },
  { href: '/drivers', label: 'Conducteurs' },
  { href: '/policies', label: 'Politiques' },
  { href: '/reviews', label: 'Avis' },
  { href: '/finance', label: 'Finances' },
];

export default function OperatorLayout({ children }: OperatorLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  // Locale is the first path segment (e.g., /fr/operator/...).
  const locale = pathname?.split('/')[1] ?? 'fr';
  const basePath = `/${locale}/operator`;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/${locale}/login?next=${basePath}`);
      return;
    }
    if (user && !isOperatorRole(user.role as unknown as string)) {
      router.replace(`/${locale}`);
    }
  }, [isAuthenticated, user, router, locale, basePath]);

  if (!isAuthenticated || (user && !isOperatorRole(user.role as unknown as string))) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <p>Accès réservé aux opérateurs.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4">
      <header className="flex flex-col gap-2 border-b border-black/10 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight">Portail opérateur</h1>
        <nav aria-label="Sections" className="flex flex-wrap gap-2 text-sm">
          {tabs.map((t) => {
            const href = `${basePath}${t.href}`;
            const active = pathname === href;
            return (
              <Link
                key={t.href}
                href={href}
                className={`rounded border px-3 py-1.5 transition-colors ${
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                    : 'border-black/10 hover:border-[var(--color-primary)]'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </main>
  );
}
