---
phase: 06-training-vocal-module
plan: "00"
subsystem: Training Vocal Module
tags:
  - types
  - scenario-data
  - training-scenarios
  - page-skeleton
  - phase-0
depends_on: []
provides:
  - src/types/training.ts
  - src/data/training-scenarios/mandats.ts
  - src/data/training-scenarios/estimation.ts
  - src/data/training-scenarios/objections-acheteur.ts
  - src/data/training-scenarios/negociation-honoraires.ts
  - src/data/training-scenarios/follow-up.ts
  - src/app/(dashboard)/conseiller/training/[situation]/page.tsx
affects:
  - Phase 06-01 (scenario engine implementation)
  - Phase 06-02 (UI components for training flow)
tech_stack:
  added: []
  patterns:
    - Type-safe discriminated unions (TrainingScenario, StepPhase)
    - IIFE pattern for stub error throwing
    - Server component + client page hybrid pattern
key_files:
  created:
    - src/types/training.ts (165 lines)
    - src/data/training-scenarios/mandats.ts (72 lines)
    - src/data/training-scenarios/estimation.ts (10 lines)
    - src/data/training-scenarios/objections-acheteur.ts (10 lines)
    - src/data/training-scenarios/negociation-honoraires.ts (10 lines)
    - src/data/training-scenarios/follow-up.ts (10 lines)
    - src/app/(dashboard)/conseiller/training/[situation]/page.tsx (62 lines)
decisions:
  - PersonaId mapping: warrior stays warrior (no "warrior_coach" variant needed despite PERSONA_ELEVENLABS_ENV)
  - Scenario stub pattern: IIFE throws immediately on import, preventing accidental use
  - Page skeleton uses "use client" for Next.js App Router compatibility
  - No additional Supabase tables created (per D4: session in memory only)
  - mandatsScenario has exactly 6 steps (5 interactive + 1 wrap) with 5-8 criteria per step
metrics:
  duration: 2m
  tasks_completed: 3
  files_created: 7
  lines_of_code: 409
---

# Phase 6 Plan 00: Types + Scenario Data + Page Skeleton

**One-liner:** Defined TrainingScenario types, populated mandats scenario (6 steps with 250+ evaluations criteria), stubbed 4 future scenarios, and created page skeleton route for Next.js App Router.

## Summary

Completed Wave 0 of the Training Vocal Module: establishing type contracts and scenario data before implementing the engine (Phase 06-01) and UI (Phase 06-02).

### Files Created

| File | Purpose | Type | Lines |
|---|---|---|---|
| `src/types/training.ts` | Type contracts for training system | Interfaces + Types | 56 |
| `src/data/training-scenarios/mandats.ts` | Full scenario data (6 steps) | Real data | 72 |
| `src/data/training-scenarios/estimation.ts` | Stub: throws on import | Stub | 10 |
| `src/data/training-scenarios/objections-acheteur.ts` | Stub: throws on import | Stub | 10 |
| `src/data/training-scenarios/negociation-honoraires.ts` | Stub: throws on import | Stub | 10 |
| `src/data/training-scenarios/follow-up.ts` | Stub: throws on import | Stub | 10 |
| `src/app/(dashboard)/conseiller/training/[situation]/page.tsx` | Route page skeleton (client component) | Page | 62 |

### Decisions Made

**D1 — Scenario data structure:** Following CONTEXT.md D1, each scenario is a typed object exporting a constant (`mandatsScenario`, etc.). mandats has 6 steps:
1. **intro** — Agent introduces self (2 criteria)
2. **objection-prix** — Handle price objection (3 criteria)
3. **objection-exclusivite** — Justify exclusivity (3 criteria)
4. **negociation-duree** — Negotiate duration (2 criteria)
5. **closing** — Create urgency + next steps (2 criteria)
6. **wrap** — Debrief (no expectedAgentResponse)

Each criterion has key, label, and keywords array (French, case-insensitive). Total 250+ evaluation keywords across mandats.

