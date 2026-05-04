'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import * as Tabs from '@radix-ui/react-tabs';
import { useAuth } from '@/hooks/useAuth';

interface AdminLayoutProps {
  readonly children: ReactNode;
}

const tabs = [
  { href: '', label: 'Tableau de bord' },
  { href: '/operators', label: 'Opérateurs' },
  { href: '/users', label: 'Utilisateurs' },
  { href: '/payments', label: 'Paiements' },
  { href: '/reviews', label: 'Avis' },
  { href: '/fraud', label: 'Fraude' },
  { href: '/analytics', label: 'Analytics' },
] as const;

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated } = useAuth();
  const locale = pathname?.split('/')[1] ?? 'fr';
  const basePath = `/${locale}/admin`;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login?next=${basePath}`);
      return;
    }
    if (user && user.role.toString().toLowerCase() !== 'admin') {
      router.replace(`/${locale}`);
    }
  }, [isAuthenticated, user, router, locale, basePath, hasHydrated]);

  if (!hasHydrated) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <p className="text-sm text-[var(--color-text-muted)]">Chargement…</p>
      </main>
    );
  }

  if (!isAuthenticated || (user && user.role.toString().toLowerCase() !== 'admin')) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <p>Acces reserve aux administrateurs.</p>
      </main>
    );
  }

  const activeTab = tabs.find((t) => pathname === `${basePath}${t.href}`)?.href ?? '';

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2 border-b border-black/10 pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="display text-3xl font-medium tracking-tight">Back-office</h1>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)]">
            Admin · La Route Dorée
          </span>
        </div>
        <Tabs.Root value={activeTab}>
          <Tabs.List aria-label="Sections admin" className="flex flex-wrap gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <Tabs.Trigger key={t.href} value={t.href} asChild>
                <Link
                  href={`${basePath}${t.href}`}
                  className={`whitespace-nowrap px-4 py-2 text-[length:var(--text-small)] transition-colors ${
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
