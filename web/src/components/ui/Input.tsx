'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  readonly label?: string;
  readonly error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[var(--text-small)] font-medium text-[var(--color-text)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'h-10 w-full rounded-[var(--radius-md)] border border-black/10 bg-transparent px-3',
            'text-[var(--text-base)] text-[var(--color-text)]',
            'placeholder:text-[var(--color-text-muted)]',
            'transition-shadow duration-[var(--duration-fast)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--color-error)] focus:ring-[var(--color-error)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-[var(--text-small)] text-[var(--color-error)]"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
