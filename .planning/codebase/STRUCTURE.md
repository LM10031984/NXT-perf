# Codebase Structure

**Analysis Date:** 2026-05-18

## Directory Layout

```
src/
├── app/                         # Next.js App Router pages & API routes
│   ├── layout.tsx               # Root layout (fonts, dark mode, globals)
│   ├── page.tsx                 # Root redirect to /welcome
│   ├── globals.css              # Tailwind + custom CSS variables
│   ├── (auth)/                  # Route group: unauthenticated pages
│   │   ├── layout.tsx           # Auth layout (no sidebar)
│   │   ├── login/page.tsx       # Login page
│   │   ├── register/page.tsx    # Registration page
│   │   ├── forgot-password/     # Password recovery
│   │   ├── reset-password/      # Password reset confirmation
│   │   ├── welcome/page.tsx     # Landing/signup entry
│   │   ├── onboarding/          # Multi-step onboarding
│   │   │   ├── identite/        # Step: personal info
│   │   │   ├── statut/          # Step: job status
│   │   │   ├── agence/          # Step: institution join
│   │   │   ├── equipe/          # Step: team assignment
│   │   │   ├── dpi/             # Step: DPI (diagnostic) entry
│   │   │   └── gps/             # Step: GPS (objectives) entry
│   │   └── demo/page.tsx        # Demo mode entry (no auth)
│   ├── (dashboard)/             # Route group: authenticated pages (shared sidebar/header)
│   │   ├── layout.tsx           # Main dashboard layout (sidebar, header, tour, providers)
│   │   ├── conseiller/          # Advisor role routes (guard: includes "conseiller")
│   │   │   ├── layout.tsx       # Advisor layout (guard + banners)
│   │   │   ├── diagnostic/      # Ratio analysis & weak points
│   │   │   ├── ameliorer/       # Formation recommendations
│   │   │   ├── progression/     # Monthly trend charts
│   │   │   ├── comparaison/     # Peer comparison
│   │   │   └── identite/        # Typology (Coach-25)
│   │   ├── manager/             # Manager role routes (guard: includes "manager" or "directeur")
│   │   │   ├── layout.tsx       # Manager layout (scope banner)
│   │   │   ├── diagnostic/      # Team ratio analysis
│   │   │   ├── ameliorer/       # Team formation guidance
│   │   │   ├── progression/     # Team trend charts
│   │   │   ├── comparaison/     # Team peer comparison
│   │   │   ├── equipe/page.tsx  # Team member list (drill-down)
│   │   │   ├── gps/page.tsx     # Team objective funnel
│   │   │   ├── cockpit/         # Performance cockpit (V3 refactor)
│   │   │   ├── classement/      # Team ranking
│   │   │   ├── alertes/         # Performance alerts
│   │   │   ├── formation/       # Manager formation access
│   │   │   ├── formation-collective/ # Team training sessions
│   │   │   └── notifications/   # Team notifications
│   │   ├── directeur/           # Director role routes (guard: includes "directeur")
│   │   │   ├── layout.tsx       # Director layout (no guard — inherits from dashboard)
│   │   │   ├── diagnostic/      # Agency ratio analysis
│   │   │   ├── ameliorer/       # Agency formation guidance
│   │   │   ├── progression/     # Agency trend charts
│   │   │   ├── comparaison/     # Agency peer comparison
│   │   │   ├── pilotage/        # Agency cockpit (refactor pending)
│   │   │   ├── equipes/         # Teams under agency
│   │   │   ├── conseiller/[id]/ # Detail view: single advisor
│   │   │   ├── formation/       # Director formation access
│   │   │   ├── formation-collective/ # Agency training
│   │   │   ├── gps/page.tsx     # Agency objective funnel
│   │   │   ├── performance/     # Performance dashboard
│   │   │   ├── pilotage-financier/ # Financial piloting (PR2i)
│   │   │   ├── leads-dpi/       # DPI lead management
│   │   │   ├── dashboard/       # Agency dashboard (legacy, may redirect)
│   │   │   └── resultats/       # Agency results summary
│   │   ├── reseau/              # Network role routes (guard: includes "reseau")
│   │   │   ├── layout.tsx       # Network layout (no guard)
│   │   │   ├── dashboard/       # Network cockpit
│   │   │   └── agence/page.tsx  # Agency detail (?id=xxx query param)
│   │   ├── admin/               # Admin test routes
│   │   │   └── dpi/page.tsx     # DPI admin panel
│   │   ├── notifications/page.tsx       # User notifications center
│   │   ├── objectifs/page.tsx           # Objective management (shared, all roles)
│   │   ├── parametres/page.tsx          # User profile settings
│   │   │   ├── profil/          # Profile edit
│   │   │   ├── agence/          # Agency settings (director only)
│   │   │   ├── equipe/          # Team settings (manager only)
│   │   │   ├── coaching/        # Coaching preferences
│   │   │   └── voix/            # Voice preferences
│   │   ├── saisie/page.tsx              # Results entry (data input form)
│   │   ├── souscrire/page.tsx           # Subscription/tool purchase
│   │   ├── coaching-debrief/page.tsx    # Coaching session debrief
│   │   └── test/                        # Internal test routes
│   │       └── coach-comparison/        # Isolated coach comparison test
│   ├── (public)/                # Route group: public pages (no auth required)
│   │   └── dpi/                 # Public DPI questionnaire
│   │       ├── questionnaire/page.tsx   # DPI entry form
│   │       └── resultats/page.tsx       # DPI results display
│   ├── auth/                    # Supabase auth callback
│   │   └── callback/route.ts    # POST /auth/callback (OAuth redirect)
│   ├── onboarding/              # Supabase-integrated onboarding (future)
│   │   ├── identite/
│   │   ├── statut/
│   │   ├── agence/
│   │   ├── equipe/
│   │   ├── dpi/
│   │   └── gps/
│   ├── pourquoi-nxt/page.tsx    # "Our Approach" (shared sidebar link)
│   └── api/                     # Server-side API endpoints
│       ├── agefice/             # AGEFICE PDF export
│       │   └── cerfa/route.ts
│       ├── coach-brain/         # AI coaching retrieval
│       │   ├── chat/route.ts
│       │   └── retrieve/route.ts
│       ├── coach-nudge/route.ts         # Coaching nudge suggestions
│       ├── coaching/route.ts            # General coaching
│       │   └── request-human-coach/    # Request human coach
│       ├── coaching-debrief/route.ts    # Debrief session processing
│       ├── coaching-offer-message/route.ts
│       ├── comparison-insight/route.ts  # Comparison AI insights
│       ├── import-performance/route.ts  # Performance data import
│       ├── individual-coaching-kit/route.ts
│       ├── manager/
│       │   ├── coach-brain/            # Manager coach brain
│       │   │   └── pattern/route.ts
│       │   └── gamma/route.ts          # Manager GAMMA AI
│       │       └── generate/route.ts
│       ├── onboarding-welcome/route.ts
│       ├── pain-override-explanation/route.ts
│       ├── plan-30j/route.ts           # 30-day plan generation
│       ├── plan-debrief-narrative/route.ts
│       ├── post-saisie-tip/route.ts    # Tips after data entry
│       ├── saisie-ai/route.ts          # AI tips for data entry
│       ├── team-actions/route.ts       # Team action recommendations
│       ├── team-weekly-follow-up/route.ts
│       ├── training-rights/route.ts    # AGEFICE training rights
│       ├── vocal/route.ts              # Legacy voice endpoint
│       ├── voice/                      # Voice services
│       │   ├── session/route.ts        # Voice session management
│       │   └── tts/route.ts            # Text-to-speech
│       ├── weekly-brief/route.ts       # Weekly summary generation
│       └── why-danger/route.ts         # Explanation of danger status
│
├── components/                  # Reusable React components
│   ├── layout/                  # Navigation & structural
│   │   ├── sidebar.tsx          # Icon-based navigation (role-aware filtering)
│   │   ├── header.tsx           # Top bar (view toggle, import/export, theme, notifications)
│   │   ├── mobile-sidebar.tsx   # Mobile navigation drawer
│   │   ├── manager-scope-banner.tsx  # Manager scope visibility banner
│   │   └── ...
│   ├── charts/                  # Chart wrappers (Recharts)
│   │   ├── line-chart.tsx
│   │   ├── bar-chart.tsx
│   │   ├── donut-chart.tsx
│   │   ├── progress-bar.tsx
│   │   ├── comparison-bar-chart.tsx
│   │   └── ...
│   ├── dashboard/               # KPI card components
│   │   ├── kpi-card.tsx         # Card with optional drill-down
│   │   ├── ratio-card.tsx
│   │   └── ...
│   ├── conseiller/              # Advisor-specific components
│   │   ├── diagnostic/          # Weak ratio listing
│   │   ├── ameliorer/           # Formation recommendations
│   │   ├── progression/         # Trend charts
│   │   ├── comparaison/         # Peer comparison
│   │   ├── identity/            # Typology display (Coach-25)
│   │   ├── layout/              # Breadcrumb, persistent plan banner, copilote
│   │   └── ...
│   ├── manager/                 # Manager-specific components
│   │   ├── diagnostic/          # Team diagnostics
│   │   ├── ameliorer/           # Team coaching
│   │   ├── progression/         # Team trends
│   │   ├── comparaison/         # Team comparison
│   │   ├── dashboard/           # Team cockpit
│   │   ├── individual/          # Advisor drill-down UI
│   │   ├── performance/         # Performance views
│   │   └── ...
│   ├── directeur/               # Director-specific components (legacy naming)
│   │   ├── diagnostic/          # Agency diagnostics
│   │   └── ...
│   ├── director/                # Director-specific components (new naming)
│   │   ├── finance/             # Financial piloting (PR2i)
│   │   ├── leads-dpi/           # DPI lead views
│   │   └── ...
│   ├── coaching/                # Coaching & AI features
│   │   ├── ratio-info-tooltip.tsx   # Ratio explanation tooltips (Coach-24)
│   │   ├── coaching-offer-badge.tsx
│   │   └── ...
│   ├── badges/                  # Achievement badges
│   │   ├── badge-celebration.tsx    # Milestone celebration modal
│   │   └── ...
│   ├── dpi/                     # DPI questionnaire & results
│   │   ├── dpi-form.tsx
│   │   ├── dpi-results.tsx
│   │   └── ...
│   ├── formation/               # Training/learning components
│   │   ├── formation-card.tsx
│   │   ├── formation-list.tsx
│   │   └── ...
│   ├── saisie/                  # Results entry form
│   │   ├── saisie-form.tsx
│   │   └── ...
│   ├── onboarding/              # Signup flow components
│   │   ├── identity-step.tsx
│   │   ├── institution-step.tsx
│   │   └── ...
│   ├── profile/                 # User profile components
│   │   ├── avatar-upload.tsx
│   │   ├── profile-form.tsx
│   │   └── ...
│   ├── export/                  # Excel/PDF export
│   │   ├── export-modal.tsx     # Field selection UI
│   │   └── ...
│   ├── tour/                    # Guided tour overlay
│   │   └── guided-tour.tsx      # SVG highlight + step display
│   ├── subscription/            # Subscription UI
│   │   ├── locked-nav-item.tsx  # Grayed-out nav for locked features
│   │   └── ...
│   ├── providers/               # Context providers
│   │   ├── supabase-provider.tsx    # Initializes Supabase client, loads profile
│   │   └── ...
│   ├── vocal/                   # Voice recording (legacy)
│   │   └── ...
│   ├── resultats/               # Results display
│   │   └── ...
│   └── ui/                      # Radix UI primitives (shadcn/ui)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── sheet.tsx            # Mobile drawer
│       ├── tabs.tsx
│       ├── toast.tsx
│       └── ...
│
├── hooks/                       # Custom React hooks
│   ├── use-user.ts              # Current user + category (with advisor override)
│   ├── use-results.ts           # Latest results lookup (user/override aware)
│   ├── use-ratios.ts            # Computed ratios + status
│   ├── use-director-data.ts     # Team/org aggregation for director
│   ├── use-manager-data.ts      # Team data for manager
│   ├── use-network-data.ts      # Cross-agency aggregation
│   ├── use-team-gps.ts          # Team objective funnel
│   ├── use-agency-gps.ts        # Agency objective funnel
│   ├── use-coach-data.ts        # Coach portfolio aggregation
│   ├── use-results-ytd.ts       # Year-to-date aggregation
│   ├── use-dpi-snapshot-history.ts  # DPI progression snapshots
│   ├── use-dpi-snapshot-ensure.ts   # Monthly DPI snapshot trigger
│   ├── use-dpi-evolution.ts     # DPI metric trends
│   ├── use-vocal-flow.ts        # Voice recording state
│   ├── use-vocal-recorder.ts    # Voice recorder utils
│   ├── use-notifications.ts     # User notifications
│   ├── use-plans.ts             # Coaching plans
│   ├── use-badges.ts            # User badges/achievements
│   ├── use-subscription.ts      # Tool subscription status
│   ├── use-persisted-state.ts   # localStorage persistence
│   ├── use-mounted.ts           # Client-only render guard
│   ├── use-advisors-by-pain.ts  # Filter advisors by weak ratios
│   ├── use-team-management.ts   # Team member operations
│   ├── use-supabase-ratio-configs.ts  # Load ratio configs from Supabase
│   ├── use-improvement-resources.ts   # Formation & coaching resources
│   ├── use-coaching-pattern.ts  # Coach pattern analysis
│   ├── use-directeur-scope.ts   # Director scope & visibility
│   ├── use-directeur-diagnostic.ts    # Director diagnostic computation
│   ├── use-user-context.ts      # User data + onboarding status
│   └── team/                    # Team-specific hooks
│       └── ...
│
├── lib/                         # Business logic & utilities
│   ├── ratios.ts                # Ratio computation: computeRatioValue(), computeAllRatios(), determineRatioStatus()
│   ├── objectifs.ts             # Objective breakdown: calculateObjectiveBreakdown()
│   ├── formation.ts             # Formation recommendations: generateFormationDiagnostic()
│   ├── diagnostic-criticite.ts  # Weakness ranking: computeDiagnosticAlerts()
│   ├── coaching-debrief.ts      # Debrief narrative generation
│   ├── coaching-ai-client.ts    # AI coaching client
│   ├── coach.ts                 # Coach scope & assignments
│   ├── finance.ts               # Financial analysis & breakeven
│   ├── finance-trajectory.ts    # Multi-month financial projections
│   ├── aggregate-results.ts     # YTD result aggregation
│   ├── comparison.ts            # Peer comparison logic
│   ├── constants.ts             # CATEGORY_LABELS, CATEGORY_OBJECTIVES, GPS_THEME_LABELS
│   ├── guided-tour.ts           # Tour steps & completion tracking
│   ├── agency-theme.ts          # Brand color application
│   ├── badges.ts                # Badge definition & unlock logic
│   ├── badge-service.ts         # Badge earning service
│   ├── date-periods.ts          # Month/year computation
│   ├── dpi-axes.ts              # DPI improvement areas
│   ├── dpi-context.ts           # DPI context enrichment
│   ├── dpi-pdf.ts               # DPI PDF generation
│   ├── dpi-projections.ts       # DPI metric projections
│   ├── demo-dpi-init.ts         # Demo DPI initialization
│   ├── demo-ratio-picker.ts     # Demo ratio selection
│   ├── export.ts                # Role-based Excel export
│   ├── codes.ts                 # Generate invite codes
│   ├── compress-image.ts        # Image compression
│   ├── utils.ts                 # General utilities (cn, classnames, etc.)
│   ├── api-auth.ts              # API authentication helpers
│   ├── agefice-pdf.ts           # AGEFICE form PDF
│   ├── cerfa-agefice/           # AGEFICE CERFA PDF generation
│   │   ├── __tests__/
│   │   └── ...
│   ├── coaching/                # Coaching-specific logic
│   │   ├── coach-rag.ts         # Coach RAG retrieval
│   │   └── ...
│   ├── diagnostic/              # Diagnostic computation
│   │   └── ...
│   ├── director/                # Director-specific logic
│   │   └── ...
│   ├── manager/                 # Manager-specific logic
│   │   └── ...
│   ├── performance/             # Performance computation
│   │   └── ...
│   ├── dpi/                     # DPI-specific logic
│   │   └── ...
│   ├── server/                  # Server-side utilities
│   │   ├── coach-brain/         # Coach brain embedding retrieval
│   │   ├── coach-rag/           # Coach RAG initialization
│   │   ├── gamma/               # GAMMA AI generation
│   │   └── ...
│   ├── supabase/                # Supabase integration
│   │   ├── client.ts            # Client-side Supabase instance
│   │   ├── server.ts            # Server-side Supabase instance
│   │   ├── middleware.ts        # Session update middleware
│   │   └── ...
│   └── __tests__/               # Library tests (Vitest)
│       └── ...
│
├── stores/                      # Zustand state stores
│   ├── app-store.ts             # Main global store (user, results, ratios, demo mode)
│   ├── manager-scope-store.ts   # Manager scope visibility (team/agency selection)
│   └── badge-store.ts           # Badge state
│
├── contexts/                    # React contexts (non-Zustand)
│   └── advisor-override-context.tsx  # Manager individual advisor view
│
├── data/                        # Mock & configuration data
│   ├── mock-users.ts            # 12 test users (1 director, 2 managers, 8 agents, 1 coach)
│   ├── mock-results.ts          # Feb 2026 + Jan 2026 results
│   ├── mock-network.ts          # Network, agencies, network results (7 users + 1 reseau admin)
│   ├── mock-ratios.ts           # Default ratio thresholds per category
│   ├── mock-finance.ts          # Sample financial input data
│   ├── mock-coach.ts            # Coach assignments, actions, plans, notes, sessions
│   ├── mock-benchmark.ts        # Benchmark data
│   ├── mock-dpi-leads.ts        # Sample DPI leads
│   ├── mock-team.ts             # Team sample data
│   ├── mock-nxt-network.ts      # NXT network data
│   ├── mock-nxt-training.ts     # NXT training data
│   ├── ratio-expertise.ts       # Ratio improvement guidance
│   ├── action-resources.ts      # Action recommendation resources
│   ├── agefice-pta-officiel.ts  # AGEFICE official training catalog (153KB)
│   ├── start-academy-info.ts    # Start Academy training info
│   ├── weekly-briefs.ts         # Sample weekly briefs
│   └── ...
│
├── types/                       # TypeScript type definitions
│   ├── user.ts                  # UserRole, UserCategory, User interface, helpers (hasRole, hasManagerAccess, etc.)
│   ├── results.ts               # PeriodResults, ProspectionData, VendeursData, AcheteursData, VentesData
│   ├── ratios.ts                # RatioId, RatioConfig, ComputedRatio
│   ├── objectives.ts            # ObjectiveInput, ObjectiveBreakdown, Objective
│   ├── database.ts              # DbProfile, DbOrganization, DbTeam, DbPeriodResult (Supabase row types)
│   ├── finance.ts               # FinancialData, FinancialFieldId
│   ├── formation.ts             # FormationDiagnostic, FormationRecommendation
│   ├── period.ts                # PeriodType, Period
│   ├── notifications.ts         # Notification types
│   ├── onboarding.ts            # OnboardingStatus, OnboardingStep
│   ├── team.ts                  # TeamInfo, TeamAggregate
│   ├── gamma.ts                 # GAMMA AI response types
│   ├── dpi-lead.ts              # DPI lead types
│   ├── scope-override.ts        # Scope override types
│   └── index.ts                 # Export all types
│
├── config/                      # Configuration files
│   └── coaching.ts              # Coaching rules & thresholds
│
└── styles/                      # Global styles
    └── ...
```

