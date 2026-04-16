# BusExpress Frontend Redesign — Design Spec

**Date:** 2026-04-16
**Direction:** Clean transit foundation + vibrant West African accents
**Audience:** West African travellers, 2G/3G, mobile-first, francophone

---

## 1. Design Direction

Professional blue/white transit UI (FlixBus/BlaBlaCar clarity) with warm West African accents — terracotta highlights, gold ratings, kente-inspired pattern dividers. Minimal hybrid imagery: one optimized hero photo, icons + SVG patterns everywhere else.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `oklch(50% 0.18 250)` | CTAs, links, active states (deep blue) |
| `--color-accent-warm` | `oklch(65% 0.18 45)` | Terracotta — hover, active tab, dividers |
| `--color-accent-gold` | `oklch(78% 0.15 85)` | Star ratings, loyalty badges, price |
| `--color-accent-green` | `oklch(60% 0.15 155)` | Success, confirmed, available seats |
| `--color-surface` | `oklch(98% 0 0)` | Card backgrounds |
| `--color-bg` | `oklch(96% 0.005 250)` | Page bg (warm off-white) |
| `--color-text` | `oklch(20% 0 0)` | Body text |

### Typography

Inter or Outfit. Hero: `clamp(2.5rem, 1rem+5vw, 4rem)`. Body: 16px. Strong weight hierarchy (400/500/600/700).

### Pattern Accents

Subtle geometric kente-inspired SVG borders as section dividers. 1-2px repeating, `accent-warm` at 15% opacity. Inline SVG, no network requests.

---

## 2. Navigation

### Desktop (768px+)

Sticky top header: logo left, horizontal nav center (Accueil, Rechercher, Mes Voyages, Support), account dropdown right (Radix DropdownMenu — avatar + name, or "Connexion" CTA). Thin terracotta accent line below header.

### Mobile (<768px)

Fixed bottom tab bar (56px height). 4 tabs with icons + small labels:
- Home (house) · Rechercher (magnifying glass) · Mes Voyages (ticket) · Compte (person)

Active: terracotta underline + filled icon. Inactive: muted gray outlined icon.

Top bar: page title center, back arrow left (nested pages), notification bell right.

Operator portal: own sub-nav inside Compte tab when role is `operateur`.

### Footer (desktop + mobile)

4-column grid: Entreprise, Voyageurs, Opérateurs, Légal. Logo + "Made in West Africa" tagline.

---

## 3. Home Page

### Hero

Full-width background photo (West African bus station, AVIF, `fetchpriority="high"`, dark gradient overlay 60%→transparent). Search form centered over photo in white card with shadow. Tagline above: "Réservez votre bus en un clic" (white, bold). Trust badges below: "500+ trajets", "3 pays", "Paiement Mobile Money" (icons + white text).

### Below the Fold

1. **Comment ça marche** — 3-step strip: Recherchez → Réservez → Voyagez. Numbered icons. Kente divider above/below.
2. **Trajets populaires** — 4-6 route cards, horizontal scroll (mobile) / grid (desktop). Origin → destination, starting price, operator initial circle, departure count.
3. **Opérateurs partenaires** — Horizontal logo strip (colored initial circles).
4. **Téléchargez l'app** — Terracotta banner, white text. Future PWA install.
5. **Footer**.

---

## 4. Search Results

### Top

Breadcrumb: Accueil > Recherche > Abidjan → Yamoussoukro. Collapsed search bar (expandable). Result count + sort pills (Recommandé, Prix, Durée, Départ). Active pill: terracotta fill.

### Trip Cards

Horizontal (desktop), stacked (mobile):
- **Left:** departure time large bold, arrival time, duration pill
- **Center:** origin → destination with dotted line + bus icon, operator name + initial circle, amenity SVG icons (wifi/ac/usb), star rating (gold)
- **Right:** price large bold (gold accent), seats count (green >10, amber <5, red <2), "Réserver" primary CTA or "Liste d'attente" secondary (terracotta outline) when sold out
- **Hover:** translateY(-2px) + shadow increase

### States

- **Loading:** 3 skeleton cards (pulsing gray blocks matching card shape)
- **Empty:** SVG bus icon with "?", heading, suggestion text, "Rechercher des correspondances" CTA

---

## 5. Booking Flow

### Progress Stepper

4 steps connected by line: Sièges → Passagers → Paiement → Confirmation. Active: terracotta circle + white number. Completed: green checkmark. Upcoming: gray outlined.

### Step 1 — Seats

Trip summary card pinned at top (compact). Rounded seat shapes (not square), color legend. Selected seats: brief terracotta ring pulse. Mobile sticky bar: "2 sièges · 12 000 XOF · Continuer →".

### Step 2 — Passengers

Collapsible fieldset per seat. Category as pill buttons (Radix ToggleGroup): Adulte, Enfant, Senior, Étudiant. Real-time discount badge ("−50%").

### Step 3 — Payment

Lock timer: persistent top banner (terracotta > 2min, amber pulsing < 2min). Payment methods as tall illustrated cards (provider color left border). Order summary sidebar (desktop) / bottom sheet (mobile).

### Step 4 — Confirmation

