'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LoginForm } from '@/components/auth/LoginForm';
import { TwoFactorForm } from '@/components/auth/TwoFactorForm';

export default function LoginPage() {
  const t = useTranslations('auth');
  const [twoFactor, setTwoFactor] = useState<{ email: string; password: string } | null>(null);

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-6 py-[var(--space-section)]">
      <header className="flex flex-col gap-2">
        <h1 className="text-[var(--text-heading)] font-bold tracking-tight">
          {twoFactor ? t('twoFactor') : t('login')}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {twoFactor ? t('twoFactorHelp') : t('loginSubtitle')}
        </p>
      </header>

      {twoFactor ? (
        <TwoFactorForm email={twoFactor.email} password={twoFactor.password} />
      ) : (
        <LoginForm
          onRequires2FA={(email, password) => setTwoFactor({ email, password })}
        />
      )}

      {!twoFactor && (
        <footer className="flex flex-col gap-2 text-center text-sm text-[var(--color-text-muted)]">
          <Link href="/forgot-password" className="hover:underline">
            {t('forgotPassword')}
          </Link>
          <p>
            {t('noAccount')}{' '}
            <Link href="/register" className="font-medium text-[var(--color-primary)] hover:underline">
              {t('register')}
            </Link>
          </p>
        </footer>
      )}
    </section>
  );
}
