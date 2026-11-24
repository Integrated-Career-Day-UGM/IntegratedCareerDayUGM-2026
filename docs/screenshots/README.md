# Screenshots

Screenshots captured during development (browser captures, map renders,
Figma exports) live here — never in the repository root.

## Layout

```text
docs/screenshots/
  inbox/        Raw captures, straight from a tool or agent. LOCAL ONLY.
  reference/    Curated design references that guide implementation.
```

`inbox/` is gitignored. Captures there never reach the remote repo and are
not shared with clones. Only `reference/` is committed.

## Rules for AI agents

1. Save new captures directly into `inbox/`. Never write images to the repo
   root — the `.gitignore` blocks root-level images on purpose.
2. Name files `<subject>-v<N>.png` (for example `current-map-v8.png`) or
   `<source>-<subject>.png` (for example `figma-denah-page.png`).
3. During a triage pass, promote the one file that still matters into
   `reference/` and delete the superseded iterations. Never commit the whole
   inbox.
4. `reference/` is the long-term visual source of truth. Keep it small:
   one file per design intent, not one per attempt.
5. When a design is implemented, link the reference file from the relevant
   TODO entry or PR description so reviewers can compare.
