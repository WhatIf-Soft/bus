'use client';

import { cn } from '@/lib/cn';

interface StepIndicatorProps {
  readonly steps: ReadonlyArray<string>;
  readonly currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Étapes de progression" className="flex items-start justify-between">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isUpcoming = index > currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  isCompleted &&
                    'bg-[var(--color-accent-green)] text-white',
                  isActive &&
                    'bg-[var(--color-accent-warm)] text-white',
                  isUpcoming &&
                    'border border-black/20 text-[var(--color-text-muted)]',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isCompleted ? (
                  <span aria-label="Complété">✓</span>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Label — hidden on mobile */}
              <span
                className={cn(
                  'mt-1.5 hidden text-center text-[var(--text-xs)] sm:block',
                  isActive && 'font-medium text-[var(--color-text)]',
                  !isActive && 'text-[var(--color-text-muted)]',
                )}
              >
                {label}
              </span>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div
                className={cn(
                  'mt-4 h-0.5 flex-1 mx-2',
                  index < currentStep
                    ? 'bg-[var(--color-accent-green)]'
                    : 'bg-black/10',
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
