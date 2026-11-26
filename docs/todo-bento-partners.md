# Todo — Bento, Presenting Companies, Media Partners

Source of truth for logos: Figma `Bol9R2faeoBcCLXRAEc0Xd`.

## 1. Shared logo system — done
- [x] `LogoBox` component (`src/views/landing/sections/bento/LogoBox.tsx`), PNG prop.
- [x] Logo data file (`bento/logos.ts`) — swap `src` values when the final PNG pack arrives.
- [x] Existing Companies logo grid now uses `LogoBox`.

## 2. "What's Inside?" bento — done
- [x] `bento.astro` dark Figma surface + "What's Inside?" heading.
- [x] Reusable card styling (18px radius, `#1c1c1c`, `#393939` border).
- [x] Cards: Walk-in Interview, Career Counseling, Games, Company Presentation, Career Expo, Motion+, Display Experience.
- [x] CTAs wired to `/map/#zone=...` and `/#rundown`.
- [x] Scroll-driven Career Expo marquee (3 columns) using `LogoBox`.
- [x] Mobile breakpoint: 2-column bento matching the 390px screenshot.

## 3. Presenting Companies (node 2062:165) — scaffolding done
- [x] Data-driven `presenting-companies.astro` logo wall using `LogoBox`.
- [ ] Replace placeholder logo sources with the final company PNG pack (edit only `bento/logos.ts`).
- [ ] If the exact absolute composition is required, map the Figma coordinates into a desktop-only layout.

## 4. Media Partners (nodes 1992:3730, 1992:3729) — done
- [x] Exported UGM Online and Komap PNGs to `public/landing/partners/`.
- [x] `media-partners.astro` strip using `LogoBox`.
- [x] Responsive mobile layout.

## 5. Verification
- [x] `bun run typecheck`.
- [ ] Browser check at 1440px and 390px (desktop + mobile bento, marquee, logo walls).
