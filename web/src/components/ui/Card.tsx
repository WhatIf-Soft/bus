import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: Readonly<CardProps>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-surface)] p-[var(--space-card)] shadow-sm',
        'transition-shadow duration-[var(--duration-normal)] ease-[var(--ease-out)]',
        'hover:shadow-md',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: Readonly<CardProps>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 pb-4', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: Readonly<CardProps>) {
  return <div className={cn('py-2', className)} {...props} />;
}

export function CardFooter({ className, ...props }: Readonly<CardProps>) {
  return (
    <div
      className={cn('flex items-center gap-2 pt-4', className)}
      {...props}
    />
  );
}
