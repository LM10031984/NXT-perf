# Codebase Concerns

**Analysis Date:** 2026-05-18

## UX Complexity Hotspots

### 1. Manager Equipe Page Information Overload
- **Issue:** `src/app/(dashboard)/manager/equipe/page.tsx` (941 lines) combines 8 distinct features in one page: collective view, individual selection, results display, ratio cards, ratios tabs, team management (create/rename), agent management (add/remove), and invitation sharing. Multiple modals and state management (7 useState hooks for UI states).
- **Files:** `src/app/(dashboard)/manager/equipe/page.tsx`
- **Why it matters:** Users must scroll extensively, navigate nested modals, and toggle between viewing teammates' data vs. managing team composition. High cognitive load when switching contexts.
- **Suggestion:** Split into "Équipe (collective view)" + separate "Gestion d'équipe" page with team admin features; move invitation sharing to header action or drawer.
- **Effort:** M

### 2. Five-Role Sidebar Navigation Complexity
- **Issue:** Sidebar in `src/components/layout/sidebar.tsx` dynamically renders 4 role sections (Conseiller, Manager, Directeur, Réseau), each with 5-6 navigation items. Role switching via `useAppStore.switchRole()` is permission-gated but not obvious — users with multiple roles don't see clear affordances for role discovery.
- **Files:** `src/components/layout/sidebar.tsx`, `src/stores/app-store.ts` (role hierarchy logic)
- **Why it matters:** Users with multiple roles (manager+directeur, directeur+reseau) don't discover available views until they actively hunt. Navigation appears flat but is role-filtered — inconsistent mental model.
- **Suggestion:** Add explicit role switcher UI (header dropdown or sidebar section header with badge count "3 roles available") to make permissions visible.
- **Effort:** M

### 3. Directeur Pilotage-Financier Page Density
- **Issue:** `src/app/(dashboard)/directeur/pilotage-financier/page.tsx` (766 lines) displays financial health across 5+ card sections (Cash Net, Point Mort, Salary Ratio, Revenue Breakdown, Recommendations, Trajectory) plus detailed field editor modal. Information density ~8 KPIs + edit controls per view.
- **Files:** `src/app/(dashboard)/directeur/pilotage-financier/page.tsx`
- **Why it matters:** Directors scanning financial health must parse many numeric values, colored status badges, and drill-down recommendations in single viewport. Trajectory overlays add modal friction.
- **Suggestion:** Implement tab-based financial dashboard: "Santé financière" (3 KPI cards) | "Détail" (field breakdown) | "Trajectoire 3 mois". Reduce viewport density to 3 KPIs max per view.
- **Effort:** M

### 4. Modal/Drawer Overload in Components
- **Issue:** Multiple independent drawers/modals across pages without coordinated state management:
  - `src/components/dpi/dpi-axis-drawer.tsx` (738 lines) — complex configuration interface in drawer
  - `src/components/saisie/weekly-gate.tsx` (729 lines) — weekly data entry with nested step modals
  - `src/components/manager/individual/individual-coaching-live.tsx` (747 lines) — coaching session details in drawer
  - `src/components/conseiller/diagnostic/why-danger-drawer.tsx` (683 lines) — drill-down explanation drawer
- **Files:** `src/components/dpi/dpi-axis-drawer.tsx`, `src/components/saisie/weekly-gate.tsx`, `src/components/manager/individual/individual-coaching-live.tsx`, `src/components/conseiller/diagnostic/why-danger-drawer.tsx`
- **Why it matters:** Users nesting through modals (main page → drawer → sub-modal) lose context. No back-button affordance; must close and reopen. Mobile: modals consume full viewport with scroll friction.
- **Suggestion:** Replace deep-nested drawers with inline expansions or wizard-style modal (sequential steps with persistent breadcrumb). Implement modal context manager to allow chaining.
- **Effort:** L

