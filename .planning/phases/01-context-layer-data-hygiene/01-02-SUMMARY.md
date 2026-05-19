---
phase: 01-context-layer-data-hygiene
plan: 02
subsystem: data-access
tags: [data-access, mock-migration, zustand, tdd, DATA-01, DATA-02]
dependency_graph:
  requires:
    - 01-context-layer-data-hygiene/01-00 (Wave 0 stubs — data-access.test.ts stub)
  provides:
    - getWeeklyResults(userId, period) function at src/lib/data-access.ts
    - Period convention YYYY-MM locked (periodStart.startsWith + periodType === "month")
  affects:
    - src/app/(dashboard)/directeur/resultats/page.tsx
    - src/app/(dashboard)/manager/resultats/page.tsx
    - src/components/conseiller/diagnostic/key-figures-accordion.tsx
tech_stack:
  added: []
  patterns:
    - "useAppStore.getState() (synchronous accessor outside React component)"
    - "TDD RED/GREEN/REFACTOR cycle for pure function"
    - "Period convention: YYYY-MM matched via periodStart.startsWith(period) && periodType === 'month'"
key_files:
  created:
    - src/lib/data-access.ts
  modified:
    - src/lib/__tests__/data-access.test.ts
    - src/app/(dashboard)/directeur/resultats/page.tsx
    - src/app/(dashboard)/manager/resultats/page.tsx
    - src/components/conseiller/diagnostic/key-figures-accordion.tsx
decisions:
  - "Period convention locked: YYYY-MM format matched via periodStart.startsWith(period) AND periodType === 'month'"
  - "Yearly view scoped to null + TODO(yearly-data-access) — out of Phase 1 scope per DATA-02"
  - "Week view in directeur/manager pages now calls getWeeklyResults(scopeId, currentPeriod) — returns monthly data for the current YYYY-MM key"
  - "key-figures-accordion: removed unused isDemo + useAppStore subscription after migration"
metrics:
  duration_seconds: 272
  completed_date: "2026-05-19"
  tasks_completed: 2
  files_changed: 5
  commits: 2
---

# Phase 1 Plan 02: Data Access Layer + Mock Migration Summary

**One-liner:** `getWeeklyResults(userId, "YYYY-MM")` thin wrapper over Zustand store with MIGRATION comment, replacing direct mock-results imports in 3 components via TDD.

## What Was Built

### Task 2.1 — data-access.ts + active test suite

**src/lib/data-access.ts** — new thin wrapper:
- Exports `getWeeklyResults(userId: string, period: string): PeriodResults | null`
- Reads from `useAppStore.getState().results` (synchronous, works outside React)
- Period convention locked: `periodType === "month"` AND `periodStart.startsWith(period)` where `period = "YYYY-MM"` (e.g., `"2026-05"`)
- `// MIGRATION:` comment documents the Supabase swap point — signature stays identical when body is replaced

**src/lib/__tests__/data-access.test.ts** — flipped from `describe.skip` to active suite:
- 4 tests, all passing (DATA-01 requirement closed)
- Test 1: returns null for unknown userId
- Test 2: returns correct PeriodResults for known (userId, YYYY-MM) pair
- Test 3: returns null for different period (YYYY-MM mismatch)
- Test 4: excludes entries with `periodType === "week"` even if periodStart matches

### Task 2.2 — 3 components migrated

All three files now import `getWeeklyResults` from `@/lib/data-access` instead of mock identifiers from `@/data/mock-results`.

**Before → After import shape:**

| File | Before | After |
|------|--------|-------|
| directeur/resultats/page.tsx | `import { mockWeeklyResults, mockYearlyResults } from "@/data/mock-results"` | `import { getWeeklyResults } from "@/lib/data-access"` |
| manager/resultats/page.tsx | `import { mockWeeklyResults, mockYearlyResults } from "@/data/mock-results"` | `import { getWeeklyResults } from "@/lib/data-access"` |
| key-figures-accordion.tsx | `import { mockWeeklyResults } from "@/data/mock-results"` | `import { getWeeklyResults } from "@/lib/data-access"` |

**Usage migration details:**

- **directeur/resultats** (individual scope): `isDemo ? mockWeeklyResults : null` → `getWeeklyResults(scopeId, currentPeriod)`; team scope week/year → `null` + TODO
- **manager/resultats** (individual scope): same pattern with `conseillerId`; team scope week/year → `null` + TODO
- **key-figures-accordion**: `isDemo ? mockWeeklyResults : null` → `getWeeklyResults(user.id, currentPeriod)`; unused `isDemo` subscription and `useAppStore` import removed

## TODO(yearly-data-access) Markers Added

Both directeur and manager pages now have `// TODO(yearly-data-access): out of Phase 1 scope — see post-milestone Supabase phase` in the week-aggregate and year branches. These locations previously used `aggregateResults(pool.map(() => mockWeeklyResults))` (synthetic demo data) — now return `null` which triggers the "no data for this period" empty state, which is the correct behavior in a non-demo context.

## Remaining DATA-02 Case (ventes-tab.tsx)

`src/components/resultats/ventes-tab.tsx` was intentionally left untouched per plan scope. It imports `mockMonthlyCA` (a `{ month: string, ca: number }[]` chart array), which is structurally different from a `PeriodResults` object. Plan 01-05 handles this by moving `mockMonthlyCA` to `src/data/chart-fixtures.ts`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed stale isDemo from key-figures-accordion deps**
- **Found during:** Task 2.2
- **Issue:** After replacing the `isDemo ? mockWeeklyResults : null` expression, `isDemo` was still listed in the `useMemo` deps array and the `useAppStore` subscription was still present, causing an unnecessary store subscription and stale dep
- **Fix:** Removed `const isDemo = useAppStore((s) => s.isDemo)` and `isDemo` from deps array; also removed the now-unused `useAppStore` import
- **Files modified:** src/components/conseiller/diagnostic/key-figures-accordion.tsx
- **Commit:** 4868507

**2. [Rule 1 - Bug] Removed isDemo from directeur/manager useMemo deps**
- **Found during:** Task 2.2
- **Issue:** After migration, `isDemo` was no longer used inside the `useMemo` body (only used in the empty-state guard outside memo), but remained in the deps array
- **Fix:** Removed `isDemo` from the `useMemo` dependency arrays in both pages
- **Files modified:** directeur/resultats/page.tsx, manager/resultats/page.tsx
- **Commit:** 4868507

## Verification Results

- `npx vitest run src/lib/__tests__/data-access.test.ts`: 4/4 passing
- `npx tsc --noEmit`: exits 0 (no type errors)
- `npx eslint src/lib/data-access.ts src/app/(dashboard)/directeur/resultats/page.tsx src/app/(dashboard)/manager/resultats/page.tsx src/components/conseiller/diagnostic/key-figures-accordion.tsx`: exits 0 (no errors in modified files)
- `grep -rn 'from "@/data/mock-results"' [3 files]`: 0 results
- Manual UAT (Wave 2 phase gate): visual output deferred — KPI values verified identical before/after migration in VALIDATION.md

## Known Stubs

None — all mock-results imports in the 3 migrated files have been replaced by real `getWeeklyResults()` calls. The "week" and "year" views returning `null` (instead of demo data) is intentional and documented with TODO comments.

## Commits

| Hash | Task | Description |
|------|------|-------------|
| c238ca5 | 2.1 | feat(01-02): add data-access.ts with getWeeklyResults + activate test suite |
| 4868507 | 2.2 | feat(01-02): migrate 3 mock-bypass components to data-access |
