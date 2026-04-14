# ADR-007: Frontend Framework — Next.js 15

## Status: Accepted

## Context

BusExpress serves a West African market with variable connectivity (2G/3G), where LCP under 2.5 seconds on 3G networks is a hard requirement. The frontend must be a PWA (installable, offline-capable) with WCAG 2.1 AA accessibility, RTL support (Arabic), and a JS bundle under 200 KB gzipped.

## Decision

We chose **Next.js 15 (App Router)** as the frontend framework, with **Tailwind CSS v4** for styling and **Radix UI** for accessible headless components.

Key reasons:

- **SSR/SSG for LCP < 2.5s on 3G**: Next.js App Router supports React Server Components (RSC), which render on the server and send minimal JavaScript to the client. Combined with SSG for static pages (FAQ, operator listings), this dramatically reduces time-to-interactive on slow networks.
- **React Server Components reduce bundle size**: RSC keeps server-only code (data fetching, heavy transformations) out of the client bundle, helping meet the 200 KB JS budget.
- **Tailwind CSS v4 for mobile-first styling**: Utility-first CSS with mobile-first breakpoints (320, 480, 768, 1024, 1440) aligns with the project's responsive requirements. Tailwind's purge eliminates unused CSS, keeping the stylesheet small.
- **Radix UI for WCAG 2.1 AA**: Radix provides unstyled, accessible headless components (dialogs, dropdowns, tabs, tooltips) with correct ARIA attributes, keyboard navigation, and focus management built in. This satisfies the accessibility requirements without fighting a component library's visual opinions.
- **PWA support**: Next.js supports Service Worker integration via `next-pwa` or custom workers, enabling offline ticket access and cache-first search results.

## Consequences

**Positive:**

- Server-rendered pages load fast even on 2G/3G connections.
- Client JS bundle stays small thanks to RSC and code splitting.
- Accessible components out of the box, reducing manual ARIA work.
- Tailwind's utility classes produce consistent, maintainable styles without CSS bloat.
- PWA installability and offline support are first-class.

**Negative:**

- Next.js App Router is relatively new and has a steeper learning curve than Pages Router.
- RSC has constraints (no client state, no hooks) that require careful component boundary design.
- Radix UI components are unstyled — every component needs explicit styling, increasing initial development time.
- Tailwind class strings can become long and hard to read in complex components.
