'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/cn';

const variantStyles = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] focus-visible:ring-[var(--color-primary)]',
  secondary:
    'border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white focus-visible:ring-[var(--color-primary)]',
  ghost:
    'text-[var(--color-text)] hover:bg-black/5 focus-visible:ring-[var(--color-text-muted)]',
  destructive:
    'bg-[var(--color-error)] text-white hover:opacity-90 focus-visible:ring-[var(--color-error)]',
} as const;

const sizeStyles = {
  sm: 'h-8 px-3 text-[var(--text-small)] rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-[var(--text-base)] rounded-[var(--radius-md)]',
  lg: 'h-12 px-6 text-[var(--text-base)] rounded-[var(--radius-lg)]',
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: keyof typeof variantStyles;
  readonly size?: keyof typeof sizeStyles;
  readonly asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'btn-glow inline-flex items-center justify-center gap-2 font-medium',
          'transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