## Directory Purposes

**src/app/(dashboard)/:
- Purpose: All authenticated dashboard pages; routes share sidebar + header layout
- Contains: Page components, layout guards per role
- Key files: `layout.tsx` (main), `{conseiller,manager,directeur,reseau}/layout.tsx` (role guards)

**src/components/:
- Purpose: Reusable UI components organized by feature domain
- Contains: Charts, KPI cards, forms, modals, role-specific feature components
- Key files: `layout/sidebar.tsx` (navigation), `layout/header.tsx` (top bar), `charts/*.tsx` (Recharts wrappers)

**src/lib/:
- Purpose: Business logic, utilities, domain computations
- Contains: Ratio computation, objective breakdown, diagnostic ranking, formation mapping, financial analysis, export logic
- Key files: `ratios.ts`, `objectifs.ts`, `diagnostic-criticite.ts`, `formation.ts`, `constants.ts`

**src/data/:
- Purpose: Mock data for demo mode; static reference data
- Contains: Mock users, results, network, coach assignments, benchmark data, training catalogs
- Key files: `mock-users.ts`, `mock-results.ts`, `mock-network.ts`

**src/hooks/:
- Purpose: Custom React hooks bridging state → components
- Contains: Data fetching, computation, aggregation, side effects
- Key files: `use-user.ts`, `use-results.ts`, `use-ratios.ts`, `use-director-data.ts`

