# BusExpress Frontend Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the functional-but-bare BusExpress frontend into a polished, branded marketplace with clean transit UI + vibrant West African accents, mobile-first bottom tab nav, and Radix-powered components.

**Architecture:** Layered approach — design tokens first (CSS vars), then shared UI components (Radix-styled), then layout shell (Header/Footer/BottomTabBar), then page-by-page redesign. Each task produces a buildable, visually testable increment.

**Tech Stack:** Next.js 15, Tailwind CSS v4, Radix UI (dialog, dropdown-menu, toast, toggle-group, tabs, tooltip), CSS custom properties (OKLch), inline SVG icons/patterns.

---

### Task 1: Design Tokens + Dependencies

**Files:**
- Modify: `web/src/styles/globals.css`
- Modify: `web/package.json` (add 3 Radix packages)

- [ ] **Step 1: Install new Radix packages**

```bash
cd web && pnpm add @radix-ui/react-toggle-group @radix-ui/react-tabs @radix-ui/react-tooltip
```

- [ ] **Step 2: Update globals.css with new design tokens**

Replace the entire `:root` block in `web/src/styles/globals.css` with:

```css
@import "tailwindcss";

:root {
  /* Brand palette — clean transit + West African warmth */
  --color-primary: oklch(50% 0.18 250);
  --color-primary-light: oklch(65% 0.12 250);
  --color-accent-warm: oklch(65% 0.18 45);
  --color-accent-gold: oklch(78% 0.15 85);
  --color-accent-green: oklch(60% 0.15 155);

  /* Surfaces */
  --color-bg: oklch(96% 0.005 250);
  --color-surface: oklch(99% 0 0);
  --color-surface-elevated: oklch(100% 0 0);

  /* Text */
  --color-text: oklch(20% 0 0);
  --color-text-muted: oklch(45% 0 0);
  --color-text-inverse: oklch(98% 0 0);

  /* Semantic */
  --color-success: oklch(60% 0.18 150);
  --color-warning: oklch(75% 0.15 80);
  --color-error: oklch(55% 0.22 25);

  /* Typography — responsive clamp */
  --text-hero: clamp(2.5rem, 1rem + 5vw, 4rem);
  --text-heading: clamp(1.25rem, 1rem + 1.5vw, 2rem);
  --text-subheading: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
  --text-base: clamp(0.875rem, 0.8rem + 0.3vw, 1rem);
  --text-small: 0.8125rem;
  --text-xs: 0.75rem;

  /* Spacing */
  --space-section: clamp(3rem, 2rem + 4vw, 6rem);
  --space-card: clamp(1rem, 0.75rem + 1vw, 1.5rem);
  --space-page-x: clamp(1rem, 0.5rem + 2vw, 2rem);

  /* Radii */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Motion */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* Layout */
  --header-height: 64px;
  --tabbar-height: 56px;
  --max-content: 1200px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: oklch(12% 0.005 250);
    --color-surface: oklch(16% 0 0);
    --color-surface-elevated: oklch(20% 0 0);
    --color-text: oklch(92% 0 0);
    --color-text-muted: oklch(65% 0 0);
  }
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

/* Kente pattern divider — reusable via the KenteDivider component */
.kente-divider {
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    var(--color-accent-warm) 0px,
    var(--color-accent-warm) 8px,
    transparent 8px,
    transparent 12px,
    var(--color-accent-gold) 12px,
    var(--color-accent-gold) 16px,
    transparent 16px,
    transparent 20px
  );
  opacity: 0.2;
}

/* Skeleton pulse animation */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.25; }
}
.skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  background: var(--color-text);
  border-radius: var(--radius-md);
}

/* Seat selection pulse */
@keyframes seat-pulse {
  0% { box-shadow: 0 0 0 0 oklch(65% 0.18 45 / 0.5); }
  70% { box-shadow: 0 0 0 6px oklch(65% 0.18 45 / 0); }
  100% { box-shadow: 0 0 0 0 oklch(65% 0.18 45 / 0); }
}
```

- [ ] **Step 3: Verify build passes**

```bash
cd web && pnpm typecheck && pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add web/src/styles/globals.css web/package.json web/pnpm-lock.yaml
git commit -m "feat(web): update design tokens + install Radix toggle-group, tabs, tooltip"
```

