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
  { href: '/fleet', label: 'Flotte' },
  { href: '/drivers', label: 'Conducteurs' },
  { href: '/policies', label: 'Politiques' },
  { href: '/reviews', label: 'Avis' },
  { href: '/finance', label: 'Finances' },
] as const;

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
                  className={`px-4 py-2 text-[var(--text-small)] transition-colors ${
                    activeTab === t.href
                      ? 'border-b-2 border-[var(--color-accent-warm)] text-[var(--color-accent-warm)] font-medium'
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
