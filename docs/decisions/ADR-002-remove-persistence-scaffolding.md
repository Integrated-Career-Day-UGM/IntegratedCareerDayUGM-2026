# ADR-002: Strip persistence and backend scaffolding from the v1 scaffold

- **Status**: Accepted
- **Date**: 2026-11-20
- **Deciders**: ICD 2026 engineering team
- **Relates to**: `ADR-001-astro-over-nextjs.md`

## Context

The Astro scaffold inherited from the original Next.js project carried a lot of structure that assumed a two-way, data-driven application: HTTP API clients, server-state caching, API/webhook route folders, example `auth` and `user-profile` features, MDX long-form pages, and API mocking.

The ICD 2026 design (`design` board, `node-id=1630-23611`) is, for v1, a **read-only** public site:

- Visitors view the landing page, "What's Inside", presenting companies, sponsors, and a moments/video gallery.
- They read a registration flow and a day-tabbed schedule.
- They browse an interactive venue map, search it, and select booths/companies.

Everything is presented to the visitor. Nothing is written back to a server. There are no accounts, no submissions, no remote data, and no webhook integrations in the current scope. All content is authored locally and baked in at build time via Astro Content Collections.

Keeping the persistence scaffolding in place for a problem the project does not have yet is clutter: it makes the tree harder to reason about, invites contributors (and AI agents) to "helpfully" wire up things that should not exist yet, and adds dependencies and CI surface area for zero user value.

## Decision

Remove all persistence-, backend-, and account-related scaffolding from the scaffold. It will be re-added incrementally, only when a concrete need appears, and recorded here or in a new ADR.

**Removed:**

- `src/pages/api/` — the endpoint/webhook surface. The site is static (`output: 'static'`).
- `src/features/auth/` and `src/features/user-profile/` — example features that model user accounts and persistence.
- `src/features/_template/api/` — the per-feature data-fetching slot.
- `src/lib/api-client/` — the HTTP client and interceptors.
- `src/lib/query/` — the TanStack Query client factory.
- `src/providers/` — existed only to mount the Query provider for islands.
- `src/test/mocks/` — MSW request handlers.
- Dependencies: `@astrojs/mdx`, `@tanstack/react-query`, and `msw`.
- MDX usage in `astro.config.mjs` and the `PUBLIC_API_URL` env var from `.env.example`.

**Kept:**

- **Astro Content Collections** in `src/content` with Zod-validated schemas in `src/content.config.ts`. This is how a read-only site gets its data; it is build-time, not runtime, so it is not "persistence" in the backend sense.
- **Zod** — required by content collection schemas, env validation, and future client-side form validation.
- **Zustand** — client state only, not persistence. Retained as an *optional* tool: default to React state inside a single island and add a store only when cross-component/cross-island state is proven necessary.
- `motion` and `react-youtube` — presentation/animation and iframe video embeds; no data written out.
- `astro.config.mjs` `output: 'static'`.

## Consequences

### Positive

- The scaffold now matches the actual v1 workload: static pages plus a handful of islands, no phantom backend folders.
- Smaller dependency graph and less CI surface (no MSW workers, no MDX pipeline).
- Contributors get a clear, single source of truth for "we do not have a backend yet," reducing speculative wiring.

### Negative / Trade-offs

- Re-adding the stack later is a deliberate, multi-file change (flip `output`, create `src/pages/api`, reintroduce Query/MSW, restore `PUBLIC_API_URL`). That is the intended friction — it should be a decision, not an accident.
- `src/features/_template` no longer has an `api/` folder; when a feature genuinely needs remote data, both the template and these rules are updated as part of that ADR.

### Guardrails (codified in README)

- Rule 8: all data comes from content collections; no client-side fetching or API client until a backend exists.
- Rule 11: to add a backend you must switch `output`, add `src/pages/api`, reintroduce the data-fetching stack, and record it here or in a new ADR.
- AI-agent rule 7: do not reintroduce removed persistence scaffolding (API, server state, MDX, MSW).

## Alternatives considered

1. **Keep the scaffolding "for later."** Rejected: it is dead structure today and actively misleads the tree and the agents working in it.
2. **Also drop Zustand.** Rejected for now: it is client state (not persistence) and the venue map may need shared island state. Kept as optional rather than mandatory.
3. **Adopt `server`/`hybrid` output preemptively.** Rejected: there are no endpoints, so it would only slow builds and complicate hosting for no benefit.