---

### Task 2: Shared UI Components (Badge, Avatar, Skeleton, EmptyState, KenteDivider, Tooltip)

**Files:**
- Create: `web/src/components/ui/Badge.tsx`
- Create: `web/src/components/ui/Avatar.tsx`
- Create: `web/src/components/ui/Skeleton.tsx`
- Create: `web/src/components/ui/EmptyState.tsx`
- Create: `web/src/components/ui/KenteDivider.tsx`
- Create: `web/src/components/ui/Tooltip.tsx`

- [ ] **Step 1: Create Badge component**

`web/src/components/ui/Badge.tsx`:

```tsx
import { cn } from '@/lib/cn';

const variants = {
  default: 'bg-black/5 text-[var(--color-text)]',
  success: 'bg-[var(--color-accent-green)]/15 text-[var(--color-accent-green)]',
  warning: 'bg-[var(--color-warning)]/15 text-amber-900',
  error: 'bg-[var(--color-error)]/15 text-[var(--color-error)]',
  gold: 'bg-[var(--color-accent-gold)]/15 text-amber-800',
  warm: 'bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm)]',
  primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
} as const;

interface BadgeProps {
  readonly children: React.ReactNode;
  readonly variant?: keyof typeof variants;
  readonly className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2.5 py-0.5',
        'text-[var(--text-xs)] font-medium leading-none',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Create Avatar component**

`web/src/components/ui/Avatar.tsx`:

```tsx
import { cn } from '@/lib/cn';

interface AvatarProps {
  readonly name: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-[var(--text-xs)]',
  md: 'h-10 w-10 text-[var(--text-small)]',
  lg: 'h-14 w-14 text-[var(--text-base)]',
};

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  const hue = Math.abs(h) % 360;
  return `oklch(55% 0.15 ${hue})`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: hashColor(name) }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
```

- [ ] **Step 3: Create Skeleton component**

`web/src/components/ui/Skeleton.tsx`:

```tsx
import { cn } from '@/lib/cn';

interface SkeletonProps {
  readonly className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-black/5 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-20 rounded-[var(--radius-md)]" />
      </div>
    </div>
  );
}

