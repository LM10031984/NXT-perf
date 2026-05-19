---
phase: 01-context-layer-data-hygiene
plan: "01"
subsystem: api
tags: [typescript, copilot, context, tokenize, pure-function, zustand]

# Dependency graph
requires:
  - phase: 01-context-layer-data-hygiene/01-00
    provides: Wave 0 stubs (describe.skip test file for copilot-context)

provides:
  - CopilotContextPayload type with 6 exact fields from CONTEXT.md D1
  - BuildCopilotContextInput type (pure function input)
  - CopilotMessage and SuggestionCard interfaces
  - buildCopilotContext() pure function with 3000-token hard cap
  - tokenize() helper (char/4 heuristic, Math.ceil)
  - truncateToTokenBudget() helper with French console.warn
  - TOKEN_BUDGET const (total 3000, userContext 1500, ragChunks 1200, concepts 300)

affects:
  - 01-context-layer-data-hygiene/01-03 (copilot-store.ts consumes CopilotMessage, SuggestionCard)
  - Phase 2 streaming endpoint (buildCopilotContext called once per request)
  - Any route handler that assembles context payload

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function: buildCopilotContext accepts all inputs pre-computed by caller — no hook calls, no store reads"
    - "Token estimation: Math.ceil(text.length / 4) — char/4 heuristic, zero new dependencies"
    - "Truncation order: computedRatios trimmed first (pop from end), userId/period/userCategory/topCriticite/currentMonthResults always preserved"
    - "Console.warn in French with real UTF-8 characters (é, ê) for observability"

key-files:
  created:
    - src/types/copilot.ts
    - src/lib/copilot-context.ts
  modified:
    - src/lib/__tests__/copilot-context.test.ts

key-decisions:
  - "topCriticite accepted as pre-computed input param (CriticitePoint | null) — caller runs findCriticitePoints() externally, keeps buildCopilotContext a pure function with no diagnostic pipeline coupling"
  - "Truncation order: computedRatios trimmed first (Array.pop loop), preserving user identity fields always"
  - "afterEach vi.restoreAllMocks() added to prevent console.warn spy bleed between tests"

patterns-established:
  - "Pattern: CopilotContextPayload shape — 6 fields, no users[], networks, institutions, financialData ever"
  - "Pattern: TOKEN_BUDGET as const object — all slices defined in one place, importable by Phase 2 prompt builder"

requirements-completed: [COPILOT-07]

# Metrics
duration: 8min
completed: "2026-05-19"
---

# Phase 01 Plan 01: Copilot Type Surface + buildCopilotContext Summary

**Typed CopilotContextPayload (6-field D1 contract) + pure buildCopilotContext() with char/4 tokenize and 3000-token hard cap via computedRatios truncation**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-19T17:28:00Z
- **Completed:** 2026-05-19T17:36:54Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `src/types/copilot.ts` with 4 interfaces: `CopilotContextPayload`, `BuildCopilotContextInput`, `CopilotMessage`, `SuggestionCard` — exactly matching CONTEXT.md D1 shape
- Created `src/lib/copilot-context.ts` with pure functions `buildCopilotContext()`, `tokenize()`, `truncateToTokenBudget()` and `TOKEN_BUDGET` constant
- Flipped Wave 0 `describe.skip` stub to active test suite: 8 tests passing, 0 skipped, 0 failing

## Task Commits

1. **Task 1.1: Define copilot type surface** — `02124f5` (feat)
2. **Task 1.2: Implement buildCopilotContext + tokenize + truncateToTokenBudget** — `202a6ec` (feat)

## Files Created/Modified

- `src/types/copilot.ts` — 4 exported interfaces (CopilotContextPayload, BuildCopilotContextInput, CopilotMessage, SuggestionCard). Imports CriticitePoint from diagnostic-criticite, ComputedRatio from ratios, PeriodResults from results, UserCategory from user.
- `src/lib/copilot-context.ts` — Pure functions: tokenize() (char/4 Math.ceil), truncateToTokenBudget() (French warn), buildCopilotContext() (3000 token cap, ratios trimmed first). TOKEN_BUDGET const exported.
- `src/lib/__tests__/copilot-context.test.ts` — Active vitest suite: 3 tokenize tests, 2 truncateToTokenBudget tests, 3 buildCopilotContext tests. describe.skip removed.

## Decisions Made

- **topCriticite as pre-computed input:** `buildCopilotContext()` accepts `topCriticite: CriticitePoint | null` as input parameter. The caller (Phase 2 route handler) runs `findCriticitePoints()` separately and passes `result.top`. This keeps the function pure and testable without mocking the full diagnostic pipeline.
- **Truncation order:** `computedRatios` trimmed first via `Array.pop()` loop. The identity fields (`userId`, `period`, `userCategory`, `topCriticite`, `currentMonthResults`) are always preserved regardless of token overflow.
- **Test spy isolation:** Added `afterEach(() => vi.restoreAllMocks())` to prevent console.warn spy call count from bleeding between the two truncateToTokenBudget tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] console.warn spy bleed between vitest tests**
- **Found during:** Task 1.2 (running vitest for first time)
- **Issue:** The second test in `truncateToTokenBudget` describe block ("ne tronque pas et ne warn pas quand sous budget") failed because the `console.warn` spy from the previous test wasn't reset — it still showed 1 call from the "tronque exactement à budget" test.
- **Fix:** Added `afterEach(() => vi.restoreAllMocks())` to the `truncateToTokenBudget` describe block to restore spy state after each test.
- **Files modified:** `src/lib/__tests__/copilot-context.test.ts`
- **Verification:** `npx vitest run src/lib/__tests__/copilot-context.test.ts` — 8 passed, 0 failed
- **Committed in:** `202a6ec` (Task 1.2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Necessary for correct test isolation. No scope creep.

## Issues Encountered

None beyond the test spy isolation bug documented above.

## Known Stubs

None — all 6 fields of `CopilotContextPayload` are wired. `buildCopilotContext()` returns a real payload. Tests cover real behavior (no hardcoded returns).

## Next Phase Readiness

- `CopilotContextPayload` shape locked and tested — Phase 2 streaming endpoint can import and use directly
- `buildCopilotContext()` is the caller contract: Phase 2 route handler assembles `computedRatios` via `computeAllRatios()`, `topCriticite` via `findCriticitePoints()`, then calls `buildCopilotContext(input)`
- `TOKEN_BUDGET` const available for Phase 2 prompt builder to allocate remaining budget to RAG + concepts slices
- `CopilotMessage` and `SuggestionCard` types ready for plan 01-03 (copilot-store.ts)

---

*Phase: 01-context-layer-data-hygiene*
*Completed: 2026-05-19*
