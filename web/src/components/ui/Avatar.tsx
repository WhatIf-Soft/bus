import { cn } from '@/lib/cn';

const sizeStyles = {
  sm: 'h-8 w-8 text-[length:var(--text-xs)]',
  md: 'h-10 w-10 text-[length:var(--text-small)]',
  lg: 'h-14 w-14 text-[length:var(--text-base)]',
} as const;

type AvatarSize = keyof typeof sizeStyles;

interface AvatarProps {
  readonly name: string;
  readonly size?: AvatarSize;
  readonly className?: string;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ((hash % 360) + 360) % 360;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const hue = nameToHue(name);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white',
        sizeStyles[size],
        className,
      )}
      style={{ backgroundColor: `oklch(55% 0.15 ${hue})` }}
      aria-label={name}
      role="img"
    >
      {getInitials(name)}
    </span>
  );
}