**src/stores/:
- Purpose: Zustand global state management
- Contains: Auth, user, results, ratios, demo mode, view preferences, financial inputs
- Key files: `app-store.ts` (main 1200+ line store)

**src/types/:
- Purpose: TypeScript type definitions (domain model)
- Contains: User roles, result structures, ratio configs, database schemas
- Key files: `user.ts`, `results.ts`, `ratios.ts`, `objectives.ts`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` — Root layout (fonts, metadata)
- `src/app/page.tsx` — Root redirect (→ /welcome)
- `src/middleware.ts` — Supabase session check + RLS token
- `src/app/(dashboard)/layout.tsx` — Dashboard layout (sidebar, header, providers, tour)

**Configuration:**
- `tsconfig.json` — Path alias `@/*` → `./src/*`
- `next.config.ts` — Next.js configuration
- `package.json` — Dependencies (Next.js 16, React 19, Zustand 5, Recharts 3.7, Tailwind 4)

**Core Logic:**
- `src/stores/app-store.ts` — Global state (user, results, ratios, demo, financials)
- `src/lib/ratios.ts` — Ratio computation (7 ratios × user category)
- `src/lib/objectifs.ts` — GPS objective funnel breakdown
- `src/lib/diagnostic-criticite.ts` — Diagnostic alert ranking by severity
- `src/lib/formation.ts` — Map weak ratios → training recommendations
- `src/lib/constants.ts` — Business constants (CATEGORY_LABELS, CATEGORY_OBJECTIVES, GPS_THEME_LABELS)

**Business Rules:**
- `src/lib/coaching-debrief.ts` — Narrative generation for coaching sessions
- `src/lib/finance.ts` — Revenue, commission, breakeven analysis
- `src/lib/aggregate-results.ts` — YTD result summation
- `src/lib/comparison.ts` — Peer ranking computation

**Mock Data:**
- `src/data/mock-users.ts` — 12 test users: 1 directeur, 2 managers, 8 conseillers, 1 coach
- `src/data/mock-results.ts` — Feb 2026 + Jan 2026 results per user
- `src/data/mock-network.ts` — 7 Lyon users (separate org), 1 réseau admin, network type, institution mock
- `src/data/mock-ratios.ts` — Default ratio thresholds (debutant/confirme/expert)
- `src/data/mock-coach.ts` — Coach assignments, actions, plans, notes, sessions

**Role-Aware UI:**
- `src/components/layout/sidebar.tsx` — Icon nav with `managerOnly`, `directorOnly`, `networkOnly` flags
- `src/app/(dashboard)/{role}/layout.tsx` — Role guards (check `user.availableRoles.includes(role)`)

**Styling:**
- `src/app/globals.css` — Tailwind + CSS variables (agency branding colors)
- `src/lib/agency-theme.ts` — Apply org colors (`--agency-primary`, `--agency-dark`, `--agency-secondary`)

## Naming Conventions

**Files:**
- `use-*.ts` — Custom hooks
- `*.tsx` — React components
- `*-store.ts` — Zustand stores
- `mock-*.ts` — Mock data files
- `[id]` — Dynamic route segment (e.g., `/directeur/conseiller/[id]`)
- `(group)` — Route group folder (not part of URL)

**Directories:**
- Lowercase with hyphens: `src/components/`, `src/lib/`, `src/data/`
- Role-specific prefix: `conseiller/`, `manager/`, `directeur/`, `director/`, `reseau/`
- Feature grouping: `coaching/`, `formation/`, `dpi/`, `saisie/`, `export/`

**Components:**
- PascalCase, descriptive: `KpiCard`, `RatioInfoBadge`, `GuidedTour`, `AdvisorOverrideProvider`

**Hooks:**
- camelCase with `use-` prefix: `useUser()`, `useResults()`, `useRatios()`

**Functions:**
- camelCase, action-based: `computeRatioValue()`, `calculateObjectiveBreakdown()`, `generateFormationDiagnostic()`

**Constants:**
- UPPER_CASE: `DEFAULT_ROUTES`, `CATEGORY_LABELS`, `CATEGORY_OBJECTIVES`

**Types:**
- PascalCase: `User`, `PeriodResults`, `RatioConfig`, `ComputedRatio`

**Enums/Unions:**
- camelCase, descriptive: `"ok" | "warning" | "danger"`, `"conseiller" | "manager" | "directeur" | "reseau"`

## Where to Add New Code

**New Feature (Multi-Page):**
- **Route structure:** `src/app/(dashboard)/{roleFolder}/{feature}/` with `layout.tsx` + `page.tsx`
- **Role guard:** Add layout guard checking `user.availableRoles.includes(role)`
- **Sidebar nav:** Add `NavItem` to `src/components/layout/sidebar.tsx` with role flags (`managerOnly`, etc.)
- **Components:** `src/components/{roleFolder}/{feature}/` (e.g., `src/components/manager/ameliorer/`)
- **Hooks:** `src/hooks/use-{feature}.ts` (e.g., `src/hooks/use-ameliorer-data.ts`)
- **Logic:** `src/lib/{feature}.ts` (e.g., `src/lib/ameliorer.ts`) for pure functions
- **Types:** Add to `src/types/` if new domain model needed (e.g., `src/types/ameliorer.ts`)

**New Role:**
- **Type update:** Add to `UserRole` union in `src/types/user.ts`
- **Store helpers:** Update `rolesToViews()`, `deriveAvailableRoles()`, `DEFAULT_ROUTES` in `src/stores/app-store.ts`
- **Route group:** Create `src/app/(dashboard)/{newRole}/layout.tsx` with guard
- **Sidebar:** Add role flags to applicable nav items
- **Mock data:** Add to `src/data/mock-users.ts`
- **Colors:** Add role to CSS variable mappings in `src/lib/agency-theme.ts`
- **Tour:** Add steps to `src/lib/guided-tour.ts`
- **Export:** Update role-based export logic in `src/lib/export.ts`

**New Component:**
- **Co-located:** `src/components/{feature}/{ComponentName}.tsx`
- **UI primitives:** `src/components/ui/{Primitive}.tsx` (Radix-based)
- **Types:** Export from component if shared; else add to `src/types/` if domain-level

**New Hook:**
- **Location:** `src/hooks/use-{name}.ts`
- **Pattern:** Import from store, call lib functions, return computed result
- **Example:** `useManagerData()` → calls `useAppStore()` → calls `aggregateTeamResults()` → returns `TeamAggregate`

**New Business Logic:**
- **Location:** `src/lib/{domain}.ts`
- **Pattern:** Pure function(s) taking typed inputs, returning typed outputs
- **Testing:** Co-located tests in `src/lib/__tests__/{domain}.test.ts` (Vitest)
- **Example:** `computeRatioValue(ratioId, results)` → number

**New Mock Data:**
- **Location:** `src/data/mock-{entity}.ts`
- **Pattern:** Export array or object matching domain type
- **Usage:** Imported in `app-store.ts` and initialized on `enterDemo()`

**New Type/Interface:**
- **Location:** `src/types/{domain}.ts`
- **Pattern:** Group related types; export from `src/types/index.ts`
- **Rule:** Must be used across multiple files (avoid single-file types inline)

## Special Directories

**src/app/api/:**
- Purpose: Server-side API endpoints for AI, voice, PDF, team notifications
- Generated: No (all hand-written)
- Committed: Yes
- Pattern: Route handlers using `NextRequest`/`NextResponse`; Supabase server client; external SDK calls

**src/lib/server/:**
- Purpose: Server-only utilities (coach RAG, GAMMA AI, Supabase)
- Generated: No (hand-written)
- Committed: Yes
- Pattern: Import only in API routes, never in client components (will error at build if detected)

**src/lib/supabase/:**
- Purpose: Supabase integration (client, server, middleware)
- Generated: No (hand-written)
- Committed: Yes
- Pattern: Client/server instances, middleware session update, RLS helpers

**src/lib/__tests__/:**
- Purpose: Unit tests for business logic (Vitest)
- Generated: No (hand-written)
- Committed: Yes
- Pattern: Each test file mirrors lib structure (e.g., `ratios.test.ts` for `ratios.ts`)

**.next/:**
- Purpose: Next.js build output
- Generated: Yes (build process)
- Committed: No (in `.gitignore`)

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (npm install)
- Committed: No

**supabase/migrations/:**
- Purpose: Supabase schema migrations (future)
- Generated: No (hand-written SQL)
- Committed: Yes (track schema changes)

---

*Structure analysis: 2026-05-18*
