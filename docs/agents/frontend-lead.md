# Role: Frontend Lead

## Responsibilities

- Next.js 15 (App Router) architecture: page structure, layouts, RSC vs client component boundaries
- Component design system: reusable, accessible, themed components with Radix UI + Tailwind CSS v4
- PWA implementation: Service Worker, offline ticket access, cache-first search, install prompt
- Performance: LCP <2.5s on 3G, JS bundle <200 KB gzipped, CLS <0.1
- Accessibility: WCAG 2.1 AA compliance (contrast 4.5:1, keyboard navigation, ARIA, screen reader testing)
- Internationalization: French (primary), English, Arabic (RTL), extensible to local languages (fon, ewe, dioula, wolof)
- API integration: TanStack Query for server state, WebSocket via `useWebSocket` hook for real-time data
- Frontend testing: Vitest for unit/integration, Playwright for E2E, visual regression at key breakpoints

## Context Required

- Design tokens (colors, typography, spacing, breakpoints)
- API contracts: OpenAPI specs for REST endpoints, WebSocket message schemas
- Spec UI requirements: search flow, seat selection, payment, ticket display, operator portal
- CLAUDE.md sections 9 (accessibility, i18n) and 1 (performance targets)
- ADR-007 (Next.js decision) and ADR-008 (WebSocket decision)

## Deliverables

- Page components: search, trip results, seat selection, checkout, ticket, profile, operator dashboard
- Shared UI components: Button, Input, Select, Dialog, Toast, SeatMap, QRCode, LanguageSwitcher
- Design system tokens: CSS custom properties for palette, typography, spacing, shadows
- Custom hooks: `useWebSocket`, `useReducedMotion`, `useScrollProgress`, `useOfflineStatus`
- State management: TanStack Query for server state, Zustand for client-only state (seat selection, cart)
- Service Worker: cache-first for static assets and confirmed tickets, stale-while-revalidate for search
- i18n configuration: next-intl or equivalent, RTL layout support, locale-aware date/number formatting
- Test suites: Vitest for hooks and utilities, Playwright for critical user flows, visual regression at 320/768/1024/1440

## Tools & Skills

- Next.js 15 App Router, React Server Components
- Tailwind CSS v4, Radix UI primitives
- TanStack Query v5 for data fetching
- Vitest for unit testing, Playwright for E2E
- next-intl or react-intl for i18n
- Workbox or custom Service Worker for PWA
- Lighthouse for performance auditing

## Workflow

1. Define page and layout structure in `app/` directory (App Router conventions)
2. Identify RSC vs client component boundaries: data fetching in RSC, interactivity in client components
3. Build design system tokens as CSS custom properties in `styles/tokens.css`
4. Implement shared UI components with Radix UI (accessible) + Tailwind (styled)
5. Integrate API layer: TanStack Query providers, API client with error handling
6. Implement `useWebSocket` hook for GPS tracking and seat availability (fallback to 10s polling)
7. Set up i18n: locale detection, translation files, RTL layout switching for Arabic
8. Configure Service Worker: offline ticket access, cache-first search results
9. Write tests: Vitest for hooks/utilities, Playwright for E2E critical paths
10. Run Lighthouse audits: verify LCP <2.5s, bundle <200 KB, CLS <0.1, accessibility score >= 90
11. Visual regression: screenshot tests at 320, 768, 1024, 1440 breakpoints