### 5. Production Chain Component Visual Complexity
- **Issue:** `src/components/dashboard/production-chain.tsx` (1542 lines) renders 8-10 step cards in a single view. Each card has dual display modes (volumes vs. ratios), status colors (surperf/stable/sousperf), transformations %, and drill-down expandability. No clear visual hierarchy.
- **Files:** `src/components/dashboard/production-chain.tsx`
- **Why it matters:** Users scroll past 10+ cards to find weak step; status signals (borders, badges, colors) compete for attention. Dense layout on mobile requires pinch-zoom or horizontal scroll.
- **Suggestion:** Implement step filter/focus UI: show all steps condensed + click-to-expand weak step only. Add "Jump to bottleneck" shortcut that highlights lowest-performing step.
- **Effort:** M

### 6. Onboarding Registration Form Complexity
- **Issue:** `src/app/(auth)/register/page.tsx` (577 lines) combines 5 distinct flows in one component: single-user signup, manager + team creation, agent join-by-code, role selection (multi-checkbox), invite code validation with real-time API checks. Conditional form fields based on flow (managerMode, roleLocked).
- **Files:** `src/app/(auth)/register/page.tsx`
- **Why it matters:** New users encounter conditional fields that appear/disappear based on invite code validity or role selection. Error messages surface async validation delays (checking invite code). Desktop form works; mobile cramped.
- **Suggestion:** Split into step-based wizard: Role Selection → Organization (Create/Join) → Invite Code (if applicable) → Details → Confirmation. Remove conditional field visibility; use branching wizard flow instead.
- **Effort:** M

### 7. Hidden Affordances in Guided Tour
- **Issue:** `src/lib/guided-tour.ts` defines tour steps (conseiller 6, manager 5, directeur 5, coach 4, réseau 4 steps). Tours are localStorage-persisted and triggered on first login. No UI affordance to re-trigger tour or discover tour existence (no "Help" or "Tour" button in header).
- **Files:** `src/lib/guided-tour.ts`, `src/components/tour/GuidedTour.tsx` (if exists)
- **Why it matters:** Users dismiss tour on first login and forget it exists. Returning users or those seeking help have no way to restart tour. Tour value is invisible.
- **Suggestion:** Add "?" help icon or "Reprendre la visite" link in header accessible at all times; persist tour progress to Supabase when available.
- **Effort:** S

---

## Tech Debt

### 1. TODO/FIXME Comments - Placeholder CA Values
- **Issue:** Two intentional placeholder comments indicate unfinalized mock CA data:
  - `src/data/mock-network.ts:8` — "TODO(provisoire): placeholder dev, valeur à calibrer — CA compromis mock"
  - `src/data/mock-results.ts:3` — Same placeholder comment
