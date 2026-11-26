# Unfuck the Landing (dapid codegen dump → real implementation)

The `dapid/Website ICD` landing is a Figma "Save to Code" paste: every
element is absolutely positioned at raw pixel coords (`left-[833.17px]`,
`h-[212.226px]`), every gradient serialized as an inline
`data:image/svg+xml` data-URI, `data-node-id` attrs still in the JSX, and
fixed 1440px canvases — which is why it dies on any viewport that isn't
desktop 1440px.

**We do NOT port that code.** We use it only as:
1. Copy source (all text verbatim),
2. Measurement reference (`data-node-id` → exact Figma node to
   `get_design_context` / `download_assets`),
3. Nothing else. No pixel coords, no data-URI SVGs travel over.

The implementation target is this repo's `src/views/landing/` Astro
sections (hero, intro, companies, bento, schedule, registration, faq,
map-preview, theme, sponsors, gallery — each with desktop + mobile
content files).

---

## Workflow per section (do one section at a time, hero first)

Order inside each section: **background → decoration → text**. Background
and floating art land as exported assets first; text/containers are real
HTML/CSS built on top of them.

### Step 1 — Background
- [ ] Reconstruct the section background as **plain CSS** wherever
      possible (radial/linear gradients are 1–3 lines of CSS, never an
      SVG blob).
- [ ] If the background has real art (texture, halftone, splatter),
      export it from Figma via `download_assets` to
      `public/landing/<section>/` (SVG for vectors, PNG for raster
      textures).

### Step 2 — Decoration (floating art / decals / stickers)
- [ ] **Export checklist — USER EXPORTS, NOT THE LLM.** List every
      decorative node in the section that cannot be modeled in CSS.
      For each: node id, what it is, suggested format (svg/png), and
      target path under `public/landing/<section>/`. **Always ask the
      user to export/download it themselves from Figma** (or supply a
      PNG) — do not trust the LLM to run `download_assets` properly
      and efficiently. Only fall back to MCP export if the user
      explicitly asks.
- [ ] When the user hands over files: confirm each is non-empty,
      dimensions look right, and aspect ratio is preserved.
- [ ] Place decorations as positioned `<img>`/inline assets with
      intentional bleed per AGENTS.md (exact angles, z-index stacking,
      edge offsets from Figma; `overflow-x: clip` only at the page
      wrapper, never on inner sections).

### Step 3 — Text + containers (real HTML/CSS)
- [ ] Transcribe copy verbatim from the codegen/Figma node.
- [ ] Build the layout with flex/grid in the section's
      `desktop-content.astro` / `mobile-content.astro` — inspect and
      implement **both** viewports from their own Figma frames; never
      shrink desktop CSS for mobile.
- [ ] Typography: match Figma values exactly (font family, size,
      weight, tracking, strokes/outline effects read from the Figma
      text layer, not guessed).
- [ ] No absolute pixel patchwork for content; only decorations float
      absolutely.

### Step 4 — Responsive adaptation
- [ ] Adapt decoration offsets to breakpoints (desktop → tablet →
      mobile), verified against the mobile Figma frame.
- [ ] Check horizontal scroll: page wrapper uses `overflow-x: clip`;
      no clipped art, no scrollbar.

---

## Decoration Debug Panel (build once, reuse per section)

LLMs keep getting decoration placement almost-right. Build a dev-only
debug panel to manually dial positions in the browser, then copy the
values back into code.

- [ ] **Toggle:** a dev-only hotkey / `?debug=deco` param (gated to
      `import.meta.env.DEV`) that enables the panel.
- [ ] **Per-decoration controls:** select any decoration element on the
      page (click-to-pick) and adjust:
  - position (x, y)
  - z-index
  - rotation (deg)
  - size (width / height, lock aspect ratio toggle)
- [ ] **Live preview:** changes apply instantly via inline styles while
      dragging/stepping; the underlying layout never shifts.
- [ ] **Copyable output:** a "Copy values" button that emits a
      ready-to-paste snippet (Tailwind arbitrary values or a style
      block), e.g. `left-[833px] top-[269px] z-[30] rotate-[-6deg] w-[460px]`
      — paste it straight into the section file.
- [ ] **Per-breakpoint state:** panel shows which breakpoint is active
      and stores a separate value set per breakpoint, so the copy output
      is already responsive-aware (desktop + mobile values).
- [ ] **Never shipped:** panel code is tree-shaken/stripped in prod
      builds.

---

## Section tracker

Order: hero → intro → companies/bento → schedule → registration →
map-preview → theme → faq → sponsors/gallery → footer. One section per
session — no batch- porting, no skipping ahead.

- [ ] hero — background / decoration / text / responsive
- [ ] intro — background / decoration / text / responsive
- [ ] companies + bento — background / decoration / text / responsive
- [ ] schedule — background / decoration / text / responsive
- [ ] registration — background / decoration / text / responsive
- [ ] map-preview — background / decoration / text / responsive
- [ ] theme — background / decoration / text / responsive
- [ ] faq — background / decoration / text / responsive
- [ ] sponsors / media partners / gallery — background / decoration /
      text / responsive
- [ ] footer — background / decoration / text / responsive

---

## Final pass — debloat (only after all sections land)

- [ ] **Orphaned asset sweep:** every file under `public/landing/` (and
      `public/images/`) must be referenced by runtime code. Grep each
      filename against `src/`; anything unreferenced is orphaned slop —
      delete it (the dapid-style habit of exporting "just in case"
      assets must not carry over).
- [ ] **No slop formats:** no inline `data:image/svg+xml` data-URIs
      anywhere in section code, no hand-drawn SVG recreations of Figma
      art, no duplicate exports of the same node.
- [ ] **Dead code sweep:** unused section components, leftover
      placeholder scaffolds, unused fonts/weights.
- [ ] Final verify: typecheck, both viewports, no horizontal scroll, no
      orphan files.
