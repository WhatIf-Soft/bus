'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

const REFERRAL_CODE = 'BUS-7K2M9X';

interface QuickAction {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: React.ReactNode;
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export default function AccountPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const locale = pathname?.split('/')[1] ?? 'fr';

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
  }, [isAuthenticated, hasHydrated, router, locale]);

  if (!hasHydrated) return null;
  if (!isAuthenticated || !user) {
    return null;
  }

  function handleCopyReferral() {
    navigator.clipboard.writeText(REFERRAL_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleLogout() {
    logout();
    router.replace(`/${locale}/login`);
  }

  const quickActions: ReadonlyArray<QuickAction> = [
    {
      title: 'Mes Reservations',
      description: 'Voir et gerer vos voyages',
      href: `/${locale}/account/bookings`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      ),
    },
    {
      title: 'Mes Billets',
      description: 'Telecharger vos billets PDF',
      href: `/${locale}/account/bookings`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
        </svg>
      ),
    },
    {
      title: "Liste d'attente",
      description: 'Suivre vos demandes en attente',
      href: `/${locale}/account/waitlist`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      title: 'Support',
      description: 'Aide et assistance',
      href: `/${locale}/account/support`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      title: 'Passagers',
      description: 'Carnet des voyageurs',
      href: `/${locale}/account/passengers`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: 'Notifications',
      description: 'Email, SMS, WhatsApp',
      href: `/${locale}/account/notifications`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      ),
    },
    {
      title: 'Paiement',
      description: 'Moyens enregistrés',
      href: `/${locale}/account/payments`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="6" y1="15" x2="10" y2="15" />
        </svg>
      ),
    },
  ];

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-[var(--space-section)]">
      {/* Profile card */}
      <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-xl)] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar name={user.email} size="lg" />
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="text-lg font-semibold text-[var(--color-text)]">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{user.role}</Badge>
              <Badge variant="gold">0 pts</Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-[length:var(--text-xs)] text-[var(--color-text-muted)]">Code parrainage :</span>
          <code className="font-mono bg-black/5 rounded px-2 py-1 text-[length:var(--text-xs)]">
            {REFERRAL_CODE}
          </code>
          <button
            type="button"
            onClick={handleCopyReferral}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[length:var(--text-xs)] font-medium text-[var(--color-accent-warm-ink)] hover:bg-[var(--color-accent-warm)]/10 transition-colors"
          >
            <CopyIcon />
            {copied ? 'Copie !' : 'Copier'}
          </button>
        </div>
      </div>

      {/* Quick-action grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group flex flex-col gap-2 rounded-[var(--radius-lg)] border border-black/5 p-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <span className="text-[var(--color-accent-warm-ink)]">{action.icon}</span>
              <span className="text-[var(--color-accent-warm-ink)] opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                &rarr;
              </span>
            </div>
            <span className="font-semibold text-[var(--color-text)]">{action.title}</span>
            <span className="text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
              {action.description}
            </span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="flex justify-start">
        <Button variant="ghost" onClick={handleLogout}>
          {t('logout')}
        </Button>
      </div>
    </section>
  );
}