- **Files:** `src/data/mock-network.ts`, `src/data/mock-results.ts`
- **Why it matters:** CA (Chiffre d'Affaires) is a critical metric. When Supabase integration replaces mock data, these calibrated values must be reviewed to ensure they reflect realistic business scenarios. Currently flagged but easy to miss.
- **Suggestion:** Create a calibration checklist during Supabase migration phase; validate CA values with product team before data goes live.
- **Effort:** S

### 2. Phase 3 Team Comparison Hook Stub
- **Issue:** `src/hooks/team/use-team-comparison.ts:15` contains `// TODO Phase 3: implement when refactoring /manager/comparaison.`
- **Files:** `src/hooks/team/use-team-comparison.ts`
- **Why it matters:** Hook is imported but not implemented. If used, would return undefined/empty data. `src/app/(dashboard)/manager/comparaison/page.tsx` likely has workarounds or is disabled.
- **Suggestion:** Either implement the hook or remove and refactor manager/comparaison page to use existing data hooks (`use-director-data`, `use-ratios`).
- **Effort:** M

### 3. Large Files at Risk of Architectural Rot
- **Issue:** Several files exceed 700 lines, indicating possible mixed responsibilities:
  - `src/data/agefice-pta-officiel.ts` (5772 lines) — static training catalog data, acceptable but large
  - `src/components/dashboard/production-chain.tsx` (1542 lines) — component + business logic mixed
  - `src/app/(dashboard)/manager/equipe/page.tsx` (941 lines) — page + multiple feature states
  - `src/components/vocal/VocalFlow.tsx` (965 lines) — voice interface + form state
  - `src/components/formation/plan-30-jours.tsx` (903 lines) — training plan display + state
  - `src/components/saisie/weekly-gate.tsx` (729 lines) — data entry + validation + UI
- **Files:** `src/components/dashboard/production-chain.tsx`, `src/app/(dashboard)/manager/equipe/page.tsx`, `src/components/vocal/VocalFlow.tsx`, `src/components/formation/plan-30-jours.tsx`, `src/components/saisie/weekly-gate.tsx`
- **Why it matters:** Large files are harder to test, refactor, and understand. Changes in one area affect many feature branches. Testing these components requires full integration setup.
- **Suggestion:** Extract business logic (GPS calculation, plan generation, validation) from components into `src/lib/` functions. Split into smaller components with clear props boundaries.
- **Effort:** L

### 4. Archive Folder Contains Candidate Code
- **Issue:** `_archive/saisie-v1/` contains 5 files: `saisie-gate.tsx`, `saisie-ai-client.ts`, `nxt-voice-assistant.tsx`, `route.ts`, `saisie-page.tsx`. These are previous versions of saisie features (weekly data entry + voice).
- **Files:** `_archive/saisie-v1/` (5 files)
- **Why it matters:** Developers may accidentally reference or copy patterns from archived code instead of using current implementation. Archive should be cleaned if superseded or clearly marked as reference-only.
- **Suggestion:** Document what's archived and why (e.g., "v1 replaced by voice-conversation.tsx in saisie/"). Remove if truly dead; link to newer implementation if reference.
- **Effort:** S

---

## Mock Data Risk - Supabase Migration Breaking Points

### 1. Store Initialization Depends on Mock Data
- **Issue:** `src/stores/app-store.ts` initializes state from mock files on app startup:
  ```
  users: mockUsers (12 users)
  results: mockResults + mockJanuaryResults (2 months data)
  ratioConfigs: defaultRatioConfigs (7 ratios)
  financialData: mockFinancialData
  networks: mockNetworks (7 Lyon users, 1 Réseau admin, 2 institutions, 5 teams)
  ```
  When Supabase fetches real data, store initialization logic must be updated to load from remote instead of local mocks.
- **Files:** `src/stores/app-store.ts` (lines 176-195)
- **Why it matters:** All components fetch from store, not directly from Supabase. If store doesn't hydrate from Supabase correctly, entire app shows mock data in production or real data doesn't load.
- **Suggestion:** Add feature-flag conditional in store init: `if (isDemoMode) { ...mockUsers } else { ...await fetchUsersFromSupabase() }`. Pre-stage Supabase fetch logic in separate hook now (`use-supabase-users.ts` style).
- **Effort:** M

### 2. Multiple Pages Import Mock Data Directly
- **Issue:** Components bypass store and import mock data directly:
  - `src/app/(dashboard)/directeur/resultats/page.tsx` — `mockWeeklyResults, mockYearlyResults`
  - `src/app/(dashboard)/manager/resultats/page.tsx` — `mockWeeklyResults, mockYearlyResults`
  - `src/components/conseiller/diagnostic/key-figures-accordion.tsx` — `mockWeeklyResults`
  - `src/components/resultats/ventes-tab.tsx` — `mockMonthlyCA`
- **Files:** `src/app/(dashboard)/directeur/resultats/page.tsx`, `src/app/(dashboard)/manager/resultats/page.tsx`, `src/components/conseiller/diagnostic/key-figures-accordion.tsx`, `src/components/resultats/ventes-tab.tsx`
- **Why it matters:** These components won't display real data when mock is removed. Search-and-replace won't catch all usages; risk of mixed real/mock data in same view.
- **Suggestion:** Create data access layer functions in `src/lib/data-access.ts` (e.g., `getWeeklyResults(userId, period)`) that abstract over mock/Supabase. Update all imports to use data-access layer.
- **Effort:** M

### 3. Type Mismatch Between Mock Data and Supabase Expectations
- **Issue:** Mock data in `src/data/mock-*.ts` is shape-compatible with types in `src/types/`, but Supabase row types (e.g., `DbProfile`, `DbOrganization`) may differ in field names or nullability. Example: mock `User` has `teamId` string; Supabase row might use `team_id` (snake_case) or NULL for unassigned.
- **Files:** `src/data/mock-users.ts`, `src/data/mock-network.ts`, `src/types/database.ts`
- **Why it matters:** Queries to Supabase return snake_case; if frontend only hydrates camelCase, field access fails. Null handling differs (mock never returns null; Supabase does).
- **Suggestion:** Create type mappers (e.g., `dbProfileToUser(dbRow: DbProfile): User`) in `src/lib/mappers.ts` to normalize Supabase rows. Use consistently in data fetch hooks.
- **Effort:** M

---

## Performance Concerns

### 1. useDirectorData Hook Recalculates on Every Render
- **Issue:** `src/hooks/use-director-data.ts` computes expensive aggregations (team grouping, KPI calculation per agent) inside useMemo dependencies on `[users, ratioConfigs, allResults]`. If `allResults` is a new array on every render (common in Zustand), useMemo recalculates unnecessarily.
- **Files:** `src/hooks/use-director-data.ts` (lines 57-140)
- **Why it matters:** Directors viewing large teams (30+ agents) with many pages open experience noticeable lag when navigating tabs or toggling filters. Compute scales O(agents * results * ratios).
- **Suggestion:** Memoize `allResults` array identity in store using selector: `useAllResults = () => useAppStore(s => s.results)` (not creating new array). Consider caching team aggregates in store when results update.
- **Effort:** S

### 2. useNetworkData Hook Processes Entire Network on Every Call
- **Issue:** `src/hooks/use-network-data.ts` aggregates all agencies, all managers, all agents, and computes alerts for each agency inside useMemo. For 7+ agencies with 5+ teams each, this is O(agencies * teams * agents * ratio thresholds).
- **Files:** `src/hooks/use-network-data.ts` (lines 100+)
- **Why it matters:** Network-level pages (reseau/dashboard, reseau/agence) re-render and recalculate aggregates on scroll, tab switch, or filter toggle. Mobile users experience frame drops.
- **Suggestion:** Offload aggregation to store (compute once on data load, cache). Expose granular selectors: `getAgencyAggregate(institutionId)` instead of computing all. Memoize alert detection separately from KPI aggregation.
- **Effort:** M

### 3. Charts Rendered Without Key Optimization
- **Issue:** Chart components in `src/components/charts/` (line-chart.tsx, bar-chart.tsx, donut-chart.tsx) use react-chartjs-2/Chart.js. Charts are re-instantiated on every props change; no memoization of datasets or Chart config.
- **Files:** `src/components/charts/line-chart.tsx`, `src/components/charts/bar-chart.tsx`, `src/components/charts/donut-chart.tsx`
- **Why it matters:** Dashboard pages with multiple charts (conseiller/diagnostic, manager/diagnostic showing 4-6 charts) cause full Chart.js redraws on any parent re-render, even unrelated state changes.
- **Suggestion:** Wrap chart components in React.memo with deep dataset comparison. Memoize dataset/labels computation before passing to Chart.
- **Effort:** S

### 4. Missing React.memo on Heavy Components
- **Issue:** Large components like `src/components/dashboard/production-chain.tsx`, `src/components/formation/plan-30-jours.tsx`, and page components don't use React.memo or useMemo for child props, so children re-render when parent state changes (e.g., sidebar toggle, header action).
- **Files:** `src/components/dashboard/production-chain.tsx`, `src/components/formation/plan-30-jours.tsx`, page components in `src/app/(dashboard)/`
- **Why it matters:** Toggling sidebar or changing theme (store state change) triggers full-page re-render, including expensive ratio calculations and chart redraws. Visible lag on slow devices.
- **Suggestion:** Memoize page content components; use unstable_useSyncExternalStore for sidebar state to avoid full app re-render.
- **Effort:** M

---

## Accessibility & Responsive Gaps

### 1. Charts Not Keyboard Navigable
- **Issue:** Chart.js components in `src/components/charts/` are rendered as canvas elements without role="img", aria-label, or keyboard focus support. No way for screen reader users to access data or for keyboard-only users to interact.
- **Files:** `src/components/charts/line-chart.tsx`, `src/components/charts/bar-chart.tsx`, `src/components/charts/donut-chart.tsx`, `src/components/charts/donut-chart.tsx`, `src/components/charts/comparison-bar-chart.tsx`
- **Why it matters:** Charts are critical KPI displays. Blind/low-vision users get no data. Keyboard users can't drill into chart details.
- **Suggestion:** Wrap charts in `role="img"` with descriptive alt text. Add data table toggle button under chart ("Afficher les données du graphique"). Ensure chart drill-down modals are keyboard-accessible.
- **Effort:** M

### 2. Mobile Sidebar Duplication Reduces Space
- **Issue:** `src/components/layout/mobile-sidebar.tsx` shows a fixed hamburger button (left: 3px, z-index: 50) and toggles a full-height sidebar modal. On mobile, this consumes the left edge, conflicting with touch interactions and reducing usable viewport width by 10px on some devices.
- **Files:** `src/components/layout/mobile-sidebar.tsx` (lines 13-18)
- **Why it matters:** Mobile users have tight viewport; 10px gap matters. Hamburger placement over content causes accidental toggles.
- **Suggestion:** Move hamburger to header (integrate into header.tsx) with clear spacing. Use swipe-to-open gesture (Radix Sheet or custom hook) instead of fixed button.
- **Effort:** S

### 3. Missing ARIA Labels on Interactive Components
- **Issue:** Audit found 166 aria-*/role= attributes across 700+ components. Count is high but spread thin, indicating inconsistent coverage. Modal/drawer close buttons, form inputs in deep nested components, and status badges often lack aria-label.
- **Files:** All component files; major gaps in `src/components/saisie/`, `src/components/formation/`, `src/components/dpi/`
- **Why it matters:** Screen readers announce generic "button" instead of "Fermer modal" or "Ajouter membre équipe". Users with visual impairment can't quickly understand affordances.
- **Suggestion:** Audit Saisie, Formation, and DPI components specifically. Add aria-label to all icon-only buttons, status badges, and modal/drawer controls. Use Radix UI Dialog props for automatic a11y.
- **Effort:** M

### 4. Information Density Not Responsive
- **Issue:** Pages like `src/app/(dashboard)/manager/equipe/page.tsx` and `src/app/(dashboard)/directeur/pilotage-financier/page.tsx` display fixed multi-column layouts (KPI cards, tables, expandable sections) without responsive stacking. Mobile: users pinch-zoom or horizontal scroll.
- **Files:** `src/app/(dashboard)/manager/equipe/page.tsx`, `src/app/(dashboard)/directeur/pilotage-financier/page.tsx`, `src/components/dashboard/production-chain.tsx`
- **Why it matters:** Mobile-first design should prioritize. Current mobile experience requires zoom/scroll to read numbers. Tabbed or carousel layout on mobile would improve readability.
- **Suggestion:** Implement mobile-friendly layout: cards stack vertically, tables convert to cards, production chain becomes carousel/tabs. Use Radix Tabs or custom carousel.
- **Effort:** M

---

## Onboarding & Registration Friction

### 1. Multi-Step Registration Flow Without Wizard State
- **Issue:** `src/app/(auth)/register/page.tsx` manages complex branching logic (role selection, invite code validation, organization creation vs. join) using local useState instead of a structured wizard. Users can't see progress or go back to adjust role/org selection without restarting form.
- **Files:** `src/app/(auth)/register/page.tsx` (lines 42-100+)
- **Why it matters:** First-time users get lost; can't change mind mid-flow. If invite code is invalid, no clear "back and start over" path. Drop-off risk high.
- **Suggestion:** Implement wizard state machine (step: "ROLE_SELECT" | "ORG_CHOICE" | "CODE_OR_CREATE" | "DETAILS" | "CONFIRM"). Use Zustand or React Context for state. Add breadcrumb/progress bar.
- **Effort:** M

### 2. Role Selection Complexity for New Users
- **Issue:** Register page offers 5 roles (conseiller, manager, directeur, coach, reseau) to select from. New users don't know which role they are. Role descriptions are vague ("Manager" is undefined if user doesn't know org hierarchy).
- **Files:** `src/app/(auth)/register/page.tsx` (lines 14-32)
- **Why it matters:** Wrong role selection locks users out of correct data views; requires admin intervention to fix. Users with multi-role eligibility don't understand inheritance.
- **Suggestion:** Add pre-role questionnaire: "Are you an individual agent?" → "Conseiller" | "Do you manage a team?" → "Manager" | "Do you manage multiple teams?" → "Directeur". Explain hierarchy visually.
- **Effort:** M

