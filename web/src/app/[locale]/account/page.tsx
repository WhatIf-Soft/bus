'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';

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
  const { user, isAuthenticated, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const locale = pathname?.split('/')[1] ?? 'fr';

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

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
    router.replace('/login');
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
          <span className="text-[var(--text-xs)] text-[var(--color-text-muted)]">Code parrainage :</span>
          <code className="font-mono bg-black/5 rounded px-2 py-1 text-[var(--text-xs)]">
            {REFERRAL_CODE}
          </code>
          <button
            type="button"
            onClick={handleCopyReferral}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[var(--text-xs)] font-medium text-[var(--color-accent-warm)] hover:bg-[var(--color-accent-warm)]/10 transition-colors"
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
              <span className="text-[var(--color-accent-warm)]">{action.icon}</span>
              <span className="text-[var(--color-accent-warm)] opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                &rarr;
              </span>
            </div>
            <span className="font-semibold text-[var(--color-text)]">{action.title}</span>
            <span className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
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
