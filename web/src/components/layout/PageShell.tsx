import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomTabBar } from '@/components/layout/BottomTabBar';

interface PageShellProps {
  readonly children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-[var(--tabbar-height)] md:pb-0">
        {children}
      </main>
      <Footer />
      <BottomTabBar />
    </>
  );
}
