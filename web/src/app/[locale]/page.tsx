import { useTranslations } from 'next-intl';
import { SearchForm } from '@/components/search/SearchForm';

interface HomePageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  return <HomeContent locale={locale} />;
}

function HomeContent({ locale }: { readonly locale: string }) {
  const t = useTranslations('home');

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-8 py-[var(--space-section)]">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-center text-[var(--text-hero)] font-bold leading-tight tracking-tight">
          {t('title')}
        </h1>
        <p className="max-w-xl text-center text-[var(--text-base)] text-[var(--color-text-muted)]">
          {t('subtitle')}
        </p>
      </div>
      <div className="w-full max-w-3xl px-4">
        <SearchForm locale={locale} />
      </div>
    </section>
  );
}
