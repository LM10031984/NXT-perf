# Architecture

**Analysis Date:** 2026-05-18

## Pattern Overview

**Overall:** Next.js 16 App Router with route groups for authentication and role-based dashboards.

**Key Characteristics:**
- Route groups separate auth flow `(auth)` from authenticated dashboard `(dashboard)` and public pages `(public)`
- Five user roles with hierarchical permissions: `conseiller`, `manager`, `directeur`, `reseau`, and legacy `coach`
- Single Zustand store (`src/stores/app-store.ts`) manages auth state, user data, results, KPI configs, and view preferences
- Mock data mode for demo; Supabase integration in progress (profiles, auth callbacks)
- Role-aware layout guards at `src/app/(dashboard)/{role}/layout.tsx` redirect unauthorized users
- Purely client-side business logic via pure functions in `src/lib/`; no backend API for domain logic yet

## Layers

**App Router & Route Groups:**
- Purpose: Organize page routes by context (auth, dashboard, public); apply layout templates per group
- Location: `src/app/`
- Contains: Page components (`.tsx`), layout wrappers, API endpoints
- Depends on: React, Next.js navigation
- Used by: Browser navigation, middleware

**Layouts & Navigation:**
- Purpose: Provide persistent UI chrome (sidebar, header, tour) across authenticated pages
- Location: `src/app/(dashboard)/layout.tsx` (main dashboard layout), `src/app/(dashboard)/{role}/layout.tsx` (role guards)
- Contains: Sidebar icon nav, header with view toggle, mobile sidebar, guided tour overlay
- Depends on: Zustand store (`useAppStore`), Supabase client
- Used by: All dashboard pages

**Pages & Views:**
- Purpose: Render KPI dashboards, diagnostic tools, progression charts, formation guidance per role
- Location: `src/app/(dashboard)/{role}/{feature}/page.tsx`
- Contains: React components specific to each feature (diagnostic, ameliorer, progression, comparaison, formation)
- Depends on: Custom hooks (`use-results.ts`, `use-ratios.ts`, `use-director-data.ts`, etc.), chart components, Zustand store
- Used by: Route groups

**State Management (Zustand):**
- Purpose: Global app state—current user, auth status, cached results/ratios, demo mode, financial inputs, UI preferences
- Location: `src/stores/app-store.ts`
- Contains: Auth state (`user`, `isAuthenticated`, `profile`), data cache (users, results, ratioConfigs), onboarding (institutions, teams, networks), director financial data (agencyObjective, directorCosts, financialData), view preferences (hiddenViews), demo mode handlers (login/logout/register via mock data)
- Depends on: Mock data (`src/data/mock-*.ts`), Supabase client (for profile sync)
- Used by: All components and hooks

**Business Logic (Pure Functions):**
- Purpose: Compute KPIs, ratios, objectives, diagnostics, coaching plans, alerts—deterministic and testable
- Location: `src/lib/` (e.g., `ratios.ts`, `objectifs.ts`, `diagnostic-criticite.ts`, `coaching-debrief.ts`, `aggregate-results.ts`, `formation.ts`)
- Contains: Computation functions for domain model (7 core ratios, objective breakdown, formation recommendations, coaching patterns, financial analysis)
- Depends on: Type definitions (`src/types/`), helper utilities
- Used by: Hooks, page components, API routes

**Custom Hooks:**
- Purpose: Bridge between global state and component logic; encapsulate data fetching and computation
- Location: `src/hooks/use-*.ts`
- Contains: Hooks for user context, results lookup, ratio computation, director/manager/team aggregation, coach assignments, formations, objectives, badges, DPI snapshots
- Depends on: Zustand store, business logic functions, Supabase queries
- Used by: Page components, feature components

**Components (UI):**
- Purpose: Render KPI cards, charts, diagnostic panels, formation cards, coaching UI, export modals
- Location: `src/components/{feature}/*.tsx` (role-specific: conseiller/, manager/, directeur/, director/) and shared (charts/, badges/, coaching/, dpi/, formation/, layout/, onboarding/, profile/, saisie/, vocal/)
- Contains: React components (mostly client-side, chart wrappers, form inputs, data display, modals)
- Depends on: Custom hooks, Zustand store, Recharts, Radix UI primitives
- Used by: Pages

**API Routes:**
- Purpose: Backend integration points for AI coaching, voice services, PDF generation, team actions, weekly briefs
- Location: `src/app/api/{feature}/route.ts`
- Contains: Server-side handlers for coaching AI (Gemini), voice TTS/STT, PDF export, team notifications, saisie tips, coaching offers
- Depends on: `@google/genai`, OpenAI SDK, Supabase, external services
- Used by: Frontend components (fetch API)

**Types & Constants:**
- Purpose: Define domain model and configuration
- Location: `src/types/`, `src/config/`, `src/lib/constants.ts`
- Contains: User roles/categories, domain types (results, ratios, objectives, finance), database schemas, business constants
- Depends on: None
- Used by: All layers