Green checkmark circle + CSS confetti dots. Booking reference prominent. "Télécharger mes billets" primary CTA. Auto-redirect 5s.

---

## 6. Account Pages

### Account Hub

Profile card: avatar (initials, color-hashed), name, email, loyalty badge (gold, "125 pts"), referral code (copy pill). Quick-action grid: Mes Réservations, Mes Billets, Liste d'attente, Support — icon + count badge + terracotta arrow.

### Booking Detail

Full-width status banner (green/amber/red). Trip recap, passengers, tickets with PDF buttons, review form (if eligible). Cancel at bottom with Radix AlertDialog confirmation.

---

## 7. Component Library (Radix-first)

### Styled Radix Primitives

| Component | Radix Package | Notes |
|-----------|--------------|-------|
| `Toast` | `@radix-ui/react-toast` (installed) | Success/error/info variants + `useToast` hook |
| `ConfirmDialog` | `@radix-ui/react-dialog` (installed) | Destructive variant for cancel/delete |
| `AccountDropdown` | `@radix-ui/react-dropdown-menu` (installed) | Avatar trigger + menu items |
| `CategoryToggle` | `@radix-ui/react-toggle-group` (add) | Pill-style passenger category |
| `PortalTabs` | `@radix-ui/react-tabs` (add) | Replace operator `<Link>` tabs |
| `Tooltip` | `@radix-ui/react-tooltip` (add) | Amenity icons + seat info |

### Custom Components (pure styled, no Radix needed)

| Component | Purpose |
|-----------|---------|
| `Skeleton` | Pulsing placeholder (card/list/text shapes) |
| `Badge` | Status/category pills (green/amber/red/blue/gold) |
| `Avatar` | Initials circle, color-hashed from user id |
| `KenteDivider` | SVG geometric pattern section divider |
| `StepIndicator` | Booking flow progress bar (4 steps) |
| `StickyBar` | Mobile bottom action bar (price + CTA) |
| `EmptyState` | SVG illustration + heading + desc + CTA |

### Layout Components

| Component | Purpose |
|-----------|---------|
| `Header` | Sticky desktop nav (logo + links + account dropdown) |
| `Footer` | 4-column footer with links + branding |
| `BottomTabBar` | Fixed mobile nav (4 tabs + active indicator) |
| `PageShell` | Wraps Header + BottomTabBar + Footer around content |

---

## 8. Performance Constraints (CLAUDE.md §1)

- Hero image: single AVIF, max 80KB, `fetchpriority="high"`
- All other visuals: inline SVG (icons, patterns, illustrations)
- No external font CDN: self-host Inter/Outfit, `font-display: swap`, subset
- Skeleton loaders instead of spinners (no layout shift)
- CSS animations only (no JS animation libs)
- JS budget: < 200KB gzipped total (existing constraint)
- Bottom tab bar: `position: fixed` with `safe-area-inset-bottom` for notched phones

---

## 9. New Radix Packages to Install

```
pnpm add @radix-ui/react-toggle-group @radix-ui/react-tabs @radix-ui/react-tooltip
```

Everything else (`dialog`, `dropdown-menu`, `select`, `toast`, `slot`) is already installed.

---

## 10. Files to Create/Modify

### New Files

```
web/src/components/layout/Header.tsx
web/src/components/layout/Footer.tsx
web/src/components/layout/BottomTabBar.tsx
web/src/components/layout/PageShell.tsx
web/src/components/ui/Badge.tsx
web/src/components/ui/Avatar.tsx
web/src/components/ui/Skeleton.tsx
web/src/components/ui/EmptyState.tsx
web/src/components/ui/Toast.tsx (+ useToast hook)
web/src/components/ui/ConfirmDialog.tsx
web/src/components/ui/KenteDivider.tsx
web/src/components/ui/StepIndicator.tsx
web/src/components/ui/StickyBar.tsx
web/src/components/ui/Tooltip.tsx
web/src/styles/kente-pattern.svg (inline data URI)
web/public/images/hero-bus-station.avif (placeholder or real)
```

### Modified Files

```
web/src/styles/globals.css                    — new tokens, bg color, pattern vars
web/src/app/[locale]/layout.tsx               — wrap in PageShell
web/src/app/[locale]/page.tsx                 — full hero redesign
web/src/app/[locale]/search/page.tsx          — breadcrumb, skeleton, empty state
web/src/components/search/TripCard.tsx        — new layout with icons, badges, hover
web/src/components/search/SearchForm.tsx       — inline collapsed variant
web/src/app/[locale]/booking/[tripId]/*       — stepper, sticky bar, confirmation
web/src/components/booking/SeatMap.tsx         — rounded seats, pulse animation
web/src/components/booking/PassengerForm.tsx   — toggle-group categories
web/src/components/payment/PaymentMethodSelect.tsx — tall illustrated cards
web/src/components/payment/CardForm.tsx        — monospace code field style
web/src/app/[locale]/account/page.tsx          — hub with profile card + quick actions
web/src/app/[locale]/account/bookings/[id]/*   — status banner, confirm dialog
web/src/app/[locale]/operator/layout.tsx       — Radix Tabs
```