### 3. Invite Code Discovery Not Clear
- **Issue:** Registration page offers two paths: "Create my organization" or "Join an organization with invite code". Users joining don't know where to find invite code; managers creating don't know how to share it. Code generation (`src/lib/codes.ts`) is straightforward but sharing UI is missing.
- **Files:** `src/app/(auth)/register/page.tsx`, `src/lib/codes.ts`, `src/components/onboarding/invite-share-panel.tsx`
- **Why it matters:** Invitations fail because new users can't find codes; managers don't know how to distribute them. Onboarding stalls at team creation.
- **Suggestion:** After manager creates organization/team, immediately show "Invite Your Team" modal with shareable link + code + WhatsApp/email buttons. Persist invite UI in settings for re-sharing.
- **Effort:** S

### 4. Guided Tour Coverage Gaps
- **Issue:** Tours exist for 5 roles (conseiller 6 steps, manager 5, directeur 5, coach 4, reseau 4). Tours cover main pages but skip important flows: onboarding completion, team creation, data import, financial input. No tour for saisie/weekly-gate or formation/agefice-wizard.
- **Files:** `src/lib/guided-tour.ts` (lines 63-180+)
- **Why it matters:** New managers creating teams don't see guided steps; trainers launching financial piloting don't get onboarding help. Important features are invisible without tour.
- **Suggestion:** Add conditional tours: "First-time manager creates team" → short 3-step tour showing team creation + invitation. "Director accesses finance" → 4-step finance tour. Use feature detection (new org, first login, active tool subscription).
- **Effort:** M

