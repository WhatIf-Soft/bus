import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 py-[var(--space-section)]">
      <h1 className="text-center text-[var(--text-hero)] font-bold leading-tight tracking-tight">
        {t('title')}
      </h1>
      <p className="max-w-xl text-center text-[var(--text-base)] text-[var(--color-text-muted)]">
        {t('subtitle')}
      </p>
    </section>
  );
}
