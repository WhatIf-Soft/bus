import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { QueryProvider } from '@/lib/query-provider';
import { TooltipProvider } from '@/components/shadcn/tooltip';
import { Toaster } from '@/components/shadcn/sonner';
import { CommandMenu } from '@/components/layout/CommandMenu';
import { PageShell } from '@/components/layout/PageShell';
import '@/styles/globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: 'variable',
  axes: ['opsz', 'SOFT'],
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
    <html lang={locale} dir={dir} className={`${jakarta.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <TooltipProvider delayDuration={200}>
              <PageShell>{children}</PageShell>
              <CommandMenu locale={locale} />
              <Toaster position="top-center" richColors closeButton />
            </TooltipProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
