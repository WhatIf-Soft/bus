'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import * as Tabs from '@radix-ui/react-tabs';
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
  { href: '/routes', label: 'Lignes' },
  { href: '/schedules', label: 'Horaires' },
  { href: '/fleet', label: 'Flotte' },
  { href: '/drivers', label: 'Conducteurs' },
  { href: '/manifests', label: 'Manifestes' },
  { href: '/scan', label: 'Embarquement' },
  { href: '/policies', label: 'Politiques' },
  { href: '/reviews', label: 'Avis' },
  { href: '/finance', label: 'Finances' },
] as const;

// Public operator pages that don't require an operator role to view.
const PUBLIC_OPERATOR_PATHS = ['/register', '/pricing', '/docs'] as const;

export default function OperatorLayout({ children }: OperatorLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated } = useAuth();

  // Locale is the first path segment (e.g., /fr/operator/...).
  const locale = pathname?.split('/')[1] ?? 'fr';
  const basePath = `/${locale}/operator`;

  const isPublicPath = PUBLIC_OPERATOR_PATHS.some((p) =>
    pathname?.startsWith(`${basePath}${p}`),
  );

  useEffect(() => {
    if (isPublicPath) return; // skip auth checks on register/pricing/docs
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login?next=${basePath}`);
      return;
    }
    if (user && !isOperatorRole(user.role as unknown as string)) {
      router.replace(`/${locale}`);
    }
  }, [isAuthenticated, user, router, locale, basePath, hasHydrated, isPublicPath]);

  // Public pages render directly without the operator-portal chrome
  if (isPublicPath) {
    return <>{children}</>;
  }

  if (!hasHydrated) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <p className="text-sm text-[var(--color-text-muted)]">Chargement…</p>
      </main>
    );
  }

  if (!isAuthenticated || (user && !isOperatorRole(user.role as unknown as string))) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <p>Acces reserve aux operateurs.</p>
      </main>
    );
  }

  // Determine active tab value from pathname
  const activeTab = tabs.find((t) => {
    const fullHref = `${basePath}${t.href}`;
    return pathname === fullHref;
  })?.href ?? '';

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4">
      <header className="flex flex-col gap-2 border-b border-black/10 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight">Portail operateur</h1>
        <Tabs.Root value={activeTab}>
          <Tabs.List aria-label="Sections" className="flex flex-wrap gap-1">
            {tabs.map((t) => (
              <Tabs.Trigger
                key={t.href}
                value={t.href}
                asChild
              >
                <Link
                  href={`${basePath}${t.href}`}
                  className={`px-4 py-2 text-[length:var(--text-small)] transition-colors ${
                    activeTab === t.href
                      ? 'border-b-2 border-[var(--color-accent-warm-ink)] text-[var(--color-accent-warm-ink)] font-medium'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {t.label}
                </Link>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>
      </header>
      {children}
    </main>
  );
}
