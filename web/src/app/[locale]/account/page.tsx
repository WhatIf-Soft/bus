'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';

export default function AccountPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-[var(--space-section)]">
      <header className="flex flex-col gap-2">
        <h1 className="text-[var(--text-heading)] font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">{user.email}</p>
      </header>

      <Card>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-[var(--color-text-muted)]">{t('role')}</dt>
            <dd className="text-sm font-medium">{user.role}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-[var(--color-text-muted)]">{t('twoFactor')}</dt>
            <dd className="text-sm font-medium">
              {user.twoFactorEnabled ? t('enabled') : t('disabled')}
            </dd>
          </div>
          {user.phone && (
            <div>
              <dt className="text-xs uppercase text-[var(--color-text-muted)]">{t('phone')}</dt>
              <dd className="text-sm font-medium">{user.phone}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Button variant="secondary" onClick={logout}>
        {t('logout')}
      </Button>
    </section>
  );
}
