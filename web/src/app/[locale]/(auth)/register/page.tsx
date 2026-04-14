import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const t = useTranslations('auth');

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-6 py-[var(--space-section)]">
      <header className="flex flex-col gap-2">
        <h1 className="text-[var(--text-heading)] font-bold tracking-tight">
          {t('register')}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('registerSubtitle')}
        </p>
      </header>

      <RegisterForm />

      <footer className="text-center text-sm text-[var(--color-text-muted)]">
        {t('haveAccount')}{' '}
        <Link href="/login" className="font-medium text-[var(--color-primary)] hover:underline">
          {t('login')}
        </Link>
      </footer>
    </section>
  );
}
