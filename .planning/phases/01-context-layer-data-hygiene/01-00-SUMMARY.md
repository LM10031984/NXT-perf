---
phase: 01-context-layer-data-hygiene
plan: "00"
subsystem: testing
tags: [vitest, typescript, next-app-router, wave-0, stubs, nyquist]

# Dependency graph
requires: []
provides:
  - "4 describe.skip Wave 0 test stub files covering COPILOT-07, DATA-01, TRAIN-04, COPILOT-08"
  - "Typed 501 stub GET handler at src/app/api/copilot/rag-health/route.ts for RAG-05 build-gate sampling"
affects:
  - "01-01 (copilot-context) — flips copilot-context.test.ts from skip to active"
  - "01-02 (data-access) — flips data-access.test.ts from skip to active"
  - "01-03 (copilot-store) — flips copilot-store-isolation.test.ts from skip to active"
  - "01-04 (constants) — flips constants.test.ts from skip to active"
  - "01-05 (rag-health) — replaces route stub body with real retrieveHybrid handler"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 describe.skip stub convention: test file exists before implementation, Wave 1 plan flips .skip"
    - "period = YYYY-MM convention documented in test name for data-access downstream contract"
    - "Next.js App Router typed stub: export async function GET(): Promise<NextResponse> returning 501"

key-files:
  created:
    - src/lib/__tests__/copilot-context.test.ts
    - src/lib/__tests__/data-access.test.ts
    - src/lib/__tests__/constants.test.ts
    - src/stores/__tests__/copilot-store-isolation.test.ts
    - src/app/api/copilot/rag-health/route.ts
  modified: []

key-decisions:
  - "describe.skip (not it.skip) used so entire suite group reports as skipped — more legible in CI output"
  - "period = YYYY-MM convention captured as test case name in data-access.test.ts (downstream contract for plan 01-02)"
  - "Route stub returns typed body { ok, error, chunks, syntheses } — plan 01-05 replaces body without changing file path or exports"

patterns-established:
  - "Wave 0 stub strategy: all Phase 1 test files created before any Wave 1 implementation commit"
  - "French test descriptions use real UTF-8 characters (é, è, à) — no \\u00 escapes"

requirements-completed:
  - COPILOT-07
  - COPILOT-08
  - DATA-01
  - TRAIN-04
  - RAG-05

# Metrics
duration: 5min
completed: 2026-05-19
---

# Phase 01 Plan 00: Wave 0 Stubs Summary

**4 describe.skip test stubs + typed 501 rag-health route stub establish Nyquist sampling coverage before any Wave 1 implementation commit**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-19T17:28:00Z
- **Completed:** 2026-05-19T17:32:00Z
- **Tasks:** 3 completed
- **Files modified:** 5 created, 0 modified

## Accomplishments

- Created 4 Wave 0 test stub files (11 total describe.skip cases) covering all Phase 1 Wave 1 production modules
- Created typed 501 stub for `GET /api/copilot/rag-health` — tsc covers the route from commit 1 without any production deps
- Documented the `period = "YYYY-MM"` convention in test case names (downstream contract for plan 01-02's `getWeeklyResults` matching logic)
- Confirmed pre-existing test infrastructure issues (Playwright specs picked up by Vitest, 2 coaching-debrief failures) are out-of-scope and logged as deferred

## Task Commits

Each task was committed atomically:

1. **Task 0.1: copilot-context test stub (COPILOT-07)** — `6db9703` (test)
2. **Task 0.2: data-access + constants + copilot-store-isolation stubs (DATA-01, TRAIN-04, COPILOT-08)** — `07ff2c6` (test)
3. **Task 0.3: rag-health route stub (RAG-05)** — `a3a0011` (feat)

## Files Created/Modified

- `src/lib/__tests__/copilot-context.test.ts` — describe.skip with 4 cases: token cap + 3 field exclusions (users[], networks, financialData)
- `src/lib/__tests__/data-access.test.ts` — describe.skip with 3 cases: null return + correct PeriodResults + YYYY-MM period matching convention
- `src/lib/__tests__/constants.test.ts` — describe.skip with 3 cases: 5 situations coverage + persona validity + PERSONA_VOICE_ENV_VAR 3 personas
- `src/stores/__tests__/copilot-store-isolation.test.ts` — describe.skip with 1 case: app-store.ts does not reference copilot-store
- `src/app/api/copilot/rag-health/route.ts` — typed stub returning 501 `{ ok: false, error, chunks: 0, syntheses: 0 }`

## Decisions Made

- Used `describe.skip` (not `it.skip`) so the entire group is reported as one skipped entity in CI output — cleaner signal
- Captured `period = "YYYY-MM" → periodStart.startsWith(period)` convention directly in the stub test name to lock the downstream data-access contract before implementation
- Route stub uses `Promise<NextResponse>` return type to ensure strict TypeScript coverage without importing any production modules

## Deviations from Plan

None — plan executed exactly as written.

Note: `npm install` was required (no `node_modules` directory present in working environment). This is an environment setup step, not a code deviation.

## Issues Encountered

**Pre-existing test suite issues (out of scope, logged to deferred items):**

1. Playwright e2e specs (`e2e/*.spec.ts`) are being incorrectly picked up by Vitest because `vitest.config.ts` has no `exclude` pattern for the `e2e/` directory. This causes 20 failed test suites when running `npx vitest run` without a path filter. Pre-existing before this plan.

2. `src/lib/__tests__/coaching-debrief.test.ts` has 2 failing unit tests (`rdv_mandats` calculation and confidence level). Pre-existing before this plan.

Both issues confirmed by `git stash` + re-run showing identical failure counts before my commits.

Running the 4 Wave 0 stub files in isolation: `node_modules/.bin/vitest run src/lib/__tests__/copilot-context.test.ts src/lib/__tests__/data-access.test.ts src/lib/__tests__/constants.test.ts src/stores/__tests__/copilot-store-isolation.test.ts` exits 0 with 4 files skipped, 11 tests skipped.

## Known Stubs

The following intentional stubs exist by design for this Wave 0 plan:

| File | Pattern | Reason | Resolved by |
|------|---------|--------|-------------|
| `src/lib/__tests__/copilot-context.test.ts` | `describe.skip` | Wave 0: test skeleton before implementation | Plan 01-01 flips to active |
| `src/lib/__tests__/data-access.test.ts` | `describe.skip` | Wave 0: test skeleton before implementation | Plan 01-02 flips to active |
| `src/lib/__tests__/constants.test.ts` | `describe.skip` | Wave 0: test skeleton before implementation | Plan 01-04 flips to active |
| `src/stores/__tests__/copilot-store-isolation.test.ts` | `describe.skip` | Wave 0: test skeleton before implementation | Plan 01-03 flips to active |
| `src/app/api/copilot/rag-health/route.ts` | Returns 501 | Wave 0: route stub for build-gate sampling | Plan 01-05 replaces body |

These stubs are intentional per the Nyquist sampling strategy in `01-VALIDATION.md`. They do NOT prevent Plan 00's goal — the goal IS the stubs.

## Next Phase Readiness

- All 4 Wave 0 test files exist and are discovered by `npx vitest run` (reports skipped, exits 0 with path filter)
- `npx tsc --noEmit` passes — route stub is fully typed
- ESLint passes on all 5 new files
- Wave 1 plans (01-01 through 01-05) can now implement their respective modules and flip each `describe.skip` to active — automated feedback signal is live from commit 1 of each Wave 1 plan

---
*Phase: 01-context-layer-data-hygiene*
*Completed: 2026-05-19*
