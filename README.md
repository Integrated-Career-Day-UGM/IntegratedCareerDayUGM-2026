# Integrated Career Day

[![Release](https://img.shields.io/github/v/release/Erwdev/Integrated-Career-Day-2026?style=flat-square&label=release)](https://github.com/Erwdev/Integrated-Career-Day-2026/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/Erwdev/Integrated-Career-Day-2026/ci.yml?style=flat-square&label=ci)](https://github.com/Erwdev/Integrated-Career-Day-2026/actions/workflows/ci.yml)
[![Last commit](https://img.shields.io/github/last-commit/Erwdev/Integrated-Career-Day-2026?style=flat-square)](https://github.com/Erwdev/Integrated-Career-Day-2026/commits)

![Astro](https://img.shields.io/badge/Astro-5-BC52EE?style=flat-square&logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-Islands-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Content Collections](https://img.shields.io/badge/Content_Collections-BC52EE?style=flat-square)
![Zustand](https://img.shields.io/badge/Zustand-433E38?style=flat-square)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)
![Motion](https://img.shields.io/badge/Motion-005ff9?style=flat-square)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)

## Getting started

Requires Node 22 (`.nvmrc`) and Docker.

```bash
git clone https://github.com/Erwdev/Integrated-Career-Day-2026.git
cd Integrated-Career-Day-2026
cp .env.example .env   # PUBLIC_APP_URL is required, the rest are optional
docker compose -f docker-compose.dev.yaml up
```

The dev server runs **in the container** on http://localhost:4321 — never on the host (see `AGENTS.md`). One-off scripts run inside it:

```bash
docker compose -f docker-compose.dev.yaml exec app npm run <script>
```

The container image runs `bun install` on build; use `npm install` on the host only when intentionally changing dependencies, then commit the updated `package-lock.json`.

Environment variables are validated at startup with Zod (`src/config`) — the build fails fast on a missing `PUBLIC_APP_URL`. Only `PUBLIC_*` variables reach the client; never commit `.env`. See `.env.example` for the full list (analytics endpoint, PostHog).

Production build: `npm run build` then `npm run preview` (run through `docker compose exec app …`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Astro dev server on http://localhost:4321 |
| `npm run build` / `preview` | Build static site to `dist/` / serve it |
| `npm run check` | `astro check` — types, templates, content (primary signal) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint (flat config) |
| `npm run format` / `format:check` | Prettier, incl. `.astro` + Tailwind class sorting |
| `npm run test` / `test:watch` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E against the built site |

## Project structure

```text
Integrated-Career-Day-2026/
  .agents/                     # AI agent workspace (prompts, skills, rules.md)
  .github/workflows/           # CI (ci.yml), CodeQL (codeql.yml), dependabot
  docs/                        # Product and process records
    PRODUCT.md                 # Confirmed product truth (impeccable init)
    PRD.md                     # Product requirements
    BACKLOG.md / TODO.md / todo-polish.md  # Work tracking
    decisions/                 # ADR-001 (Astro over Next.js), ADR-002 (no persistence)
    ownership/                 # Who owns which feature
    screenshots/               # UI references: inbox/ raw, reference/ curated
    assets/fonts/              # Source font files (served copies in public/fonts)
  e2e/                         # Playwright: fixtures/, page-objects/, specs/
  public/                      # Fonts, icons, images
  src/
    pages/                     # Layer 1: routing only
      index.astro              # Landing page (currently redirects to /map)
      map.astro                # Interactive venue map page
      404.astro                # Not-found page
    layouts/                   # Shared HTML shells (BaseLayout)
    views/                     # Layer 2: page composition, no business logic
      landing/                 # Landing composition (scaffolded, empty)
    features/                  # Layer 3: closed domain modules, one owner each
      _template/               # Copy to start a new feature
        components/  hooks/  schemas/  store/  types/  index.ts
      sponsors/  gallery/  schedule/  registration/  faq/  companies/
                               # Landing sections (scaffolded, empty)
    components/                # Layer 4: design system
      ui/                      # Fluid Functionalism kit + primitives
      layout/                  # Site shell
      shared/                  # Reused by more than one feature
      map/                     # Map widgets (zoom, compass, tooltip)
    islands/                   # React islands mounted with client:* directives
                               # MapLibreMap, MapSidebar, MobileBottomSheet,
                               # VenueList, BoothDetail, TrackSwitcher, …
    hooks/                     # Shared React hooks (app + Fluid Functionalism)
    content/                   # Astro Content Collections (placeholder)
    stores/                    # Zustand stores for islands (mapStore)
    styles/
      base/global.css          # Main CSS entry: tokens + base styles
      tokens/                  # Reserved for split token files
    lib/                       # Infrastructure (telemetry/, utils/)
    config/                    # Env variable validation with Zod
    types/                     # Shared types
    test/                      # Vitest setup (jest-dom matchers)
  docker-compose.dev.yaml      # Dev container (see Getting started)
  astro.config.mjs · tsconfig.json · vitest.config.ts · playwright.config.ts
  eslint.config.mjs · prettier.config.mjs · .nvmrc (Node 22)
```

## Tech stack

| Area | Tool | Purpose |
| --- | --- | --- |
| Framework | Astro 5 | Static-first pages, islands architecture |
| Interactive islands | React 19 + `@astrojs/react` | Mounted in `src/islands` with `client:*` |
| State | Zustand | Client state for islands; default to React state |
| Validation | Zod | Content schemas, forms, environment variables |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | CSS-first utilities driven by design tokens |
| Class helpers | clsx + tailwind-merge | Safe merging of conditional classes |
| Animation | Motion | Island transitions (Fluid Functionalism springs) |
| Unit tests | Vitest + Testing Library | Islands and shared logic |
| E2E | Playwright | Browser tests in `e2e/` |
| Quality | ESLint (flat), `astro check`, Prettier | Linting and type checking |
| CI/CD | GitHub Actions | Install, audit, lint, check, test, build, E2E |

Deliberately not included in v1 (see `ADR-002`): `@astrojs/mdx`, `@tanstack/react-query`, `msw` — reintroduced only alongside a real backend.

## Architecture rules

Enforced by review, ESLint import rules, and `astro check`.

1. `src/pages` contains routing only; each `.astro` file composes a view from `src/views` and renders nothing else.
2. `src/views` composes features and shared components; no business logic.
3. `src/features/<name>` is a closed module with a public API through `index.ts`. Features must not import each other — share through `src/components/shared` or `src/lib`.
4. `src/islands` is the only place framework components live. `.astro` files mount islands with `client:*` (`client:idle`, `client:visible`, `client:load`) based on how soon interactivity is needed.
5. `src/components/ui` holds design-system primitives. Use `.astro` for pure presentation, `.tsx` only when stateful. Search existing components before writing a new one.
6. Style values come only from tokens in `src/styles`. Never hardcode colors, spacing, font sizes, shadows, or radii.
7. Default to local React state inside a single island; Zustand only for cross-island state.
8. Event content is JSON-driven (`src/data/ugm-icd-2026/`) and editable without code changes. No client-side fetching or API client until a backend exists.
9. Validate every input with Zod: content schemas, form payloads (`src/features/<name>/schemas`), env vars (`src/config`).
10. This site is read-only: no server endpoints, webhooks, or authenticated mutations. If a backend is added later, create `src/pages/api`, switch `output` to `hybrid`/`server`, and record it in a new ADR.
11. Images use Astro's `<Image>` from `astro:assets`; videos embed through `react-youtube` iframes.

## Team workflow

- One person owns one feature folder, island, or component folder; ownership lives in `docs/ownership/`.
- `src/views` are integration points — only the integration owner edits them.
- Branches: `feat/`, `fix/`, `chore/`, `docs/`, `test/`. Commits follow Conventional Commits (e.g. `feat(venue-map): add zoom controls`).
- Every PR: clear scope, linked issue, screenshots for visible UI changes, passing checks, small size.

## Working with AI agents

`AGENTS.md` (repo root) is the entry point: process/container rules, documentation map, and the Figma workflow. `.agents/` holds coding rules, prompts, skills, and the architecture graph for import-violation checks. Agents work inside the folders they own, reuse existing components and tokens, and never change the lockfile or files outside their ownership without review.

## Testing

| Type | Location | Tooling |
| --- | --- | --- |
| Island / unit tests | Next to the source (`*.test.tsx`) | Vitest + Testing Library |
| Shared setup | `src/test/` (`setup.ts`, `test-utils.tsx`) | jest-dom matchers |
| E2E | `e2e/specs/` per user journey | Playwright against `astro preview` |

E2E builds the site and serves it via `astro preview` on port 4321; `reuseExistingServer: true` lets you keep a local server running between iterations.

## CI/CD

`ci.yml` runs on every PR and push to `main`, in order: install (`npm ci`) → `npm audit` (high/critical fails) → lint → typecheck → `astro check` → unit tests → build (uploads `dist/`) → E2E against the artifact. A PR merges only when the aggregate `ci-passed` check is green. CodeQL runs separately in `codeql.yml`; Dependabot watches npm packages and Actions.

## Releases

Semver + Conventional Commits: `fix:` → patch, `feat:` → minor, `feat!:`/breaking footer → major. To cut a release: green `main`, update `CHANGELOG.md`, bump `package.json`, tag, publish:

```bash
git tag v0.1.0
git push origin v0.1.0
gh release create v0.1.0 --generate-notes
```

## Security

- `package-lock.json` is committed; versions are pinned exactly (`save-exact` in `.npmrc`, `engine-strict` on Node).
- CI audits every PR; CodeQL and Dependabot run continuously.
- The static build has no server surface. If an endpoint or authenticated mutation is ever added: validate inputs with Zod, rate-limit, and verify webhook HMAC signatures first.

## Contributing

1. Pick or open an issue; confirm your folder in `docs/ownership/`.
2. Branch from `main`, build inside your own folder, follow the architecture rules.
3. Run `npm run lint`, `typecheck`, `check`, `format:check`, `test` (in the container).
4. Open a PR with a clear description and screenshots for UI changes.

## License

No license declared yet — add one before the first public release.