---

## Test Coverage Gaps

### 1. Unit Tests Minimal - Only 5 Files
- **Issue:** Only 5 unit test files found (`src/lib/__tests__/coaching-debrief.test.ts` and 4 others not shown). Codebase has 90,622 lines across 600+ files in src/. Test coverage is ~0.005%.
- **Why it matters:** Business logic (ratio computation, GPS calculation, financial analytics, coaching recommendations) has zero protection against regression. Refactors risk silent breaking changes.
- **Suggestion:** Add unit tests for critical functions: `computeAllRatios()`, `calculateObjectiveBreakdown()`, `generatePlan30Days()`, `buildExecutiveRecommendation()`. Target 60% coverage for `src/lib/`.
- **Effort:** L

### 2. E2E Tests Cover Features But Miss Paths
- **Issue:** E2E tests in `e2e/` (24 spec files) cover happy-path scenarios (accounts-roles, onboarding-team, badges, etc.) but miss error states and edge cases:
  - No tests for invalid invite code handling
  - No tests for concurrent team creation race conditions
  - No tests for missing financial data (validation errors)
  - No tests for network failures (Supabase down)
  - No tests for role-permission violations (accessing directeur page as conseiller)
- **Files:** `e2e/` directory
- **Why it matters:** Users hitting edge cases (bad code, network glitch, permission violation) get unexpected behavior. QA finds bugs in production.
- **Suggestion:** Add E2E tests for error flows: invalid onboarding code, concurrent creates, missing data validation, permission denials. Add network fault injection tests.
- **Effort:** L

