import { cn } from '@/lib/cn';

interface MarqueeProps {
  readonly children: React.ReactNode;
  readonly speed?: number;
  readonly pauseOnHover?: boolean;
  readonly className?: string;
}

/**
 * Infinite horizontal marquee. Renders two identical tracks that together span
 * 200% of the container and animate -50% on the X axis — guaranteed no-overlap
 * tiling regardless of child widths.
 */
export function Marquee({ children, speed = 40, pauseOnHover = true, className }: MarqueeProps) {
  return (
    <div
      className={cn(
        'relative flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]',
        className,
      )}
    >
      <div
        className={cn(
          'flex w-max min-w-full shrink-0 items-center motion-safe:animate-[marquee-half_var(--_d)_linear_infinite]',
          pauseOnHover && 'hover:[animation-play-state:paused]',
        )}
        style={{ '--_d': `${speed}s` } as React.CSSProperties}
      >
        <div className="flex shrink-0 items-center gap-10 pr-10">{children}</div>
        <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