export function SkeletonTripCard() {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-black/5 p-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3 w-48" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-20 rounded-[var(--radius-md)]" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create EmptyState component**

`web/src/components/ui/EmptyState.tsx`:

```tsx
interface EmptyStateProps {
  readonly icon?: React.ReactNode;
  readonly heading: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
}

export function EmptyState({ icon, heading, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-black/[0.02] p-8 text-center">
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-warm)]/10 text-[var(--color-accent-warm)]">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-[var(--text-subheading)] font-semibold">{heading}</h3>
        {description && (
          <p className="max-w-md text-[var(--text-small)] text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
```

- [ ] **Step 5: Create KenteDivider component**

`web/src/components/ui/KenteDivider.tsx`:

```tsx
import { cn } from '@/lib/cn';

interface KenteDividerProps {
  readonly className?: string;
}

export function KenteDivider({ className }: KenteDividerProps) {
  return <div className={cn('kente-divider w-full', className)} aria-hidden />;
}
```

- [ ] **Step 6: Create Tooltip component (Radix-styled)**

`web/src/components/ui/Tooltip.tsx`:

```tsx
'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';

interface TooltipProps {
  readonly children: React.ReactNode;
  readonly content: string;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
}

export function TooltipProvider({ children }: { readonly children: React.ReactNode }) {
  return <RadixTooltip.Provider delayDuration={300}>{children}</RadixTooltip.Provider>;
}

export function Tooltip({ children, content, side = 'top' }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={5}
          className="z-50 rounded-[var(--radius-md)] bg-[var(--color-text)] px-3 py-1.5 text-[var(--text-xs)] text-[var(--color-text-inverse)] shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {content}
          <RadixTooltip.Arrow className="fill-[var(--color-text)]" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
```

- [ ] **Step 7: Run typecheck**

```bash
cd web && pnpm typecheck
```

- [ ] **Step 8: Commit**

```bash
git add web/src/components/ui/
git commit -m "feat(web): add Badge, Avatar, Skeleton, EmptyState, KenteDivider, Tooltip components"
```

---

### Task 3: Toast + ConfirmDialog (Radix-styled)

**Files:**
- Create: `web/src/components/ui/Toast.tsx`
- Create: `web/src/hooks/useToast.ts`
- Create: `web/src/components/ui/ConfirmDialog.tsx`

- [ ] **Step 1: Create Toast component + useToast hook**

`web/src/hooks/useToast.ts`:

```tsx
'use client';

import { create } from 'zustand';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  readonly open: boolean;
  readonly message: string;
  readonly variant: ToastVariant;
  show: (message: string, variant?: ToastVariant) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  open: false,
  message: '',
  variant: 'info',
  show: (message, variant = 'info') => set({ open: true, message, variant }),
  hide: () => set({ open: false }),
}));
```

`web/src/components/ui/Toast.tsx`:

```tsx
'use client';

import * as RadixToast from '@radix-ui/react-toast';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

const variantStyles = {
  success: 'border-[var(--color-accent-green)] bg-[var(--color-accent-green)]/10',
  error: 'border-[var(--color-error)] bg-[var(--color-error)]/10',
  info: 'border-[var(--color-primary)] bg-[var(--color-primary)]/10',
};

export function ToastProvider({ children }: { readonly children: React.ReactNode }) {
  const { open, message, variant, hide } = useToast();

  return (
    <RadixToast.Provider swipeDirection="right">
      {children}
      <RadixToast.Root
        open={open}
        onOpenChange={(o) => !o && hide()}
        duration={4000}
        className={cn(
          'rounded-[var(--radius-lg)] border px-4 py-3 shadow-lg',
          'text-[var(--text-small)] font-medium',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-5',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out',
          variantStyles[variant],
        )}
      >
        <RadixToast.Description>{message}</RadixToast.Description>
      </RadixToast.Root>
      <RadixToast.Viewport className="fixed bottom-20 right-4 z-50 flex max-w-sm flex-col gap-2 md:bottom-6" />
    </RadixToast.Provider>
  );
}
```

- [ ] **Step 2: Create ConfirmDialog component**

`web/src/components/ui/ConfirmDialog.tsx`:

```tsx
'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly onConfirm: () => void;
  readonly destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmer',
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] p-6 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-[var(--text-small)] text-[var(--color-text-muted)]">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm">
                Annuler
              </Button>
            </Dialog.Close>
            <Button
              variant={destructive ? 'destructive' : 'primary'}
              size="sm"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd web && pnpm typecheck
git add web/src/components/ui/Toast.tsx web/src/hooks/useToast.ts web/src/components/ui/ConfirmDialog.tsx
git commit -m "feat(web): add Toast (Radix) + useToast hook + ConfirmDialog"
```

---

### Task 4: Layout Shell (Header, Footer, BottomTabBar, PageShell)

**Files:**
- Create: `web/src/components/layout/Header.tsx`
- Create: `web/src/components/layout/Footer.tsx`
- Create: `web/src/components/layout/BottomTabBar.tsx`
- Create: `web/src/components/layout/PageShell.tsx`
- Modify: `web/src/app/[locale]/layout.tsx`

- [ ] **Step 1: Create Header**

`web/src/components/layout/Header.tsx` — sticky desktop nav with logo, center links, account dropdown (Radix DropdownMenu). Terracotta accent line below. Hidden on mobile (<768px).

- [ ] **Step 2: Create Footer**

`web/src/components/layout/Footer.tsx` — 4-column responsive grid (Entreprise, Voyageurs, Opérateurs, Légal). BusExpress logo + "Made in West Africa" tagline. KenteDivider above.

- [ ] **Step 3: Create BottomTabBar**

`web/src/components/layout/BottomTabBar.tsx` — fixed bottom, 56px, 4 tabs (Home, Rechercher, Mes Voyages, Compte). Terracotta active indicator. `safe-area-inset-bottom` for notched phones. Hidden on desktop (768px+).

- [ ] **Step 4: Create PageShell**

`web/src/components/layout/PageShell.tsx` — wraps children with Header (desktop) + BottomTabBar (mobile) + Footer. Adds appropriate bottom padding on mobile so content isn't hidden behind the tab bar.

- [ ] **Step 5: Wire PageShell into root layout**

Modify `web/src/app/[locale]/layout.tsx` — wrap the `{children}` in `<PageShell>` + `<ToastProvider>` + `<TooltipProvider>`.

- [ ] **Step 6: Typecheck + visual test + commit**

```bash
cd web && pnpm typecheck
git add web/src/components/layout/ web/src/app/\[locale\]/layout.tsx
git commit -m "feat(web): add Header, Footer, BottomTabBar, PageShell — global navigation"
```

---

### Task 5: Home Page Redesign

**Files:**
- Modify: `web/src/app/[locale]/page.tsx`
- Modify: `web/src/components/search/SearchForm.tsx`
- Create: `web/public/images/hero-bus-station.avif` (gradient placeholder)

- [ ] **Step 1: Create hero placeholder image**

Generate a CSS gradient placeholder (no real photo needed for dev). The hero will use a dark gradient overlay so even a solid dark image works.

- [ ] **Step 2: Redesign home page**

Rewrite `web/src/app/[locale]/page.tsx`:
- Full-width hero with background gradient/image + overlay
- Search form in centered white card
- Tagline: "Réservez votre bus en un clic"
- Trust badges: 3 inline icon+text
- "Comment ça marche" 3-step strip with KenteDivider
- "Trajets populaires" route cards (horizontal scroll mobile / grid desktop)
- "Opérateurs partenaires" logo strip
- CTA banner (terracotta)

- [ ] **Step 3: Update SearchForm with collapsed inline variant**

Add a `variant="inline"` prop to `SearchForm.tsx` that renders all fields in a single row with a "Modifier" expand button. Used on the search results page.

- [ ] **Step 4: Typecheck + commit**

```bash
cd web && pnpm typecheck
git add web/src/app/\[locale\]/page.tsx web/src/components/search/SearchForm.tsx web/public/images/
git commit -m "feat(web): redesign home page — hero, trust badges, popular routes, how-it-works"
```

---

### Task 6: Search Results Redesign

**Files:**
- Modify: `web/src/app/[locale]/search/page.tsx`
- Modify: `web/src/components/search/TripCard.tsx`
- Create: `web/src/components/ui/StepIndicator.tsx`

- [ ] **Step 1: Create StepIndicator for booking flow**

`web/src/components/ui/StepIndicator.tsx` — 4-step progress with terracotta active, green completed, gray upcoming. Connected by line. Step labels: Sièges, Passagers, Paiement, Confirmation.

- [ ] **Step 2: Redesign TripCard**

Rewrite `web/src/components/search/TripCard.tsx`:
- Horizontal layout (desktop), stacked (mobile)
- Left: departure/arrival times + duration pill
- Center: route with dotted line + bus SVG, operator name + Avatar initial circle, amenity SVG icons, star rating (gold)
- Right: price (gold accent), seats Badge (green/amber/red), Réserver CTA or "Liste d'attente" (terracotta outline)
- Hover: translateY(-2px) + shadow

- [ ] **Step 3: Redesign search results page**

Rewrite `web/src/app/[locale]/search/page.tsx`:
- Breadcrumb at top
- Collapsed SearchForm (inline variant)
- Result count + sort pills (terracotta active)
- SkeletonTripCard loading state (3 cards)
- EmptyState when no results

- [ ] **Step 4: Typecheck + commit**

```bash
cd web && pnpm typecheck
git add web/src/app/\[locale\]/search/ web/src/components/search/ web/src/components/ui/StepIndicator.tsx
git commit -m "feat(web): redesign search results — TripCard, breadcrumbs, skeleton, empty state"
```

---

### Task 7: Booking Flow Redesign

**Files:**
- Modify: `web/src/app/[locale]/booking/[tripId]/BookingFlow.tsx`
- Modify: `web/src/components/booking/SeatMap.tsx`
- Modify: `web/src/components/booking/PassengerForm.tsx`
- Modify: `web/src/components/payment/PaymentMethodSelect.tsx`
- Modify: `web/src/components/booking/LockTimer.tsx`
- Create: `web/src/components/ui/StickyBar.tsx`

- [ ] **Step 1: Create StickyBar**

`web/src/components/ui/StickyBar.tsx` — fixed bottom bar (mobile only) with price summary + CTA button. Used in booking steps.

- [ ] **Step 2: Update SeatMap**

Modify `web/src/components/booking/SeatMap.tsx`:
- Rounded seat shapes (rounded-lg instead of rounded-md)
- Selected: `seat-pulse` CSS animation + terracotta ring
- Driver silhouette SVG at front
- Improved legend with larger swatches

- [ ] **Step 3: Update PassengerForm with Radix ToggleGroup**

Modify `web/src/components/booking/PassengerForm.tsx`:
- Replace `<select>` category picker with `@radix-ui/react-toggle-group` pill buttons
- Real-time discount badge: Badge component with "−50%" when child selected

- [ ] **Step 4: Update PaymentMethodSelect**

Modify `web/src/components/payment/PaymentMethodSelect.tsx`:
- Tall card layout with provider-color left border (4px)
- Larger touch target (min 56px height)
- Provider icon placeholder (colored circle with first letter)

- [ ] **Step 5: Update LockTimer as banner**

Modify `web/src/components/booking/LockTimer.tsx`:
- Full-width banner instead of inline badge
- Terracotta bg when > 2min, amber pulsing when < 2min
- Fixed at top of payment step

- [ ] **Step 6: Wire StepIndicator + StickyBar into BookingFlow**

Modify `web/src/app/[locale]/booking/[tripId]/BookingFlow.tsx`:
- Add StepIndicator at top (step 1-4 based on current step)
- Add StickyBar at bottom (mobile) with seat count + price + CTA
- Confirmation step: green checkmark circle + CSS confetti animation + auto-redirect

- [ ] **Step 7: Typecheck + commit**

```bash
cd web && pnpm typecheck
git add web/src/app/\[locale\]/booking/ web/src/components/booking/ web/src/components/payment/ web/src/components/ui/StickyBar.tsx
git commit -m "feat(web): redesign booking flow — stepper, rounded seats, pill categories, payment cards, sticky bar"
```

---

### Task 8: Account Pages + Operator Portal Polish

**Files:**
- Modify: `web/src/app/[locale]/account/page.tsx`
- Modify: `web/src/app/[locale]/account/bookings/[id]/page.tsx`
- Modify: `web/src/app/[locale]/operator/layout.tsx`

- [ ] **Step 1: Redesign account hub**

Rewrite `web/src/app/[locale]/account/page.tsx`:
- Profile card with Avatar, name, email, loyalty Badge (gold), referral copy pill
- Quick-action grid (4 cards): Mes Réservations, Mes Billets, Liste d'attente, Support — icon + count + terracotta arrow

- [ ] **Step 2: Update booking detail with status banner + ConfirmDialog**

Modify `web/src/app/[locale]/account/bookings/[id]/page.tsx`:
- Full-width status banner at top (green confirmed, amber pending, red cancelled)
- Replace inline cancel button with ConfirmDialog trigger

- [ ] **Step 3: Update operator portal with Radix Tabs**

Modify `web/src/app/[locale]/operator/layout.tsx`:
- Replace `<Link>` nav with `@radix-ui/react-tabs` for proper accessible tab switching
- Terracotta active tab indicator
- Keep the same tab content pages

- [ ] **Step 4: Typecheck + full build + commit**

```bash
cd web && pnpm typecheck && pnpm build
git add web/src/app/ web/src/components/
git commit -m "feat(web): redesign account hub, booking detail, operator portal — polish pass"
```

---

### Final Verification

After all 8 tasks:

```bash
cd web && pnpm typecheck && pnpm build && pnpm test
```

Start dev server and visually verify:
- Home page hero + search + below-fold sections
- Search results: skeleton → cards → empty state
- Booking flow: stepper → seats → passengers (pill toggle) → payment → confirmation
- Account hub → booking detail (status banner + cancel dialog)
- Operator portal (Radix tabs)
- Mobile: bottom tab bar, no hamburger
- Desktop: sticky header + footer
- Toast: trigger from any error/success action
- Dark mode: check tokens adapt
