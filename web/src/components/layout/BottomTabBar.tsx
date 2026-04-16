'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

interface Tab {
  readonly label: string;
  readonly path: string;
  readonly icon: (active: boolean) => React.ReactNode;
}

function HomeIcon({ active }: { readonly active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={active ? 'text-[var(--color-accent-warm)]' : 'text-[var(--color-text-muted)]'}
    >
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z" />
    </svg>
  );
}

function SearchIcon({ active }: { readonly active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={active ? 'text-[var(--color-accent-warm)]' : 'text-[var(--color-text-muted)]'}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function TicketIcon({ active }: { readonly active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={active ? 'text-[var(--color-accent-warm)]' : 'text-[var(--color-text-muted)]'}
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 10h20" />
      <circle cx="8" cy="15" r="1" />
    </svg>
  );
}

function PersonIcon({ active }: { readonly active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={active ? 'text-[var(--color-accent-warm)]' : 'text-[var(--color-text-muted)]'}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.418 3.582-7 8-7s8 2.582 8 7" />
    </svg>
  );
}

function getTabs(locale: string): readonly Tab[] {
  return [
    {
      label: 'Accueil',
      path: `/${locale}`,
      icon: (active: boolean) => <HomeIcon active={active} />,
    },
    {
      label: 'Rechercher',
      path: `/${locale}/search`,
      icon: (active: boolean) => <SearchIcon active={active} />,
    },
    {
      label: 'Mes Voyages',
      path: `/${locale}/account/bookings`,
      icon: (active: boolean) => <TicketIcon active={active} />,
    },
    {
      label: 'Compte',
      path: `/${locale}/account`,
      icon: (active: boolean) => <PersonIcon active={active} />,
    },
  ];
}

function isTabActive(pathname: string, tabPath: string, locale: string): boolean {
  if (tabPath === `/${locale}`) {
    return pathname === `/${locale}` || pathname === `/${locale}/`;
  }
  return pathname.startsWith(tabPath);
}

export function BottomTabBar() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] ?? 'fr';
  const tabs = getTabs(locale);

  return (
    <nav
      className="fixed bottom-0 left-0 z-40 flex h-[var(--tabbar-height)] w-full items-center justify-around border-t border-black/5 bg-[var(--color-surface-elevated)] pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navigation mobile"
    >
      {tabs.map((tab) => {
        const active = isTabActive(pathname, tab.path, locale);
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-0.5 pt-1',
              active
                ? 'text-[var(--color-accent-warm)]'
                : 'text-[var(--color-text-muted)]',
            )}
          >
            {active ? (
              <span
                className="absolute top-0 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-[var(--color-accent-warm)]"
                aria-hidden="true"
              />
            ) : null}
            {tab.icon(active)}
            <span className="text-[var(--text-xs)]">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
