# ADR-001: Replace the Next.js scaffold with Astro

- **Status**: Accepted
- **Date**: 2026-11-20
- **Deciders**: ICD 2026 engineering team
- **Supersedes**: the Next.js (App Router) scaffold that shipped in `README` history

## Context

The repository started as a Next.js App Router scaffold: a full-stack, server-rendered React architecture with Server Actions (`features/<name>/actions`), route handlers (`src/app/api`), TanStack Query for server state, and a heavy CI pipeline (React Doctor, Next build cache, `.next` artifacts).

At the same time the Figma design for ICD NOV 2026 (`design` board, `node-id=1630-23611`) is a content-driven public campaign site:

- Landing page: hero, date chips, "What's Inside", presenting-companies logo wall, "Moments" gallery, sponsor wall, FAQ.
- Registration flow: a mostly static "Alur Pendaftaran" with two columns (Sivitas / Non-Sivitas).
- Rundown: a day-tabbed schedule (Today / Tomorrow) with session cards and recap videos.
- Interactive denah (venue map): the one genuinely complex screen — an SVG floor plan with pan/zoom, booth selection, a search box, dropdown navigation (GIK / Career Expo / Walk-in Interview / Career Counseling), and a dynamic company detail sidebar.

Roughly four-fifths of this is static content. Only the venue map and a few small controls (tabs, dropdown, accordion, search) need client-side interactivity. The Next.js machinery was solving problems this project does not have: there are no authenticated server mutations, no webhook handlers, and no dynamic per-request rendering in the current design.

## Decision

Adopt **Astro 5** as the framework and restructure the scaffold around an islands architecture.

- Static-first pages under `src/pages` using `.astro` components; ship zero client JavaScript unless an island is mounted.
- Interactive pieces (venue map, search, day tabs, dropdown) as React islands under `src/islands`, mounted with `client:*` directives.
- Event data (companies, FAQ, sponsors, sessions, videos) as Astro Content Collections validated with Zod.
- Video recap embeds via `react-youtube` (YouTube as canonical source) inside an island.
- Drop Next.js-specific structure: `src/app` routing and `src/app/api`, and the `actions/` subfolder in the feature template.
- Keep the layered, ownership-based architecture (`views`, `features`, `components/ui`, `styles/tokens`, `lib`) because it is framework-agnostic and still fits Astro.
- Update CI to run `astro check` in place of React Doctor, build to `dist/` instead of `.next`, and drive E2E from `astro preview`.

## Consequences

### Positive

- Static content compiles to plain HTML with no hydration cost, improving first paint and Lighthouse scores for a public marketing page.
- Smaller bundles: only islands pay for React, Zustand, and Motion. Server-state fetching (TanStack Query) and MDX were later removed as unnecessary for this read-only v1 — see `ADR-002`.
- Simpler mental model that matches the design's actual needs; no server actions or API routes to maintain.
- Faster builds and lighter CI than the Next.js pipeline.
- Content collections give organizers a typed, validated way to manage companies, FAQ, sessions, and sponsors.

### Negative / Trade-offs

- If the platform later grows real user accounts, authenticated mutations, or webhooks, we must switch `output` to `hybrid`/`server` and reintroduce endpoints (`ADR-002` tracks that future change).
- Two authoring models coexist: `.astro` for static presentation and `.tsx` islands for interactivity. Architecture rules and code review enforce the boundary so components do not drift into islands "by accident".
- The team must be comfortable deciding where a screen should stay static versus become an island; `ADR-001` rule 12 and the "opt-in islands" PR rule are the guardrails.

## Alternatives considered

1. **Keep Next.js.** Rejected as overkill: the scaffold's server-action, route-handler, and RSC machinery maps to none of the current screens, and its CI/build overhead buys nothing for a static campaign site.
2. **Plain Vite + React SPA.** Rejected: worse SEO and initial-load behavior for a public event page, and it loses Astro's zero-JS-by-default static rendering and content collections.
3. **Astro with islands.** Chosen: best fit for "mostly static content + a few interactive islands", which is exactly the shape of the ICD 2026 design.
