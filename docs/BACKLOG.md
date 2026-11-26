# Backlog

## Deploy — YAML data (no Mongo)

- [ ] **Source of truth:** `src/data/ugm-icd-2026/LO_data/UGM-ICD-openings.yaml`
      (companies, intakes, roles) plus `UGM-ICD-booths.yaml` for booth mapping
      and profile-only companies (PP KAGAMA).
- [ ] **Generate before build:** `bun run sync:data` writes `career-fair.json`
      and regenerates companies/booths/sessions. `bun run build` already runs it.
- [ ] **Commit the generated JSON** so a clean clone and typecheck do not depend
      on a prebuild step.
- [ ] **Deploy flow for new lowongan:** update the YAML → run
      `bun run sync:data` → commit → Vercel redeploy (not Promote). Verify the
      build log shows `[sync:data] ... openings, ... profiles`.
- [ ] No Mongo env, no Atlas network access, no mock flags.

## SEO — map page follow-ups

- [ ] **Set `PUBLIC_APP_URL=https://www.icdugm26.app` in Vercel Production.**
      The checked-in local `.env` keeps `http://kiri.localhost`; `astro.config.mjs`
      now falls back to the production domain for builds when the configured
      host is localhost or missing, so canonical/OG/sitemap URLs are not
      poisoned locally. Still set the real env var in Vercel before launch.
- [ ] **Generate and wire the 1200×630 OG image.** The splash art is made in
      Figma. Export a static PNG/JPG to `public/og/`, then pass `image` and
      `imageAlt` to the map page. Keep it static — `@vercel/og` and a
      serverless/edge function are deferred; the page is `output: 'static'`.
- [ ] **Write the final map meta description** (user will provide the copy),
      then pass it to `<BaseLayout description={...}>` on `/map`.
- [ ] **Align the visible Event Hours with the JSON-LD.** The map `Event`
      schema uses 10:00–15:00 WIB (user-confirmed), but `ui.json` still shows
      `08:00–17:00 WIB` with doors 07:30 / last entry 16:30. Update the visible
      Info panel once those hours are confirmed.
- [ ] **Post-launch indexing verification:** confirm production
      `X-Robots-Tag` is absent (previews stay noindexed), validate the deployed
      OG card with Facebook/LinkedIn, run Rich Results Test on the Event
      JSON-LD, and check the Lighthouse SEO score.

## Parked from `todo-polish.md` (Sprint 2+ — do not execute unprompted)

Sections **§3–§17** of `docs/todo-polish.md` are parked per user decision
(Nov 22): the todo was too broad; §18 (IA eye-flow + sidebar
unification) is the next sprint and ~90% of the visible value. When §18
lands and the user asks, resume in this order: §3/§4 (type + spacing) →
§6 (layout de-clunk leftovers) → §11 (radius) → §14/§17 (motion +
mini-interactions, now that reveal is installed) → §8 remainder →
§5 sweep → §10/§13/§15 (state architecture) → §16 (data layer for future
pages) → Verify pass.

Shadcn-dependent installs stay prompt-first (see the rule below).

## Mobile day switching — open design decision (prompt the user first)

The mobile sheet has no day picker, and the planned mobile brand header
was **deleted** (user decision: a brand header clutters the viewport; the
brand lockup returns later as a View Transitions *shared element* that
sweeps into the map during the skeleton/map-loading pass — §16-C — never
as a header).

Open question (needs the user before implementing): **where does day
switching live on mobile?** Likely shape: a day control inside the sheet's
home tab (near the live-session card), not a header. Until decided, day
switching stays desktop-only.

Also parked here: any polish item that needs a shadcn registry install
(`npx shadcn add …`) — registry access works (components.json exists), but
each install is a dependency + file churn decision to make explicitly.
Prompt the user before pulling more FF components beyond what's vendored.
