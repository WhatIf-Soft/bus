'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/cn';
import { UserRole } from '@/types/shared';

interface NavLink {
  readonly label: string;
  readonly href: string;
}

function getNavLinks(locale: string): readonly NavLink[] {
  return [
    { label: 'Accueil', href: `/${locale}` },
    { label: 'Rechercher', href: `/${locale}/search` },
    { label: 'Suivi', href: `/${locale}/tracking` },
    { label: 'Mes Voyages', href: `/${locale}/account/bookings` },
    { label: 'Aide', href: `/${locale}/help` },
  ];
}

function isActiveLink(pathname: string, href: string, locale: string): boolean {
  if (href === `/${locale}`) {
    return pathname === `/${locale}` || pathname === `/${locale}/`;
  }
  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] ?? 'fr';
  const { user, isAuthenticated, logout } = useAuth();
  const navLinks = getNavLinks(locale);

  const showOperatorPortal =
    user?.role === UserRole.OPERATEUR || user?.role === UserRole.ADMIN;

  return (
    <header className="animate-slide-down sticky top-0 z-40 hidden h-[var(--header-height)] border-b border-black/5 bg-[var(--color-surface-elevated)]/95 backdrop-blur-lg md:block">
      <div className="relative mx-auto flex h-full max-w-[var(--max-content)] items-center justify-between px-[var(--space-page-x)]">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="group inline-flex items-center outline-none transition-opacity hover:opacity-90 focus-visible:opacity-90"
          aria-label="BusExpress — Accueil"
        >
          <Logo />
        </Link>

        {/* Center nav */}
        <nav className="flex items-center gap-6" aria-label="Navigation principale">
          {navLinks.map((link) => {
            const active = isActiveLink(pathname, link.href, locale);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-[length:var(--text-small)] transition-colors duration-[var(--duration-fast)]',
                  active
                    ? 'font-medium text-[var(--color-accent-warm-ink)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: command shortcut + auth area */}
        <div className="flex items-center gap-3">
          <kbd
            className="hidden items-center gap-1 rounded-[var(--radius-md)] border border-black/10 bg-black/[0.03] px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] shadow-sm lg:inline-flex"
            aria-hidden="true"
            title="Ouvrir la palette de commandes"
          >
            <span>⌘</span>
            <span>K</span>
          </kbd>
        {isAuthenticated && user ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1 transition-colors duration-[var(--duration-fast)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <Avatar name={user.email} size="sm" />
                <span className="max-w-[140px] truncate text-[length:var(--text-small)] text-[var(--color-text-muted)]">
                  {user.email}
                </span>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={8}
                align="end"
                className={cn(
                  'z-50 min-w-[180px] rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-surface-elevated)] p-1 shadow-lg',
                  'animate-in fade-in-0 zoom-in-95',
                )}
              >
                <DropdownMenu.Item asChild>
                  <Link
                    href={`/${locale}/account`}
                    className="flex w-full cursor-pointer items-center rounded-[var(--radius-md)] px-3 py-2 text-[length:var(--text-small)] text-[var(--color-text)] outline-none transition-colors hover:bg-black/5 focus:bg-black/5"
                  >
                    Mon Compte
                  </Link>
                </DropdownMenu.Item>

                {showOperatorPortal ? (
                  <DropdownMenu.Item asChild>
                    <Link
                      href={`/${locale}/operator`}
                      className="flex w-full cursor-pointer items-center rounded-[var(--radius-md)] px-3 py-2 text-[length:var(--text-small)] text-[var(--color-text)] outline-none transition-colors hover:bg-black/5 focus:bg-black/5"
                    >
                      Portail Opérateur
                    </Link>
                  </DropdownMenu.Item>
                ) : null}

                <DropdownMenu.Separator className="my-1 h-px bg-black/5" />

                <DropdownMenu.Item
                  onSelect={logout}
                  className="flex w-full cursor-pointer items-center rounded-[var(--radius-md)] px-3 py-2 text-[length:var(--text-small)] text-[var(--color-error)] outline-none transition-colors hover:bg-black/5 focus:bg-black/5"
                >
                  Déconnexion
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          <Button variant="primary" size="sm" asChild>
            <Link href={`/${locale}/login`}>Connexion</Link>
          </Button>
        )}
        </div>
      </div>

      {/* Golden Route horizon — fading gold thread that meets the dark hero */}
      <span
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--color-accent-warm) 18%, var(--color-accent-gold) 50%, var(--color-accent-warm) 82%, transparent 100%)',
          opacity: 0.6,
        }}
      />
    </header>
  );
}
