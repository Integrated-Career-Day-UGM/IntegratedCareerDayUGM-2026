# Deferred `astro check` hints

`bun run check` runs `astro check --minimumSeverity warning`. Hints still exist,
they are only hidden from the output — errors and warnings still fail the run.
To see them again:

```sh
docker compose -f docker-compose.dev.yaml exec app bunx astro check --minimumSeverity hint
```

## Why the switch exists

All 52 hints in `src/components/ui/` come from the **Fluid Functionalism
registry kit** vendored into this repo (51 × `React.MutableRefObject` in React 19
types + the intentionally `@deprecated` `CardEyebrow`). They are not ours to
maintain; `astro check` has no per-folder severity filter, so the whole hint
tier is hidden rather than hand-editing 24 vendored files.

- [ ] **Tag for deletion:** when development winds down, delete
      `src/components/ui/*` if nothing in the live site references it. Check
      real usage first (`graphify query` / grep for `@/components/ui/`), not
      the folder's size. Until then, do not refactor these files.

## Deferred, not fixed

- [ ] `src/lib/analytics.ts:100` — ts(80006) `send(event)` may be declared
      `async` (body already returns a Promise). Left alone: it is a signature
      shape change in the analytics provider contract, not worth the risk yet.
- [ ] `src/components/ui/data-table.tsx:139` — ts(6133) `TValue` unused.
      **Do not touch:** it is a `@tanstack/react-table` module augmentation, so
      the type parameter arity must match upstream or the augmentation breaks.
- `src/components/ui/command-menu.tsx` — ts(6385) `keyCode` deprecated.
  **Keep:** `keyCode === 229` is the standard IME-composition guard; removing
  it breaks CJK input.
- `src/components/ui/card.tsx` — ts(6385) `CardEyebrow` deprecated. Expected:
  the export is deprecated on purpose and kept for existing callers.

## Fixed

- `navigator.platform` (2 sites) → `navigator.userAgent` regex. Same Mac test,
  no Chromium-only dependency.
- `document.execCommand("copy")` (3 sites) → kept as the synchronous fallback
  (the Clipboard API can be unavailable or denied), reached through a local
  type so the deprecation hint no longer tints the build.
