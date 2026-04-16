import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { QueryProvider } from '@/lib/query-provider';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { ToastProvider } from '@/components/ui/Toast';
import { PageShell } from '@/components/layout/PageShell';
import '@/styles/globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'BusExpress — Reservation de bus en ligne',
  description:
    "Plateforme de reservation de bus pour l'Afrique de l'Ouest",
  manifest: '/manifest.json',
};

type Props = {
  readonly children: React.ReactNode;
  readonly params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={jakarta.variable}>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <TooltipProvider>
              <ToastProvider>
                <PageShell>{children}</PageShell>
              </ToastProvider>
            </TooltipProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