**Contexts:**
- Purpose: Provide scoped state without prop drilling
- Location: `src/contexts/advisor-override-context.tsx`
- Contains: Manager view in "individual advisor" mode (switches UI to show selected agent as current user)
- Depends on: React Context API
- Used by: Manager individual view components

**Providers:**
- Purpose: Initialize global services (Supabase client, theme, tooltips)
- Location: `src/components/providers/`
- Contains: SupabaseProvider (loads user profile on mount), next-themes, react-tooltip
- Depends on: Supabase, Next.js context
- Used by: Dashboard layout

## Data Flow

**Demo Mode (Mock Data) → Components:**

1. User loads app → middleware checks Supabase session
2. No session → redirect to `/login` or `/welcome`
3. Demo mode → skip auth, use `mockUsers` from `src/data/mock-users.ts`
4. Page loads → component calls `useAppStore` → reads cached user/results
5. Component calls domain hook (`useResults()`, `useRatios()`) → pure function computes KPI
6. Hook returns data → component renders via chart/KPI components

**Supabase Auth Flow (In Progress):**

1. User registers → creates Supabase auth account
2. Middleware calls `updateSession()` → updates RLS policy with user token
3. Profile created in Supabase `profiles` table
4. SupabaseProvider in dashboard layout → calls `useSupabaseProfile()` hook
5. Hook queries `profiles` table, loads profile, stores in Zustand (`setProfile()`)
6. Profile loaded → check `onboarding_completed` → redirect to onboarding if needed
7. Load org theme colors → apply agency branding

**Results & Ratio Computation:**

1. Page mounts → component calls `useResults(userId?)` hook
2. Hook checks Zustand store → filters `results` array by `userId`
3. Returns most recent result (`PeriodResults`) by `periodStart`
4. Component calls `useRatios()` → reads `results` and `ratioConfigs` from store
5. Hook calls `computeAllRatios()` function → applies thresholds based on user `category` (debutant/confirme/expert)
6. Returns `ComputedRatio[]` with computed values + status (ok/warning/danger)
7. Component renders KPI card + status badge

**Manager Drill-Down (View Individual Advisor):**

1. Manager loads team page → selects advisor from team list
2. AdvisorOverrideProvider wraps page → injects selected `advisorId`
3. `useUser()` hook checks context → returns override user instead of manager
4. `useResults()` checks context → fetches override user's results
5. All downstream components behave as if viewing advisor (category, ratios, progression)
6. Director/network scope unchanged (manager remains in hierarchy)

**Financial Data Persistence (PR2i):**

1. Director inputs financial field (e.g., commission rate)
2. `updateFinancialField()` in store sets flag `isCaTransactionManuallyOverridden = true`
3. Field value stored in `financialData`
4. Monthly snapshot stored in `financialDataHistory[YYYY-MM]`
5. useEffect in component auto-syncs `caTransaction` from agency aggregated CA
6. If `isCaTransactionManuallyOverridden`, sync skipped (user has manual control)
7. `clearCaTransactionOverride()` resets flag → re-enables auto-sync

**State Management:**

- **Auth state:** `user` (current logged-in user), `isAuthenticated`, `isDemo`, `profile` (Supabase)
- **Data cache:** `users` (all org users for manager scope), `results` (all monthly results), `ratioConfigs` (KPI thresholds per category)
- **Onboarding:** `institutions`, `teamInfos`, `networks` (during signup flow)
- **Director inputs:** `agencyObjective`, `directorCosts`, `financialData`, `financialDataHistory`
- **View preferences:** `hiddenViews` (user can hide roles from sidebar)
- **Tools:** `activeTools` (array of subscribed feature flags: nxt_data, nxt_profiling, nxt_training, nxt_finance)

## Key Abstractions

**User Role Hierarchy:**

- **conseiller** (agent): Single agent viewing own performance
- **manager**: Manager viewing team performance + individual advisor drill-down
- **directeur** (director): Director viewing agency-wide performance + manager aggregation
- **reseau** (network): Network admin viewing multi-agency performance
- **coach**: Cross-organizational coach assigned to advisors

Purpose: Determine scope of data visibility and UI features
Examples: `src/stores/app-store.ts`, `src/types/user.ts`
Pattern: `hasRole(user, "manager")`, `hasDirectorAccess(user)` helper functions

**Business Results Model:**

- **ProspectionData**: Contact → RDV funnel (contacts_rdv ratio)
- **VendeursData**: RDV → Mandats funnel (rdv_mandats, pct_mandats_exclusifs)
- **AcheteursData**: Visitors → Offers → Compromises (acheteurs_visites, visites_offres, offres_compromis)
- **VentesData**: Compromises → Acts (compromis_actes, honoraires_moyens)

Purpose: Core sales funnel model across all advisor performance views
Examples: `src/types/results.ts`, `src/lib/ratios.ts`
Pattern: `computeRatioValue(ratioId, results)` applies formula per ratio ID

**7 Core Ratios:**

