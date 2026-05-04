'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Bus } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { TwoFactorForm } from '@/components/auth/TwoFactorForm';
import { DemoHintBanner } from '@/components/auth/DemoHintBanner';

export default function LoginPage() {
  const t = useTranslations('auth');
  const [twoFactor, setTwoFactor] = useState<{ email: string; password: string } | null>(null);

  return (
    <section className="relative flex min-h-[75vh] w-full items-center justify-center overflow-hidden py-[var(--space-section)]">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 30% 30%, oklch(72% 0.17 70 / 0.08), transparent 60%), radial-gradient(ellipse 60% 50% at 70% 70%, oklch(35% 0.15 260 / 0.08), transparent 60%)',
        }}
      />

      <div className="mx-auto w-full max-w-md px-4">
        <div className="animate-scale-in rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-8 shadow-xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/20">
              <Bus className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="display text-3xl font-medium tracking-tight">
                {twoFactor ? t('twoFactor') : t('login')}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {twoFactor ? t('twoFactorHelp') : t('loginSubtitle')}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {twoFactor ? (
              <TwoFactorForm email={twoFactor.email} password={twoFactor.password} />
            ) : (
              <LoginForm
                onRequires2FA={(email, password) => setTwoFactor({ email, password })}
              />
            )}
          </div>

          {!twoFactor && (
            <>
              <div className="mt-6">
                <DemoHintBanner />
              </div>
              <footer className="mt-6 flex flex-col items-center gap-3 border-t border-black/5 pt-6 text-center text-sm text-[var(--color-text-muted)]">
                <Link
                  href="/forgot-password"
                  className="hover:text-[var(--color-accent-warm)] hover:underline"
                >
                  {t('forgotPassword')}
                </Link>
                <p>
                  {t('noAccount')}{' '}
                  <Link
                    href="/register"
                    className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent-warm)] hover:underline"
                  >
                    {t('register')}
                  </Link>
                </p>
              </footer>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
