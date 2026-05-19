# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npx next dev --port 3000 --hostname 0.0.0.0   # Dev server (Turbopack)
npx next build                                  # Production build
npx next lint                                   # ESLint
```

Kill stuck dev server: `pkill -f "next dev"; sleep 2; fuser -k 3000/tcp`

## Architecture

**Stack:** Next.js 16.1.6 (App Router, Turbopack), React 19, TypeScript strict, Zustand 5, Recharts 3.7, Tailwind CSS 4 (OKLCH color space), Radix UI, Lucide icons.

**Path alias:** `@/*` → `./src/*`

### App Structure

- `src/app/(dashboard)/` — All authenticated pages share a layout with sidebar + header
  - **Agent pages** (all users): `dashboard/`, `resultats/`, `performance/`, `comparaison/`, `saisie/`, `formation/`, `objectifs/`
  - **Manager pages** (`manager/`): `cockpit/`, `gps/`, `equipe/`, `classement/`, `formation-collective/`
  - **Directeur pages** (`directeur/`): `pilotage/`, `equipes/`, `performance/`, `pilotage-financier/`, `formation-collective/`, `conseiller/[id]/`
  - **Coach pages** (`coach/`): `dashboard/`, `targets/[type]/[id]/`, `targets/[type]/[id]/plan/`, `cockpit/`
  - **Réseau pages** (`reseau/`): `dashboard/`, `agence/` (detail via `?id=xxx`)
  - Each role section has a layout guard redirecting unauthorized users to `/dashboard`
- `src/app/(auth)/` — Login/register/welcome pages

### Role Hierarchy

```
reseau          → ["reseau"]                    (isolated, network-level)
directeur       → ["directeur", "manager", "conseiller"]
manager         → ["manager", "conseiller"]
coach           → ["coach"]                     (isolated, cross-org)
conseiller      → ["conseiller"]
```

- `UserRole = "conseiller" | "manager" | "directeur" | "coach" | "reseau"`
- `ProfileType = "INSTITUTION" | "MANAGER" | "AGENT" | "COACH" | "RESEAU"`
- Helper functions: `hasRole()`, `hasManagerAccess()`, `hasDirectorAccess()`, `hasCoachAccess()`, `hasNetworkAccess()`

### Organizational Hierarchy

```
Network (Réseau)
  └─ Institution (Agence)     — managed by directeur
       └─ Team (Équipe)       — managed by manager
            └─ Agent (Conseiller)
```

- **Network** (`src/data/mock-network.ts`): `{ id, name, institutionIds }` — groups multiple institutions
- **Institution** (`app-store.ts`): `{ id, name, inviteCode }` — single agency
- **TeamInfo** (`app-store.ts`): `{ id, name, institutionId, managerId, inviteCode }`
- User fields: `institutionId`, `teamId`, `managerId`

### State Management

- **Zustand store** at `src/stores/app-store.ts` — single global store for user, users, results, ratioConfigs, institutions, networks, coach data, financial data, view preferences
- `ViewId = "agent" | "manager" | "directeur" | "coach" | "reseau"` — sidebar view sections
- Role switching via `switchRole()` with permission guard
- `DEFAULT_ROUTES` maps each role to its landing page
- `deriveAvailableRoles()` computes role hierarchy fallback

### Key Types (`src/types/`)

- `user.ts` — `UserRole` (5 roles), `UserCategory` ("debutant" | "confirme" | "expert"), `User` interface
- `database.ts` — `DbProfile`, `DbOrganization`, `DbTeam`, `DbPeriodResult` (Supabase row types)
- `ratios.ts` — `RatioId` (7 business ratios), `RatioConfig`, `ComputedRatio`
- `results.ts` — `PeriodResults` with prospection, vendeurs, acheteurs, ventes data
- `objectives.ts` — `ObjectiveBreakdown` for GPS funnel calculation
- `formation.ts` — `FormationDiagnostic`, `FormationRecommendation`
- `coach.ts` — `CoachAssignment`, `CoachAction`, `CoachPlan`, `CoachNote`, `CoachSession`
- `finance.ts` — `FinancialData`, `FinancialFieldId`

### Business Logic (`src/lib/`)

- `ratios.ts` — `computeRatioValue()`, `computeAllRatios()`, `determineRatioStatus()`
- `objectifs.ts` — `calculateObjectiveBreakdown()` funnel from CA → estimations → mandats → visites → offres → compromis → actes
- `formation.ts` — `generateFormationDiagnostic()` maps weak ratios to training areas
- `export.ts` — Role-based Excel export with field selection, multi-sheet structure, 6 scopes (mes-donnees, mon-equipe, mon-agence, detail-collaborateurs, client-coach, portefeuille-coach, mon-reseau, reseau-detail-agences)
- `guided-tour.ts` — Role-based tour steps (conseiller 6, manager 6, directeur 6, coach 4, réseau 4), localStorage persistence
- `coach.ts` — `getCoachScopeUserIds()`, diagnostic/alert generation, coaching plan generation
- `finance.ts` — Revenue, commissions, breakeven analysis
- `aggregate-results.ts` — YTD aggregation of monthly results
- `constants.ts` — `CATEGORY_LABELS` (Junior/Confirmé/Expert), `CATEGORY_OBJECTIVES`, `GPS_THEME_LABELS`

### Hooks (`src/hooks/`)

- `use-user.ts` — current user + category from store
- `use-results.ts` — `useResults(userId?)` and `useAllResults()`
- `use-ratios.ts` — `useRatios()` returns computedRatios + ratioConfigs
- `use-director-data.ts` — `useDirectorData()` — team aggregation, org-wide stats (`TeamAggregate`, `OrgStats`)
- `use-network-data.ts` — `useNetworkData()` — cross-agency aggregation (`AgencyAggregate`, `NetworkStats`, `TopPerformer`, alerts)
- `use-agency-gps.ts` — `useAgencyGPS()` — theme, period, GPS, overview, entityBars
- `use-coach-data.ts` — `useCoachData()` — portfolio clients, summaries, priorities
- `use-team-gps.ts` — Team-level GPS for managers
- `use-ytd-results.ts` — Year-to-date aggregated results

### Mock Data (`src/data/`)

- `mock-users.ts` — 12 users: 1 directeur (also has reseau+coach roles), 2 managers, 8 agents, 1 coach (org-demo)
- `mock-network.ts` — 7 Lyon users (org-demo-2), 1 réseau admin, Network type, Jan+Feb results, institution
- `mock-results.ts` — Feb 2026 + Jan 2026 results for org-demo users
- `mock-ratios.ts` — Default ratio thresholds per category
- `mock-coach.ts` — Coach assignments, actions, plans, notes, sessions
- `mock-finance.ts` — Financial input data
- Demo mode: 2 months (Jan + Feb 2026), 20 users, 2 institutions, 5 teams, 1 network

### Components

- `components/layout/` — Sidebar (icon-based, sections by role with `managerOnly`/`directorOnly`/`coachOnly`/`networkOnly` flags), Header (view toggle, import/export, theme, notifications), MobileSidebar
- `components/charts/` — LineChart, BarChart, DonutChart, ProgressBar, ComparisonBarChart (all Recharts wrappers)
- `components/dashboard/` — KpiCard (with optional onExpand for drill-down chart)
- `components/export/` — ExportModal with field selection checkboxes
- `components/tour/` — GuidedTour overlay with SVG mask highlight
- `components/ui/` — Radix-based primitives

## Important Conventions

- **French UI language** — Always use real characters (é, è, à, ç). NEVER unicode escape sequences (\u00e9).
- **"Junior" not "Débutant"** — The label for `debutant` category is "Junior" everywhere (set in `src/lib/constants.ts` CATEGORY_LABELS).
- **7 ratios only** — `delai_moyen_vente` was removed. Do not re-add it.
- **5 roles** — `conseiller`, `manager`, `directeur`, `coach`, `reseau`. Do not add roles without updating all related systems (types, store, sidebar, export, guided tour, register page).
- **Objectifs page** uses `NiveauChoice = UserCategory | "actuel"` — "actuel" overrides thresholds with real performance values from `useRatios()`.
- Mock data in `src/data/mock-*.ts` — all data is client-side mock; no API calls yet.
- Sidebar navigation defined in `src/components/layout/sidebar.tsx` with role flags for route filtering.

## Product Vision

NXT Performance is a performance cockpit for real estate agents, managers, directors, coaches, and networks.

Primary goals:
- Visualize business performance clearly
- Identify weak ratios quickly
- Guide training priorities
- Help managers coach based on objective metrics
- Enable multi-agency network piloting

This is not a generic analytics tool.
It is a performance transformation tool.

---

## Decision Principles

When adding features:

1. Must improve decision clarity.
2. Must reduce cognitive load.
3. Must reinforce the 7 core ratios.
4. Must not add unnecessary complexity.

Data hierarchy:
- KPIs
- Ratios
- Drill-down
- Training action

If a feature does not improve performance understanding, it should not be added.

---

## Technical Guardrails

- No backend until Supabase phase.
- No additional state library.
- No UI framework beyond Radix + Tailwind.
- Avoid premature abstraction.
- Prefer simple pure functions in `src/lib/`.

All business logic must remain deterministic and testable.

---

## Future Architecture (Supabase Phase)

When integrating Supabase:

- Store users, networks, institutions
- Store results per period
- Store objectives
- Store ratio thresholds per category
- Enable multi-user manager dashboard
- Network-level data aggregation

Must support:
- Multi-agent team
- Multi-agency network
- Historical tracking
- Role-based access (5 roles)

<!-- GSD:project-start source:PROJECT.md -->
## Project

**NXT Performance**

NXT Performance est un cockpit web de performance commerciale pour l'immobilier français — destiné aux conseillers, managers, directeurs d'agence, coachs et têtes de réseau. L'app montre aujourd'hui des KPIs, ratios et diagnostics ; la promesse non encore tenue est de **pointer les vraies douleurs métier d'un agent immo et de l'aiguiller vers la bonne action** (training vocal, profiling client, coaching), en un clin d'œil.

**Core Value:** **En 5 secondes**, l'utilisateur doit comprendre où il en est ET savoir quoi faire ensuite. Le dashboard n'est plus un mur de chiffres ; c'est un copilote qui diagnostique la douleur et propose l'action.

### Constraints

- **Stack** : Next.js 16 App Router (Turbopack), React 19, TypeScript strict, Zustand 5, Tailwind 4 OKLCH, Radix UI, Recharts — pas d'ajout de framework UI ni de state library (cf. CLAUDE.md "Technical Guardrails")
- **Rôles** : 5 rôles immutables (conseiller, manager, directeur, coach, reseau) — toute modification touche types/store/sidebar/export/tour/register en cascade
- **Ratios** : 7 ratios métier immutables — `delai_moyen_vente` a été retiré et ne doit pas être ré-ajouté
- **Langue** : Français, caractères réels (é, è, à, ç), jamais d'échappement Unicode
- **Catégorie "Junior"** : le label de `debutant` est "Junior" partout (constants.ts)
- **Pas de backend custom** au-delà des API routes Next.js — Supabase reste la cible quand on migrera depuis mock data
- **Durée milestone** : 2-4 semaines, pas de deadline externe stricte
- **Validation** : Laurent (créateur, utilisateur unique pour l'instant) — pas encore de testeurs externes
- **Secrets** : ne jamais committer `.env.local`, ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x - Full codebase (strict mode enabled), all app logic and components
- JavaScript (ESM) - Build config files (`next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`)
- HTML/CSS - Next.js pages and Tailwind-generated styles
## Runtime
- Node.js 20.x
- Next.js 16.1.6 (App Router with Turbopack)
- npm (lockfile: `package-lock.json` present)
## Frameworks
- Next.js 16.1.6 - Full-stack React framework with API routes, middleware, SSR
- React 19.2.3 - UI component library
- TypeScript 5.x - Type safety
- Zustand 5.0.11 - Global state store at `src/stores/app-store.ts`
- Radix UI 1.4.3 - Unstyled accessible component library
- Tailwind CSS 4 (with @tailwindcss/postcss) - OKLCH color space for design tokens
- Lucide React 0.575.0 - Icon library
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 - Conditional class merging
- tailwind-merge 3.5.0 - Merge conflicting Tailwind classes
- next-themes 0.4.6 - Theme switching (light/dark mode)
- React Hook Form 7.71.2 - Form state and validation
- @hookform/resolvers 5.2.2 - Validation schema adapters
- Zod 4.3.6 - TypeScript-first schema validation
- Recharts 3.7 (via Chart.js 4.5.1 + react-chartjs-2 5.3.1) - Performance charts and metrics
- react-tooltip 5.30.0 - Interactive tooltips
- colorthief 3.3.1 - Dominant color extraction from images
- xlsx 0.18.5 - Excel file parsing and generation (import/export)
- jspdf 4.2.1 - PDF generation
- pdf-lib 1.17.1 - PDF manipulation
- pdf-parse 2.4.5 - PDF text extraction
- mammoth 1.12.0 - DOCX file parsing
- html-to-image 1.11.13 - DOM-to-image conversion
- react-avatar-editor 15.1.0 - Avatar/image cropping
- date-fns 4.1.0 - Date utilities and formatting
## Testing & Development
- Vitest 4.1.2 - Unit test framework (config: `vitest.config.ts`)
- @playwright/test 1.59.1 - E2E testing (config: `playwright.config.ts`)
- ESLint 9.x - Code quality rules
- eslint-config-next 16.1.6 - Next.js-specific rules with core-web-vitals and TypeScript support
- (Prettier config: implicit via next/eslint defaults)
- TypeScript 5.x strict mode - Full compiler checks enabled
## Key Dependencies
- @supabase/supabase-js 2.98.0 - PostgreSQL backend client (auth, database, storage)
- @supabase/ssr 0.8.0 - Server-side cookie management for Supabase auth
- zustand 5.0.11 - Global performance/user state management
- openai 6.33.0 - Groq Whisper API (wrapper), OpenRouter proxy, OpenAI SDK compatibility
- @google/genai 1.48.0 - Google Gemini Live API with audio modalities
- tsx 4.20.0 - TypeScript execution for scripts
- better-sqlite3 12.9.0 - SQLite for local development/scripts
- googleapis 144.0.0 - Google Drive/Sheets API (for coach brain ingestion scripts)
- dotenv 17.4.0 - Environment variable loading
- shadcn 3.8.5 - Component copy-paste library CLI
## Configuration Files
- `next.config.ts` - Next.js configuration (image remotePatterns for Supabase CDN, redirects for legacy URLs)
- `tsconfig.json` - TypeScript compiler (target: ES2017, strict: true, path alias `@/*` → `./src/*`)
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss plugin
- `eslint.config.mjs` - ESLint 9.x flat config with Next.js presets + legacy identifier guards
- `playwright.config.ts` - Playwright E2E config
- `vitest.config.ts` - Vitest unit test config
- `.env.local.example` - Template for required variables (Supabase, Groq, OpenRouter, ElevenLabs, Gamma, Gemini)
- `.nvmrc` - Not present; node version specified in `package.json` engines (20.x)
## Deployment
- Vercel (implied by Next.js 16, references in comments `https://nxt-perf.vercel.app`)
- `.next/` - Compiled Next.js build
- `out/` - Optional static export (ignored by `.next`)
## Browser Support
- Modern browsers (ES2017 target, React 19)
- Responsive design with Tailwind CSS 4 (mobile-first)
- WebSocket support for Gemini Live API (`wss://generativelanguage.googleapis.com`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## TypeScript Configuration
- `strict: true` in `tsconfig.json`
- `noEmit: true` (type checking only, no JS output)
- All type violations must be resolved before commit
- Path alias: `@/*` → `./src/*`
- Types live in `src/types/` directory
- Export types at module level, not nested in files
- Use `type` keyword for type-only exports: `export type { UserRole }`
- Discriminated unions for multi-variant types (e.g., `Role = "conseiller" | "manager"`)
## React Patterns
### Server vs. Client Components
- Used for root layouts: `src/app/layout.tsx`
- Database queries and backend operations
- No `'use client'` directive
- Must have `'use client'` at the top of file
- Used for: interactive forms, hooks (useState, useContext), event handlers
- All pages in `src/app/(dashboard)/` are client components due to sidebar interactivity
- All pages in `src/app/(auth)/` are client components
- Examples: `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/conseiller/diagnostic/page.tsx`
### Hooks Structure
- `use-user.ts` — Returns current user + category from Zustand store, supports advisor override context
- `use-results.ts` — Fetch results for single user or all users
- `use-ratios.ts` — Compute all business ratios and configurations
- `use-weekly-gate.ts` — Weekly submission gate state and dismiss logic
- `use-coach-data.ts` — Portfolio, summaries, priorities for coaches
- `use-director-data.ts` — Team aggregation and org-wide stats for directors
- `use-network-data.ts` — Cross-agency aggregation and network stats
### Component Organization
- Functional components only (no class components)
- Props interface defined above component
- Props destructured in function signature
- JSX returned directly without intermediate variables (unless complex)
- Event handlers prefixed with `on`: `onDismiss`, `onSaisieDone`, `onToggle`
## Zustand Store Patterns
- Demo mode loads mock data from `src/data/mock-*.ts`
- No API calls until Supabase integration phase
- All state is client-side (localStorage for persistence)
## French UI Language
- All visible text uses UTF-8 real characters
- Labels in `src/lib/constants.ts` define canonical strings
- Example: `CATEGORY_LABELS` maps `debutant` → `"Junior"` (not escaped)
- Example: `GPS_THEME_LABELS` has `"Estimations"`, `"Mandats"`, `"% Exclusivité"` (real è and é)
- Database stores: `debutant` (DB enum value)
- UI displays: `"Junior"` (from `CATEGORY_LABELS`)
- See `src/lib/constants.ts:28-32` for single source of truth
## 5-Role System
## 7-Ratio Business Logic
- Located in `src/lib/ratios.ts`
- Functions: `computeRatioValue()`, `determineRatioStatus()`, `computeAllRatios()`
- Each ratio has thresholds per category (Junior/Confirmé/Expert) in `src/data/mock-ratios.ts`
- Status determined by comparing computed value to category threshold
## Naming Conventions
### Files
- kebab-case: `sidebar.tsx`, `use-user.ts`, `weekly-gate.ts`
- Directories: kebab-case grouping by feature: `src/components/conseiller/`, `src/lib/`
- Vitest unit tests: `src/lib/__tests__/weekly-gate.test.ts`
- Playwright e2e tests: `e2e/weekly-gate.spec.ts`
- Pattern: same name as source file + `.test.ts` or `.spec.ts`
### Functions & Variables
- Prefix with `use`: `useUser()`, `useResults()`, `useRatios()`
- Return object with named properties: `{ user, isAuthenticated, category }`
- camelCase: `computeRatioValue()`, `formatRatioObjectiveValue()`, `detectBiggestPainPoint()`
- Verb-first for actions: `calculateObjectiveBreakdown()`, `generateFormationDiagnostic()`
- Query functions: `getWeeklyGateState()`, `deriveAvailableRoles()`
- SCREAMING_SNAKE_CASE for true constants: `CATEGORY_LABELS`, `RATIO_PERCENT_LABELS`, `NXT_COLORS`
- Location: `src/lib/constants.ts` (single source of truth)
- Inline in component: `const user = useAppStore((s) => s.user);`
- No separate selector files — Zustand doesn't require them
### Components
- PascalCase: `DiagnosticVerdictView`, `WeeklyGateWrapper`, `LineChart`
- Descriptive suffix: `*View` for page-level, `*Card` for cards, `*Modal` for dialogs, `*Wrapper` for containers
- Named `[ComponentName]Props`: `DiagnosticPageProps`, `SidebarProps`
- Located directly above component function
## Import Organization
## Component Libraries & Styling
- **Radix UI** (`radix-ui` package v1.4.3) — Unstyled accessible primitives (rarely used directly; mostly via custom components)
- **Tailwind CSS 4** (OKLCH color space) — All styling and theming
- **Recharts** (via `react-chartjs-2` wrapper) — NOT used directly; all charts wrap `Chart.js`
- Chart components in `src/components/charts/`: LineChart, BarChart, DonutChart, ProgressBar, ComparisonBarChart
- Pattern: React component accepts data array and config, renders Chart.js internally
- **Lucide React** (v0.575.0) — All UI icons
- Import: `import { Settings, BookOpen } from "lucide-react";`
## Error Handling
- Use optional chaining: `user?.id`, `data?.results?.[0]`
- Use nullish coalescing: `value ?? "default"`
- Pattern: `if (!user) return null;` for early exit
## Logging
- Use `console.log()` for feature flags and development
- Use `console.warn()` for non-fatal issues
- Use `console.error()` for exceptions
- Include context: `console.log("WeeklyGate:", { showGate, context })`
- Never log sensitive data (auth tokens, passwords)
## Comments
- Complex business logic (e.g., GPS calculations, weekly gate logic)
- Non-obvious intent (e.g., why a certain check is needed)
- Important constraints or gotchas
- Parameter types inferred from TypeScript; JSDoc not required
- Document complex functions:
- Line comments: `// Single context`
- Block comments for multi-line logic:
## Form & Validation
## Data Structures
- ESLint blocks re-introduction of removed fields (see `eslint.config.mjs`)
- Removed: `VenteInfo`, `AcheteurChaud`, `delaiMoyenVente`, `nomVendeur`
- Reference: `src/types/results.ts` for full legacy list and context
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Route groups separate auth flow `(auth)` from authenticated dashboard `(dashboard)` and public pages `(public)`
- Five user roles with hierarchical permissions: `conseiller`, `manager`, `directeur`, `reseau`, and legacy `coach`
- Single Zustand store (`src/stores/app-store.ts`) manages auth state, user data, results, KPI configs, and view preferences
- Mock data mode for demo; Supabase integration in progress (profiles, auth callbacks)
- Role-aware layout guards at `src/app/(dashboard)/{role}/layout.tsx` redirect unauthorized users
- Purely client-side business logic via pure functions in `src/lib/`; no backend API for domain logic yet
## Layers
- Purpose: Organize page routes by context (auth, dashboard, public); apply layout templates per group
- Location: `src/app/`
- Contains: Page components (`.tsx`), layout wrappers, API endpoints
- Depends on: React, Next.js navigation
- Used by: Browser navigation, middleware
- Purpose: Provide persistent UI chrome (sidebar, header, tour) across authenticated pages
- Location: `src/app/(dashboard)/layout.tsx` (main dashboard layout), `src/app/(dashboard)/{role}/layout.tsx` (role guards)
- Contains: Sidebar icon nav, header with view toggle, mobile sidebar, guided tour overlay
- Depends on: Zustand store (`useAppStore`), Supabase client
- Used by: All dashboard pages
- Purpose: Render KPI dashboards, diagnostic tools, progression charts, formation guidance per role
- Location: `src/app/(dashboard)/{role}/{feature}/page.tsx`
- Contains: React components specific to each feature (diagnostic, ameliorer, progression, comparaison, formation)
- Depends on: Custom hooks (`use-results.ts`, `use-ratios.ts`, `use-director-data.ts`, etc.), chart components, Zustand store
- Used by: Route groups
- Purpose: Global app state—current user, auth status, cached results/ratios, demo mode, financial inputs, UI preferences
- Location: `src/stores/app-store.ts`
- Contains: Auth state (`user`, `isAuthenticated`, `profile`), data cache (users, results, ratioConfigs), onboarding (institutions, teams, networks), director financial data (agencyObjective, directorCosts, financialData), view preferences (hiddenViews), demo mode handlers (login/logout/register via mock data)
- Depends on: Mock data (`src/data/mock-*.ts`), Supabase client (for profile sync)
- Used by: All components and hooks
- Purpose: Compute KPIs, ratios, objectives, diagnostics, coaching plans, alerts—deterministic and testable
- Location: `src/lib/` (e.g., `ratios.ts`, `objectifs.ts`, `diagnostic-criticite.ts`, `coaching-debrief.ts`, `aggregate-results.ts`, `formation.ts`)
- Contains: Computation functions for domain model (7 core ratios, objective breakdown, formation recommendations, coaching patterns, financial analysis)
- Depends on: Type definitions (`src/types/`), helper utilities
- Used by: Hooks, page components, API routes
- Purpose: Bridge between global state and component logic; encapsulate data fetching and computation
- Location: `src/hooks/use-*.ts`
- Contains: Hooks for user context, results lookup, ratio computation, director/manager/team aggregation, coach assignments, formations, objectives, badges, DPI snapshots
- Depends on: Zustand store, business logic functions, Supabase queries
- Used by: Page components, feature components
- Purpose: Render KPI cards, charts, diagnostic panels, formation cards, coaching UI, export modals
- Location: `src/components/{feature}/*.tsx` (role-specific: conseiller/, manager/, directeur/, director/) and shared (charts/, badges/, coaching/, dpi/, formation/, layout/, onboarding/, profile/, saisie/, vocal/)
- Contains: React components (mostly client-side, chart wrappers, form inputs, data display, modals)
- Depends on: Custom hooks, Zustand store, Recharts, Radix UI primitives
- Used by: Pages
- Purpose: Backend integration points for AI coaching, voice services, PDF generation, team actions, weekly briefs
- Location: `src/app/api/{feature}/route.ts`
- Contains: Server-side handlers for coaching AI (Gemini), voice TTS/STT, PDF export, team notifications, saisie tips, coaching offers
- Depends on: `@google/genai`, OpenAI SDK, Supabase, external services
- Used by: Frontend components (fetch API)
- Purpose: Define domain model and configuration
- Location: `src/types/`, `src/config/`, `src/lib/constants.ts`
- Contains: User roles/categories, domain types (results, ratios, objectives, finance), database schemas, business constants
- Depends on: None
- Used by: All layers
- Purpose: Provide scoped state without prop drilling
- Location: `src/contexts/advisor-override-context.tsx`
- Contains: Manager view in "individual advisor" mode (switches UI to show selected agent as current user)
- Depends on: React Context API
- Used by: Manager individual view components
- Purpose: Initialize global services (Supabase client, theme, tooltips)
- Location: `src/components/providers/`
- Contains: SupabaseProvider (loads user profile on mount), next-themes, react-tooltip
- Depends on: Supabase, Next.js context
- Used by: Dashboard layout
## Data Flow
- **Auth state:** `user` (current logged-in user), `isAuthenticated`, `isDemo`, `profile` (Supabase)
- **Data cache:** `users` (all org users for manager scope), `results` (all monthly results), `ratioConfigs` (KPI thresholds per category)
- **Onboarding:** `institutions`, `teamInfos`, `networks` (during signup flow)
- **Director inputs:** `agencyObjective`, `directorCosts`, `financialData`, `financialDataHistory`
- **View preferences:** `hiddenViews` (user can hide roles from sidebar)
- **Tools:** `activeTools` (array of subscribed feature flags: nxt_data, nxt_profiling, nxt_training, nxt_finance)
## Key Abstractions
- **conseiller** (agent): Single agent viewing own performance
- **manager**: Manager viewing team performance + individual advisor drill-down
- **directeur** (director): Director viewing agency-wide performance + manager aggregation
- **reseau** (network): Network admin viewing multi-agency performance
- **coach**: Cross-organizational coach assigned to advisors
- **ProspectionData**: Contact → RDV funnel (contacts_rdv ratio)
- **VendeursData**: RDV → Mandats funnel (rdv_mandats, pct_mandats_exclusifs)
- **AcheteursData**: Visitors → Offers → Compromises (acheteurs_visites, visites_offres, offres_compromis)
- **VentesData**: Compromises → Acts (compromis_actes, honoraires_moyens)
- Compares user ratios against category thresholds
- Classifies weak ratios as "pain points"
- Maps pain points to training areas (formation)
- Ranks by severity (criticité)
- Annual financial objective (CA annuelle)
- Breaks down into funnel targets: estimations, mandates, visits, offers, compromises, acts
- Compares against actual performance
- Maps weak ratios to training content (books, videos, workshops)
- Prioritizes by diagnostic ranking
- Tracks completion
- Users earn badges for milestone completion (30-day plan, coaching session, etc.)
- Badges stored in Supabase; displayed in sidebar + celebration modal
## Entry Points
- Location: `src/app/layout.tsx`
- Triggers: App load (all routes)
- Responsibilities: Set HTML metadata, fonts, dark mode, global CSS
- Location: `src/app/page.tsx`
- Triggers: GET `/`
- Responsibilities: Redirect to `/welcome`
- Location: `src/middleware.ts`
- Triggers: All route matches except static assets
- Responsibilities: Check Supabase session, update RLS token, allow/deny request
- Location: `src/app/(auth)/` (login, register, forgot-password, reset-password, welcome, onboarding, demo)
- Triggers: Unauthenticated user navigation or explicit login
- Responsibilities: Credential entry, registration, password recovery
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: Authenticated user/demo mode access
- Responsibilities: Load sidebar, header, provider stack (Supabase, theme, tooltips, tour), session check, profile sync, guided tour trigger
- Location: `src/app/(dashboard)/{conseiller,manager,directeur,reseau}/layout.tsx`
- Triggers: User navigates to role-specific route
- Responsibilities: Check `user.availableRoles` includes role; redirect to default route if not
- Location: `src/app/api/{feature}/route.ts`
- Triggers: Frontend fetch requests
- Responsibilities: Server-side processing (AI coaching, voice TTS, PDF generation, team notifications)
## Error Handling
- **Loading states:** Components check `!user` or `results === null` → render spinner
- **Permission checks:** Layouts verify `roles.includes(requiredRole)` → redirect if not
- **Data fallback:** If results missing, show "No data available" message + link to saisie entry
- **API errors:** Try/catch in fetch; if fails, show toast + log to console (no Sentry yet)
- **Demo mode safety:** Demo data mutations don't persist (stored in store only, cleared on page reload)
## Cross-Cutting Concerns
- Form validation via `react-hook-form` + `zod` (setup pages, profile updates)
- Results data assumed valid from mock or Supabase (no runtime validation)
- Category-based threshold lookup via helper functions
- Supabase auth handles sign-up/login/session
- Demo mode bypasses auth → direct store update
- Role hierarchy derived from `availableRoles` array
- Dark mode default (stored in `html.dark` class)
- Agency branding colors loaded from org profile (`applyAgencyTheme()`)
- Falls back to default theme if no org colors
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