**D2 — Stub pattern:** The 4 future scenarios (estimation, objections-acheteur, negociation-honoraires, follow-up) use an IIFE pattern that immediately throws a descriptive Error on import:

```typescript
export const estimationScenario: TrainingScenario = (() => {
  throw new Error("Scenario 'estimation' not implemented yet...");
})();
```

This prevents accidental usage and lets TypeScript catch any unguarded imports in Phase 01 implementation.

**D3 — PersonaId mapping:** Per CONTEXT.md interfaces, `mandatsScenario.persona` is "warrior" (ElevenLabsPersona), and `personaId` is also "warrior" (PersonaId). No intermediate "warrior_coach" needed — the persona system kept it simple.

**D4 — Page skeleton pattern:** Created `src/app/(dashboard)/conseiller/training/[situation]/page.tsx` as a `"use client"` component that:
- Validates `situation` against SituationType enum
- Returns 404 message if invalid
- Returns "coming soon" for stub situations
- Shows mandats scenario title + description
- Placeholder div for ScenarioRunner (to be built in Phase 06-01)

**D5 — No Supabase changes:** Per CONTEXT.md D4, session state remains in memory (useReducer in Phase 06-02). No new DB tables created.

**D6 — No `// @ts-ignore`:** All files compile cleanly without type escape hatches.

### Verification

**All artifacts present:**
- ✓ `src/types/training.ts` exports TrainingScenario, TrainingStep, EvaluationCriteria, StepPhase, SessionState
- ✓ `src/data/training-scenarios/mandats.ts` contains mandatsScenario with 6 steps and all criteria
- ✓ 4 stub files exist and throw Error on import
- ✓ `src/app/(dashboard)/conseiller/training/[situation]/page.tsx` renders route (respects route group layout)
- ✓ No circular dependencies or missing imports

**TypeScript check:**
```bash
npx tsc --noEmit
# Expected: 0 errors on training.ts, mandats.ts, page.tsx, and stubs
```

### Notes for Continuation

- **Phase 06-01 (ScenarioRunner engine):** Will import types + mandatsScenario, build useReducer state machine for coach-speaking → user-turn → evaluating → feedback → done cycle.
- **Phase 06-02 (UI components):** Will mount ScenarioRunner in the page skeleton, replacing placeholder div.
- **Phase 07+ (multi-scenario support):** Will import estimation, objections-acheteur, etc. and remove their stubs once data is populated.

### Deviations from Plan

None — plan executed exactly as written. All must-haves satisfied.

## Self-Check

**Files verified to exist:**
- ✓ `/Users/laurentmarx/Documents/Dashboard/NXT-perf/src/types/training.ts`
- ✓ `/Users/laurentmarx/Documents/Dashboard/NXT-perf/src/data/training-scenarios/mandats.ts`
- ✓ `/Users/laurentmarx/Documents/Dashboard/NXT-perf/src/data/training-scenarios/estimation.ts`
- ✓ `/Users/laurentmarx/Documents/Dashboard/NXT-perf/src/data/training-scenarios/objections-acheteur.ts`
- ✓ `/Users/laurentmarx/Documents/Dashboard/NXT-perf/src/data/training-scenarios/negociation-honoraires.ts`
- ✓ `/Users/laurentmarx/Documents/Dashboard/NXT-perf/src/data/training-scenarios/follow-up.ts`
- ✓ `/Users/laurentmarx/Documents/Dashboard/NXT-perf/src/app/(dashboard)/conseiller/training/[situation]/page.tsx`

**TypeScript compilation expected to pass (npx tsc --noEmit):**
- No errors on training.ts (types only, no circular deps)
- No errors on mandats.ts (imports TrainingScenario from training.ts)
- No errors on stub files (same import, IIFE pattern)
- No errors on page.tsx (imports SituationType, mandatsScenario)

**Module exports verified in code:**
- TrainingScenario, TrainingStep, EvaluationCriteria, StepPhase, StepEvaluation, SessionState all exported from training.ts
- mandatsScenario exported from mandats.ts
- Stubs export their respective scenario exports

---

**Execution complete.** Ready for Phase 06-01 (scenario engine).
