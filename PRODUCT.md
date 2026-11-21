# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro + React islands (React 19), Tailwind v4, Zustand, MapLibre GL, motion.
Base UI flavor for shadcn/@fluid components. Dev server runs in Docker
(`docker compose -f docker-compose.dev.yaml up`).

## Users

Job seekers — primarily UGM students attending Integrated Career Days
(28–29 November 2026), used pre-event to plan and on-site to navigate.
Secondary: remote visitors browsing companies and opportunities after the
event. Many concrete personas, but all generalize to **job seekers**.

## Product Purpose

An interactive floor-plan map of the career fair: find booths, companies,
sessions, and facilities fast. Success = minimal time-to-booth on-site — a
visitor reaches the right booth or session without asking staff.

## Positioning

The only live, navigable map of the ICD 2026 halls — zone-coded booths,
sessions, and wayfinding in one screen, styled in a look no generic event-app
template would produce (see Brand Commitments).

## Operating Context

Public QR/link access on phones during a busy event: shared venue wifi,
one-handed use, glanceable interactions. Also desktop pre-event planning.

## Capabilities and Constraints

- No login/auth; anonymous access for anyone with the link/QR.
- All event content is JSON-driven (`src/data/ugm-icd-2026/*.json`) and must
  stay editable without code changes.
- Analytics pipeline is planned but not live; the UI must not depend on it.
- Event days are **28–29 November 2026** (user-specified).
- Map tiles are OpenFreeMap dark until another provider is supplied.
- Floor-plan SVG is a placeholder composite pending final geometry.

## Brand Commitments

- Name: **UGM Integrated Career Days 2026 (ICD 2026)**.
- Visual world is recorded in `DESIGN.md`: dark granite `#09090b` foundation,
  pink `#ff2d6f` accent, Persona-5-inspired energy; Priego headings, Inter
  body. No mascot artwork (user instruction).
- **Non-AI look (binding user commitment):** the UI must combine
  **Fluid Functionalism** motion (spring tokens, gliding fluid hover, scroll
  fades, size ladder) with a **boxy / pixel aesthetic** — sharp or minimal
  radii, 1px borders, hard offset shadows (`4px_4px_0` style), uppercase
  section labels per the Figma spec, and optional ordered/blue-noise
  **dithering** for imagery via the `DitherImage` component (2–4 ink
  palette, e.g. granite/paper/pink).
- Anti-goals: no soft glassy gradients, no generic rounded-glass "AI slop"
  styling, no stock dashboard look.

## Evidence on Hand

- Figma file `ICD-NOV-2026` (design source; map page node `1630:29309`).
- Zones/booths/companies/sessions/venues JSON data in the repo.
- DitherImage component source supplied by the user (single-file, React +
  WebGL2/WebGL1 with CPU fallback; no npm dependency).
- No testimonials, metrics, or press — none may be fabricated.

## Product Principles

1. Time-to-booth is the product: every screen answers "where do I go next".
2. One-handed, glanceable, fast — designed for a crowded hall on a phone.
3. Content changes without code: data lives in JSON.
4. The map is the hero; UI floats on it, never competes with it.
5. Craft over generic polish: the FF motion system + boxy/pixel treatment is
   the identity — never sand it down into a neutral template.

## Accessibility & Inclusion

No standard pinned yet (open decision). Known needs: touch-first targets
(44px), `prefers-reduced-motion` honored app-wide, readable type at 375px,
keyboard focus visible (pink focus ring).
