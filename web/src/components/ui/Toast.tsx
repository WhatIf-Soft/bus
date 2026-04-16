'use client';

import { type ReactNode } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/cn';
import { useToast } from '@/hooks/useToast';

const variantStyles = {
  success:
    'border-[var(--color-success)] bg-[oklch(96%_0.04_150)] text-[var(--color-text)]',
  error:
    'border-[var(--color-error)] bg-[oklch(96%_0.04_25)] text-[var(--color-text)]',
  info:
    'border-[var(--color-primary)] bg-[oklch(96%_0.04_250)] text-[var(--color-text)]',
} as const;

function Toast() {
  const { open, message, variant, hide } = useToast();

  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) hide();
      }}
      duration={4000}
      className={cn(
        'rounded-[var(--radius-lg)] border-l-4 px-4 py-3 shadow-lg',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full',
        'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
        'data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full',
        variantStyles[variant],
      )}
    >
      <ToastPrimitive.Description className="text-[var(--text-base)] leading-snug">
        {message}
      </ToastPrimitive.Description>
    </ToastPrimitive.Root>
  );
}

interface ToastProviderProps {
  readonly children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}
      <Toast />
      <ToastPrimitive.Viewport
        className={cn(
          'fixed right-4 z-50 flex flex-col gap-2',
          'bottom-20 md:bottom-6',
          'w-[min(calc(100vw-2rem),24rem)]',
        )}
      />
    </ToastPrimitive.Provider>
  );
}