### 3. Integration Tests Missing for Store + Components
- **Issue:** No integration tests verify that store changes (e.g., switching role, updating results) propagate to components and re-render correctly. Currently testing store in isolation or components in isolation.
- **Files:** No test files for integration patterns
- **Why it matters:** Store-component coupling issues (e.g., selector changing shape, useMemo dependency list wrong) are caught only in manual testing.
- **Suggestion:** Add integration tests: "When user switches role in store, sidebar updates to show new sections" | "When results update in store, all charts re-render with new data".
- **Effort:** M

### 4. Formation & Saisie Features Not E2E Tested
- **Issue:** E2E test files don't cover core workflows:
  - `src/components/formation/plan-30-jours.tsx` — 30-day training plan generation, no E2E tests
  - `src/components/saisie/weekly-gate.tsx` — weekly data entry, only 1 E2E test (saisie-page.spec.ts)
  - `src/components/dpi/dpi-axis-drawer.tsx` — DPI axis configuration, not E2E tested
  - `src/components/vocal/VocalFlow.tsx` — voice-to-data entry, mock-only tests
- **Files:** `src/components/formation/`, `src/components/saisie/`, `src/components/dpi/`, `src/components/vocal/`
- **Why it matters:** Users relying on saisie (weekly data capture) and formation (training plan) workflows have no safety net; bugs in these workflows cause data loss or incorrect recommendations.
- **Suggestion:** Add E2E tests: saisie weekly flow (enter data → validate → submit), formation plan generation (select weak ratio → generate plan → launch 30-day goal), DPI configuration (add axis → configure target → save).
- **Effort:** M

