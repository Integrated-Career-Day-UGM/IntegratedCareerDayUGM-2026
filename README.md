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

## Table of contents

- [About](#about)
- [Why Astro](#why-astro)
- [Scope: read-only site](#scope-readonly-site)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Dependencies](#dependencies)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Architecture rules](#architecture-rules)
- [Team workflow and ownership](#team-workflow-and-ownership)
- [Working with AI agents](#working-with-ai-agents)
- [Code quality](#code-quality)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Security](#security)
- [Releases](#releases)
- [Contributing](#contributing)
- [License](#license)

## About

Integrated Career Days is a public web platform for the UGM ICD 2026 event. It centralizes everything a visitor needs: the event schedule, participating companies and their booths, career activities, the registration flow, announcements, recap videos, and an interactive venue map.

Built with **Astro**, **TypeScript**, and **Tailwind CSS**, it ships mostly static HTML and mounts interactive islands only where the UI needs them (the venue map, search, and day tabs). The architecture follows a modular, layered structure that supports parallel development, code reusability, and seamless collaboration across developers and AI coding agents.

## Why Astro

This is a content-driven campaign site: landing page, sponsors, moments gallery, registration flow, FAQ, schedule, and one interactive map. That workload matches Astro's strengths, not a full server-rendered React framework. See `docs/decisions/ADR-001-astro-over-nextjs.md` for the full reasoning.

- **Static by default**: roughly 80% of the design (hero, "What's Inside", presenting companies, sponsors, moments, registration flow) is plain content. Astro compiles those `.astro` components to zero client-side JavaScript.
- **Islands for interactivity**: only the venue map, company search, and day tabs are interactive. Each is a React island mounted with `client:*` directives inside `src/islands`.
- **Faster builds and payloads**: no server framework overhead and no hydration cost on static content, which improves the Lighthouse scores the organizers care about for a public page.
- **Content collections**: companies, FAQ, sponsors, and schedule entries live in `src/content` and are validated with Zod schemas at build time. That is how the site gets its data — authored locally, baked into the build, not fetched at runtime.

## Scope: read-only site

The v1 site is **one-way**: it presents information and lets a visitor browse and filter it. There is no backend, no accounts, and no data written back to a server. To keep the scaffold free of speculative structure, the following were deliberately left out and are added **only when a real need appears** (tracked in `docs/decisions/ADR-002-remove-persistence-scaffolding.md`):

- API endpoints, webhooks, route handlers, and the Next.js-style Server Actions they replaced.
- Client-side data fetching and its server-state cache (TanStack Query) — there is nothing to fetch.
- Long-form MDX/markdown pages — the design has no article or blog surface.
- API mocking (MSW) — no calls to mock.

When the platform grows authenticated mutations, remote data, or webhook integrations, switch `output` to `hybrid`/`server`, add `src/pages/api`, reintroduce the data-fetching stack, and record the decision in `ADR-002` or a new ADR. Do not add them preemptively.

## Project structure

```text
Integrated-Career-Day-2026/
  .agents/                     # AI agent workspace
    prompts/                   # Prompt templates for UI and feature generation
    skills/                    # Agent skills, including animation and design
    rules.md                   # Coding rules and import restrictions
    architecture-graph.json    # Allowed dependencies, used to detect import violations
  .github/
    workflows/                 # CI/CD pipelines (ci.yml, codeql.yml)
    dependabot.yml             # Automated dependency updates
  docs/
    decisions/                 # Architecture decision records (ADR)
      ADR-001-astro-over-nextjs.md
      ADR-002-remove-persistence-scaffolding.md
    ownership/                 # Who owns which feature or component
    screenshots/               # Captured UI references: inbox/ for raw, reference/ for curated
    assets/
      fonts/                   # Source font files; served copies live in public/fonts
  e2e/                         # Playwright tests, isolated from src/
    fixtures/                  # Test data and setup
    page-objects/              # Page Object Models
    specs/                     # One spec file per user journey
  public/                      # Fonts, icons, images, video thumbnails
  src/
    pages/                     # Layer 1: file-based routing only, no logic
      index.astro              # Landing page
      404.astro                # Not-found page
      [slug].astro             # Dynamic company / session pages built from content
    layouts/                   # Shared HTML shells (BaseLayout, content layout)
    views/                     # Layer 2: page composition, no business logic
    features/                  # Layer 3: closed domain modules, one owner per feature
      _template/               # Copy this to start a new feature
        components/            # UI used only by this feature
        hooks/                 # UI logic hooks, no data fetching
        schemas/               # Zod schemas for forms and payloads
        store/                 # Feature-local Zustand store (only if cross-component state is needed)
        types/                 # Internal types
        index.ts               # Public API of the feature
    components/                # Layer 4: design system
      ui/                      # Design-system primitives (Fluid Functionalism kit)
        button/                # button.astro or button.tsx, button.variants.ts, button.test.tsx, index.ts
        input/
        modal/
      layout/                  # Header, footer, site shell
        header/
        footer/
        not-found-content/
      shared/                  # Components reused by more than one feature
    islands/                   # React/Vue/Svelte client components mounted with client:*
      venue-map/               # Interactive venue map (heaviest island)
      search/                  # Company / venue search field
      day-tabs/                # Today / Tomorrow switch for the schedule
    hooks/                     # Shared React hooks (app hooks + Fluid Functionalism kit)
    content/                   # Astro Content Collections (companies, FAQ, sponsors, sessions)
    stores/                    # Global Zustand stores for islands, only when cross-island state is proven
    styles/                    # Layer 5: Tailwind v4 and design tokens
      tokens/                  # Colors, spacing, radius, typography, shadows
      base/                    # Global base styles
      globals.css              # Main CSS entry point, imports Tailwind and all tokens
    lib/                       # Layer 6: infrastructure
      telemetry/               # Monitoring wrappers
      utils/                   # Helpers such as cn()
    config/                    # Environment variable validation with Zod
    types/                     # Shared TypeScript types
    test/                      # Shared test infrastructure
      setup.ts                 # Vitest setup: jest-dom matchers
      test-utils.tsx           # Custom render function
  package.json                 # Dependencies and scripts
  package-lock.json            # Committed lockfile (generated on first install)
  .npmrc                       # save-exact and engine-strict
  .nvmrc                       # Pinned Node.js version
  .env.example                 # Environment variable template
  astro.config.mjs             # Astro integrations and site URL
  tsconfig.json                # TypeScript config, strict and path alias @/*
  vite.config.ts               # Vitest config for islands
  playwright.config.ts         # E2E config
  eslint.config.mjs            # Flat ESLint config (JS/TS/astro)
  prettier.config.mjs          # Formatting, with Tailwind class sorting
  README.md                    # This file
  AGENTS.md                    # Entry point for AI agents
```

Border radius tokens live in `src/styles/tokens/radius.css`. All other style values follow the same rule: one token file per category.

## Tech stack

| Area | Tool | Purpose |
| --- | --- | --- |
| Framework | Astro 5 | Static-first pages, content collections, islands architecture |
| UI language | `.astro` components | Server-rendered, zero client JS by default |
| Interactive islands | React 19 + `@astrojs/react` | Mounts islands in `src/islands` with `client:*` directives |
| Data | Astro Content Collections | Typed, build-time validated content; no runtime API in v1 |
| SEO | `@astrojs/sitemap` | Generates `sitemap-0.xml` from routes and content collections |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | CSS-first utility styling driven by design tokens |
| Variants | class-variance-authority | Typed component variants bound to tokens |
| Class helpers | clsx + tailwind-merge | Safe merging of conditional classes |
| App state | Zustand | Client state for islands; default to React state, add Zustand only for cross-island state |
| Validation | Zod | Content collections, forms, and environment variables |
| Animation | Motion (framer-motion successor) | Page and island transitions |
| Video embed | `react-youtube` | YouTube embeds in the Moments and About sections |
| Unit tests | Vitest and Testing Library | Tests for islands and shared logic |
| E2E tests | Playwright | Browser tests in `e2e/` |
| Quality | ESLint (flat), `astro check`, Prettier | Static linting and type checking of `.astro`, `.ts`, `.tsx` |
| CI/CD | GitHub Actions | Install, audit, lint, typecheck, astro check, test, build, and E2E |

## Dependencies

Runtime:

- `astro`
- `@astrojs/react`, `@astrojs/sitemap`
- `react`, `react-dom`
- `zustand`
- `zod`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `motion`
- `react-youtube`

Dev / tooling:

- `@astrojs/check`, `astro-eslint-parser`, `eslint-plugin-astro`
- `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-jsx-a11y`, `globals`
- `prettier`, `prettier-plugin-astro`, `prettier-plugin-tailwindcss`
- `tailwindcss`, `@tailwindcss/vite`
- `typescript`
- `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `@playwright/test`

Video embed: the design embeds event recap videos and company intros. YouTube is used as the canonical source and the client-facing embed goes through `react-youtube`. There is no Mux or self-hosted player at this stage; if that changes, update this section and add a new ADR.

Deliberately **not** included in v1 (see the [Scope](#scope-readonly-site) section and `ADR-002`): `@astrojs/mdx`, `@tanstack/react-query`, and `msw`. They are reintroduced only alongside a real backend.

## Getting started

### Prerequisites

- Git
- Node.js, using the version defined in `.nvmrc` (22+)
- npm, bundled with that Node.js version

If you use nvm, run `nvm use` in the repository root to switch to the correct version.

### Clone the repository

```bash
git clone https://github.com/Erwdev/Integrated-Career-Day-2026.git
cd Integrated-Career-Day-2026
```

### Install dependencies

The very first install uses `npm install` because no `package-lock.json` is committed yet. Once the initial PR lands, the lockfile is committed and every install thereafter uses `npm ci`:

```bash
npm ci
```

`npm ci` installs exactly what is recorded in `package-lock.json` and fails if the lockfile and `package.json` disagree. This keeps installs reproducible and makes sure the reviewed, patched dependency versions are the ones that run on your machine and in CI.

Use `npm install` only when you intentionally add or update a dependency, then commit the updated `package-lock.json` in the same pull request.

### Configure environment variables

Astro only exposes variables prefixed with `PUBLIC_` to the client through `import.meta.env`. There is no API and no server secret in v1.

```bash
cp .env.example .env
```

| Name | Description | Required |
| --- | --- | --- |
| `PUBLIC_APP_URL` | Public base URL of the site (feeds `site` in `astro.config.mjs`, sitemap, canonical URLs) | Yes |
| `PUBLIC_FEATURED_VIDEO_ID` | YouTube video ID for the event recap, if any | No |

Environment variables are validated at build and dev startup with Zod in `src/config`. The build fails fast if a required variable is missing or invalid. Never commit `.env` or real secrets.

### Run the development server

```bash
npm run dev
```

Open http://localhost:4321 in your browser. Astro's dev server watches `src/pages`, `src/layouts`, `src/content`, and `src/islands`.

### Build and preview for production

```bash
npm run build
npm run preview
```

`npm run preview` serves the static `dist/` output on port 4321. This is what E2E tests run against.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Astro dev server on http://localhost:4321 |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Serve the `dist/` build locally |
| `npm run astro` | Run the Astro CLI directly (e.g. `npm run astro add <integration>`) |
| `npm run check` | `astro check` — type and template validation across `.astro`, `.ts`, `.tsx` |
| `npm run typecheck` | `tsc --noEmit` — pure TypeScript compiler check |
| `npm run lint` | Run ESLint (flat config) |
| `npm run lint:fix` | Run ESLint with autofix |
| `npm run format` | Run Prettier on the repo, including `.astro` files and Tailwind class sorting |
| `npm run format:check` | Fail if Prettier would change anything |
| `npm run test` | Run unit tests once with Vitest |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run Playwright end-to-end tests against the built site |

## Architecture rules

These rules apply to every contributor and every AI agent. They are enforced by review, ESLint import rules, and `astro check`.

1. `src/pages` contains routing only. Each `.astro` file composes a view from `src/views` and renders nothing else. No inline logic beyond what Astro needs for props and static imports.
2. `src/views` composes features and shared components. It contains no business logic.
3. `src/features/<name>` is a closed module with a public API through `index.ts`. A feature must not import from another feature. Share code through `src/components/shared` or `src/lib` instead.
4. `src/islands` is the **only** place framework components live. `.astro` files import islands with a `client:*` directive (`client:idle`, `client:visible`, `client:load`) based on how soon the island must become interactive.
5. `src/components/ui` holds design system primitives. Each component has its own folder with its component file, variants file, test file, and `index.ts`. Use `.astro` for pure presentation and `.tsx` only when the component is stateful.
6. Styling values come only from tokens in `src/styles/tokens`. Do not hardcode colors, spacing, font sizes, shadows, or border radius. Border radius tokens live in `src/styles/tokens/radius.css`.
7. Default to local React state inside a single island. Reach for Zustand (`src/stores` or `src/features/<name>/store`) only when state genuinely must be shared across components or islands. Avoid React Context unless a library requires it.
8. All page data comes from Astro Content Collections in `src/content`, validated at build time with Zod schemas in `src/content.config.ts`. There is no runtime API in v1; do not add client-side fetching or an API client until a backend exists (see `ADR-002`).
9. Before creating a new component, search `src/components/ui` and `src/components/shared` for an existing one. Do not duplicate.
10. Validate every input with Zod: content collection schemas in `src/content.config.ts`, form payloads in `src/features/<name>/schemas`, and environment variables in `src/config`.
11. This site is one-way: no server endpoints, webhooks, or authenticated mutations exist. If a backend is added later, create `src/pages/api`, switch `output` to `hybrid`/`server`, reintroduce the data-fetching stack, and record it in `ADR-002` or a new ADR.
12. Images use Astro's built-in `<Image>` from `astro:assets`. Videos are embedded as iframes through `react-youtube` inside an island.

## Team workflow and ownership

The workflow follows the pre-agentic model: each person owns one unit of work, so changes rarely collide.

- One person owns one feature folder, one island, or one component folder.
- Ownership is recorded in `docs/ownership`. Update it when work is reassigned.
- Views in `src/views` are integration points. Only the integration owner edits them.
- Branch names: `feat/<name>`, `fix/<name>`, `chore/<name>`, `docs/<name>`, `test/<name>`.
- Commit messages follow Conventional Commits, for example `feat(venue-map): add zoom controls`.
- Every pull request has a clear scope, a linked issue, screenshots for visible UI changes, and passing checks. Keep pull requests small.

Start a new feature by copying the template:

```bash
cp -r src/features/_template src/features/<new-feature>
```

Then rename the module, update its `index.ts`, and add your name to `docs/ownership`. Do not add `api/` or `actions/` subfolders — this is a read-only site (see `ADR-002`).

## Working with AI agents

AI coding agents are welcome, within strict boundaries.

- `AGENTS.md` at the repository root is the entry point for every agent and links to `.agents/`.
- `.agents/rules.md` holds coding rules and import restrictions.
- `.agents/prompts/` holds approved prompt templates for generating UI and features.
- `.agents/skills/` holds agent skills, including animation and design-engineering playbooks.
- `.agents/architecture-graph.json` describes allowed dependencies so import violations can be detected.

Rules for agents and the people who drive them:

1. Work only inside the folder you own.
2. Check `src/components/ui`, `src/components/shared`, and `src/islands` before writing a new component.
3. Use tokens from `src/styles/tokens`. Never hardcode style values.
4. Run `npm run check`, `npm run lint`, `npm run format:check`, and the full test suite before committing.
5. Do not add dependencies, change the lockfile, or edit files outside your ownership without review.
6. Do not add interactivity to a `.astro` component that could stay static. Islands are opt-in and must be justified in the PR.
7. Do not reintroduce persistence scaffolding (API endpoints, server state, MDX, MSW) that was intentionally removed. Follow `ADR-002`.

## Code quality

Run lint:

```bash
npm run lint
```

Run the Astro type and template check (this is the primary signal across `.astro`, `.ts`, `.tsx`):

```bash
npm run check
```

Run the pure TypeScript compiler check:

```bash
npm run typecheck
```

Run the formatter and the check together:

```bash
npm run format && npm run format:check
```

## Testing

| Type | Location | Tooling |
| --- | --- | --- |
| Island and unit tests | Next to the source file, for example `button.test.tsx` | Vitest, Testing Library |
| Pure `.astro` component tests | Not applicable — validated by `astro check` and E2E | `astro check`, Playwright |
| Shared setup | `src/test/` | `setup.ts` loads jest-dom, custom render in `test-utils.tsx` |
| End-to-end tests | `e2e/specs/`, organized by user journey | Playwright against `astro preview` |
| Page objects and fixtures | `e2e/page-objects/` and `e2e/fixtures/` | Playwright |

Run unit tests:

```bash
npm run test
```

Run unit tests in watch mode:

```bash
npm run test:watch
```

Run end-to-end tests:

```bash
npm run test:e2e
```

The E2E script builds the site and serves it via `astro preview` on port 4321. `reuseExistingServer: true` in `playwright.config.ts` lets you keep a local server running to speed up iterations.

## CI/CD

Pipelines live in `.github/workflows`. The main workflow, `ci.yml`, runs on every pull request and on pushes to `main`. Jobs run in this order:

1. **Install**: `npm ci` using the committed lockfile.
2. **Audit**: `npm audit --audit-level=high` fails the build on unresolved high or critical vulnerabilities.
3. **Lint**: `npm run lint`.
4. **Typecheck**: `npm run typecheck`.
5. **Astro check**: `npm run check` — types, templates, and content collections.
6. **Unit tests**: `npm run test`.
7. **Build**: `npm run build` and upload the `dist/` artifact.
8. **End-to-end tests**: download `dist/`, start `astro preview`, run `npm run test:e2e`.

A pull request can be merged only when the `ci-passed` aggregate check is green. CodeQL runs separately in `codeql.yml`.

## Security

- `package-lock.json` is always committed and never ignored.
- Dependency versions are pinned exactly through `save-exact=true` in `.npmrc`.
- `engine-strict=true` in `.npmrc` makes installs fail on unsupported Node.js versions.
- CI runs `npm audit` on every pull request, plus `dependency-review-action` and CodeQL.
- Dependabot opens pull requests for npm packages and GitHub Actions.
- Astro produces a static build with no server, so the attack surface is minimal. Keep Astro and every `@astrojs/*` package on the latest patched release and review the official advisories before each campaign launch.
- Never commit secrets. Keep local values in `.env`, which is ignored by Git. Only `PUBLIC_*` variables may be exposed to the browser.
- Because v1 is read-only, there are no inputs to a server to protect. The moment any endpoint or authenticated mutation is added, validate its inputs with Zod, rate-limit it, and verify webhook HMAC signatures before doing anything else.

## Releases

Releases follow [Semantic Versioning](https://semver.org) and [Conventional Commits](https://www.conventionalcommits.org).

| Commit type | Version bump |
| --- | --- |
| `fix:` | Patch |
| `feat:` | Minor |
| `feat!:` or a `BREAKING CHANGE` footer | Major |

To cut a release:

1. Make sure `main` is green in CI.
2. Update `CHANGELOG.md` with the changes since the last release.
3. Update the version in `package.json` and commit.
4. Tag and publish:

```bash
git tag v0.1.0
git push origin v0.1.0
gh release create v0.1.0 --generate-notes
```

All releases are listed on the [Releases page](https://github.com/Erwdev/Integrated-Career-Day-2026/releases).

## Contributing

1. Open an issue or pick an existing one.
2. Confirm which folder you own in `docs/ownership`.
3. Create a branch from `main` using the naming convention above.
4. Build your change inside your own folder and follow the architecture rules.
5. Run `npm run lint`, `npm run typecheck`, `npm run check`, `npm run format:check`, and `npm run test`.
6. Open a pull request with a clear description and screenshots for UI changes.

## License

No license is declared yet. Add a `LICENSE` file before the first public release and update this section.
