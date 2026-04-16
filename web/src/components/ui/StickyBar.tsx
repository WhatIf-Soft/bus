import type { ReactNode } from 'react';

interface StickyBarProps {
  readonly children: ReactNode;
}

export function StickyBar({ children }: StickyBarProps) {
  return (
    <div
      className="fixed bottom-[var(--tabbar-height)] left-0 right-0 z-30 border-t border-black/5 bg-[var(--color-surface-elevated)] px-4 py-3 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {children}
    </div>
  );
}