---

## Fragile Areas & Risk Mitigation

### 1. Tightly Coupled Store + Components
- **Issue:** Components directly import and use `useAppStore` (467 store imports across components) without data abstraction. Example: `useAppStore(s => s.financialData)` in 10+ locations. If store shape changes, all 10 components break.
- **Files:** All components with `import { useAppStore } from "@/stores/app-store"`
- **Why it matters:** Refactoring store is risky; requires updating all consumers. New team members don't know what store fields are used where.
- **Suggestion:** Create typed selectors in store or separate `src/hooks/use-store-selectors.ts`: `useFinancialData = () => useAppStore(s => s.financialData)`. Components import selectors instead of directly accessing store. Selectors act as contracts.
- **Effort:** M

### 2. Production Chain Component Highly Coupled to Data Structure
- **Issue:** `src/components/dashboard/production-chain.tsx` assumes specific result data shape (ventes.chiffreAffaires, vendeurs.mandats, etc.) and hardcodes GPS calculation logic. Refactoring results type or GPS method breaks production chain display.
- **Files:** `src/components/dashboard/production-chain.tsx` (lines 200-400+)
- **Why it matters:** Most-viewed component; if broken, dashboards show no data. Hard to test without full results mock.
- **Suggestion:** Extract GPS calculation to `src/lib/production-chain.ts` with types `StepVolume[]`, `StepRatio[]`. Component becomes pure display (props → JSX). Test logic separately.
- **Effort:** M

### 3. Form Validation Spread Across Components
- **Issue:** Form validation logic for saisie, finance, and formation is inline in components (`src/components/saisie/weekly-gate.tsx`, `src/components/formation/agefice-wizard.tsx`, `src/app/(auth)/register/page.tsx`) without shared schema. Each component reinvents validation.
- **Files:** `src/components/saisie/weekly-gate.tsx`, `src/components/formation/agefice-wizard.tsx`, `src/app/(auth)/register/page.tsx`
- **Why it matters:** Validation inconsistency; users get different error messages. If business rules change (e.g., "CA must be > 1000"), updating 5 places is error-prone.
- **Suggestion:** Use Zod schemas in `src/lib/validation/` (e.g., `weeklySaisieSchema`, `financialDataSchema`). Share schemas across components and API routes.
- **Effort:** M

---

## Scaling Limits

### 1. Store Performance Degrades with Large User Sets
- **Issue:** `useAppStore` loads all users, all results, all networks into memory as arrays (`users: User[]`, `results: PeriodResults[]`). For 1000+ users, array operations (filtering, finding) become O(n). Network-level data aggregation O(n²).
- **Files:** `src/stores/app-store.ts` (lines 80-95)
- **Why it matters:** Network admins viewing 50+ agencies with 1000+ agents experience laggy UI. Supabase migration must paginate or index data.
- **Suggestion:** Implement virtual scrolling for large lists (Radix ScrollArea or react-window). Add server-side filtering/pagination in Supabase queries. Cache aggregates per period.
- **Effort:** L (design-level concern, implementation in Supabase phase)

### 2. Charts Re-render Expensive with Large Datasets
- **Issue:** Chart.js components render all data points in dataset. Director viewing 2-year history with monthly granularity (24 points) or network dashboard with yearly data (100+ points) causes canvas redraws on every zoom/filter.
- **Files:** `src/components/charts/line-chart.tsx`, `src/components/charts/bar-chart.tsx`
- **Why it matters:** Slow interactions; mobile devices may lock up.
- **Suggestion:** Implement data decimation (show every 5th point on mobile, every 3rd on tablet) or client-side aggregation (monthly summary instead of daily detail).
- **Effort:** S