1. `contacts_rdv` — contacts per RDV (lower better)
2. `rdv_mandats` — RDVs per mandate signed (lower better)
3. `pct_mandats_exclusifs` — exclusive mandate % (higher better)
4. `acheteurs_visites` — visits per buyer (higher better)
5. `visites_offres` — offers per visit (lower better)
6. `offres_compromis` — compromises per offer (lower better)
7. `compromis_actes` — acts per compromise (lower better)

Purpose: Standardized KPI set across all roles; forms basis of diagnostic
Examples: `src/types/ratios.ts`, `src/lib/ratios.ts`, `src/data/mock-ratios.ts`
Pattern: Each ratio has `RatioConfig` (thresholds per category, isSLowerBetter flag)

**Diagnostic Model:**

- Compares user ratios against category thresholds
- Classifies weak ratios as "pain points"
- Maps pain points to training areas (formation)
- Ranks by severity (criticité)

Purpose: Identify performance gaps; guide coaching priorities
Examples: `src/lib/diagnostic-criticite.ts`
Pattern: `computeDiagnosticAlerts()` returns prioritized array of weak ratios

**Objective & GPS Model:**

- Annual financial objective (CA annuelle)
- Breaks down into funnel targets: estimations, mandates, visits, offers, compromises, acts
- Compares against actual performance

Purpose: Visual funnel representation of goal progress
Examples: `src/types/objectives.ts`, `src/lib/objectifs.ts`
Pattern: `calculateObjectiveBreakdown(annualCA)` computes stage targets

**Formation Recommendation Model:**

- Maps weak ratios to training content (books, videos, workshops)
- Prioritizes by diagnostic ranking
- Tracks completion

Purpose: Guide personalized learning paths
Examples: `src/lib/formation.ts`, `src/components/formation/`
Pattern: `generateFormationDiagnostic()` maps diagnostic pain points → learning resources

**Badge & Achievement System:**

- Users earn badges for milestone completion (30-day plan, coaching session, etc.)
- Badges stored in Supabase; displayed in sidebar + celebration modal

Purpose: Gamification + milestone tracking
Examples: `src/lib/badges.ts`, `src/components/badges/`
Pattern: Badge key stored in store; anniversary triggers celebration animation

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: App load (all routes)
- Responsibilities: Set HTML metadata, fonts, dark mode, global CSS

**Root Page:**
- Location: `src/app/page.tsx`
- Triggers: GET `/`
- Responsibilities: Redirect to `/welcome`

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: All route matches except static assets
- Responsibilities: Check Supabase session, update RLS token, allow/deny request

**Auth Routes:**
- Location: `src/app/(auth)/` (login, register, forgot-password, reset-password, welcome, onboarding, demo)
- Triggers: Unauthenticated user navigation or explicit login
- Responsibilities: Credential entry, registration, password recovery

**Dashboard Entry:**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: Authenticated user/demo mode access
- Responsibilities: Load sidebar, header, provider stack (Supabase, theme, tooltips, tour), session check, profile sync, guided tour trigger

**Role-Specific Layouts (Guards):**
- Location: `src/app/(dashboard)/{conseiller,manager,directeur,reseau}/layout.tsx`
- Triggers: User navigates to role-specific route
- Responsibilities: Check `user.availableRoles` includes role; redirect to default route if not

**API Routes:**
- Location: `src/app/api/{feature}/route.ts`
- Triggers: Frontend fetch requests
- Responsibilities: Server-side processing (AI coaching, voice TTS, PDF generation, team notifications)

## Error Handling

**Strategy:** Defensive — components check for null user/results; API routes return 401/500 with error messages.

**Patterns:**

- **Loading states:** Components check `!user` or `results === null` → render spinner
- **Permission checks:** Layouts verify `roles.includes(requiredRole)` → redirect if not
- **Data fallback:** If results missing, show "No data available" message + link to saisie entry
- **API errors:** Try/catch in fetch; if fails, show toast + log to console (no Sentry yet)
- **Demo mode safety:** Demo data mutations don't persist (stored in store only, cleared on page reload)

## Cross-Cutting Concerns

**Logging:** `console.log` only (no structured logging framework yet); some key events logged to browser console (tour completion, role switch, financial field edits)

**Validation:** 
- Form validation via `react-hook-form` + `zod` (setup pages, profile updates)
- Results data assumed valid from mock or Supabase (no runtime validation)
- Category-based threshold lookup via helper functions

**Authentication:**
- Supabase auth handles sign-up/login/session
- Demo mode bypasses auth → direct store update
- Role hierarchy derived from `availableRoles` array

**Theme & Branding:**
- Dark mode default (stored in `html.dark` class)
- Agency branding colors loaded from org profile (`applyAgencyTheme()`)
- Falls back to default theme if no org colors

**Accessibility:** Sidebar icons + labels, button tooltips, ARIA labels on forms (minimal — will improve with Supabase audit phase)

---

*Architecture analysis: 2026-05-18*