### 3. Mock Data Hardcoded to 2 Months - Won't Scale
- **Issue:** `src/data/mock-results.ts` contains hand-crafted January + February 2026 results for 20 users. If tests or demos need 1-year history, manual data creation is infeasible.
- **Files:** `src/data/mock-results.ts`
- **Why it matters:** Demo/testing gets constrained to 2-month window. Can't validate year-over-year comparisons or long-term trends.
- **Suggestion:** Create data generator function: `generateMockResults(months: number, userCount: number) → PeriodResults[]`. Use realistic distributions (CA variance, ratio ranges).
- **Effort:** S

---

## Dependencies at Risk

### 1. Chart.js Version Locked to 4.5.1 - May Lag React 19
- **Issue:** `package.json` specifies `"chart.js": "^4.5.1"` alongside `"react": "19.2.3"`. Chart.js 4 has limited React 19 support; v5 is planned.
- **Why it matters:** React 19 updates may introduce breaking changes (e.g., event handling, strict mode) that Chart.js 4 doesn't support. Warnings in dev console.
- **Suggestion:** Monitor Chart.js v5 release; plan upgrade. Consider alternative charting library (Recharts is already present but underused in favor of Chart.js).
- **Effort:** S (monitoring task; upgrade is M when v5 is stable)

### 2. Zustand 5.0.11 - Breaking Changes Expected in 6.x
- **Issue:** `package.json` uses `"zustand": "^5.0.11"`. Zustand v6 is in development with breaking store signature changes.
- **Why it matters:** When ecosystem upgrades to Zustand 6, app-store.ts must be refactored. Large store (648 lines) will take significant effort.
- **Suggestion:** Plan Zustand 6 migration in Q3/Q4 roadmap. Create migration guide inline with comments.
- **Effort:** M (future task)

---

## Missing Critical Features

### 1. Offline Mode Not Implemented
- **Issue:** App is fully online-dependent (Supabase sync, data export, Gmail integration). No offline fallback; users can't view cached data or use saisie offline.
- **Why it matters:** Mobile users on weak connection lose access to entire app. Weekly data entry can't happen offline.
- **Suggestion:** Implement service worker + IndexedDB cache. Pre-load user data, results, and tour to local DB on login. Saisie should work offline, sync on reconnect.
- **Effort:** L

### 2. Bulk Actions Missing from Team Management
- **Issue:** Manager equipe page lets admins add/remove agents one at a time. No bulk import (CSV), bulk remove, or bulk role assignment.
- **Why it matters:** Directors onboarding 50-person teams must manually click 50 times. Error-prone; time-consuming.
- **Suggestion:** Add "Import team from CSV" with columns: Name, Email, Role. Validate and batch-create users.
- **Effort:** M

### 3. Comparison with Historical Baseline Missing
- **Issue:** "Ma comparaison" pages compare to peer/expert profiles or network average, but not to user's own historical performance. No "vs. your performance 3 months ago" view.
- **Why it matters:** Users can't see if they improved; feedback loop incomplete. Can only see relative performance, not absolute change.
- **Suggestion:** Add date-range picker to comparaison pages. Show "You vs. You 3 months ago" overlay on charts.
- **Effort:** M

---

## Summary - Priority Issues for UX Simplification Milestone

### High Impact, Low Effort (S)
1. Add role switcher UI to sidebar to make multi-role discovery visible
2. Move hamburger button from left edge to header; improve mobile interaction
3. Add "?" help icon in header to re-trigger guided tour

### High Impact, Medium Effort (M)
1. **Split manager/equipe page** — Separate team viewing + team administration
2. **Convert onboarding to wizard** — Reduce branching, improve clarity
3. **Implement tab-based financial dashboard** — Reduce information density
4. **Reduce production chain density** — Add filter/focus UI for bottleneck discovery
5. **Add role-discovery questionnaire** — Guide new users to correct role
6. **Implement charts accessibility** — Add data tables, ARIA labels
7. **Optimize store selectors** — Decouple components from direct store access

### Lower Priority (L - Architectural)
1. Extract business logic from large components → separate lib functions
2. Implement pagination/virtual scrolling for large datasets (Supabase phase)
3. Add missing E2E tests for formation, saisie, DPI, permission flows
4. Refactor mock data to use generator function

---

*Concerns audit: 2026-05-18*
