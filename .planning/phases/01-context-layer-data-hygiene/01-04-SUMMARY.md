---
phase: 01-context-layer-data-hygiene
plan: "04"
subsystem: constants / type-system
tags: [train-04, types, elevenlabs, situation-map, tdd]
dependency_graph:
  requires: [01-00]
  provides: [SituationType, ElevenLabsPersona, SITUATION_PERSONA_MAP, PERSONA_VOICE_ENV_VAR]
  affects: [phase-6-training-vocal, phase-4-dashboard-suggestions]
tech_stack:
  added: []
  patterns: [append-only constant extension, TDD red-green, Record<K,V> discriminated union maps]
key_files:
  created: []
  modified:
    - src/lib/constants.ts
    - src/lib/__tests__/constants.test.ts
decisions:
  - "CONTEXT.md D5 verbatim copy — no drift allowed on type names or persona assignments"
  - "Seul mandats est opérationnel en Phase 6 ; les 4 autres sont des placeholders type-locking"
  - "French UTF-8 characters in comments enforced per CLAUDE.md"
metrics:
  duration_minutes: 5
  completed_date: "2026-05-19"
  tasks_completed: 1
  files_modified: 2
requirements: [TRAIN-04]
---

# Phase 01 Plan 04: SituationType + ElevenLabsPersona constants — TRAIN-04 Summary

**One-liner:** Type-locked 5-situation enum with 3-persona ElevenLabs voice map appended to constants.ts, closing TRAIN-04 with 5 green vitest tests.

---

## What Was Built

Appended four exports to `src/lib/constants.ts` per CONTEXT.md D5 (locked verbatim):

### 5-situation enum (`SituationType`)

| Situation | Persona | Statut Phase 6 |
|---|---|---|
| `mandats` | `warrior` | opérationnel |
| `estimation` | `kind` | placeholder |
| `objections-acheteur` | `sport` | placeholder |
| `negociation-honoraires` | `warrior` | placeholder |
| `follow-up` | `kind` | placeholder |

Only `mandats` will ship a usable scenario file in Phase 6 (port de Train-my-agent). The other 4 exist solely to ensure the TypeScript compiler catches all switch/map branches at every Phase 6 callsite. Phase 6 plans MUST flag scenarios beyond `mandats` as out of scope.

### 3-persona enum (`ElevenLabsPersona`)

`"kind" | "sport" | "warrior"` — matches the 3 existing ElevenLabs voice IDs in `.env.local` (`ELEVENLABS_KIND_COACH_VOICE_ID`, `ELEVENLABS_SPORT_COACH_VOICE_ID`, `ELEVENLABS_WARRIOR_VOICE_ID`).

### `PERSONA_VOICE_ENV_VAR`

Maps each persona to the env var name (not the value) — consumers call `process.env[PERSONA_VOICE_ENV_VAR[persona]]` to resolve the voice ID at runtime. This keeps secrets out of the constants file.

### Phase 6 contract

```ts
// Phase 6 training route MUST type-gate like this:
function getVoiceId(situation: SituationType): string {
  const persona = SITUATION_PERSONA_MAP[situation];
  const envVar = PERSONA_VOICE_ENV_VAR[persona];
  const voiceId = process.env[envVar];
  if (!voiceId) throw new Error(`Voice ID not configured: ${envVar}`);
  return voiceId;
}
```

The TypeScript compiler will error if a new `SituationType` is added without updating `SITUATION_PERSONA_MAP` — no runtime surprise.

### Cross-reference

- `useCopilotStore` (plan 01-03) does NOT import these constants — verified by grep (0 hits in copilot-store.ts).
- Phase 4 dashboard suggestion buttons will consume `SituationType` when deep-linking to `/conseiller/training/[situation]`.
- `CATEGORY_LABELS`, `NXT_COLORS`, `GPS_THEME_LABELS` and all other existing exports are unchanged — confirmed by acceptance check (grep count ≥ 3 preserved).

---

## TDD Execution

| Phase | Commit | Outcome |
|---|---|---|
| RED | `c954224` | 5 tests written, 5 failing (TypeError: undefined) |
| GREEN | `591157a` | constants.ts extended, 5 tests passing |
| REFACTOR | — | No refactor needed (append-only, clean code) |

---

## Test Results

```
Test Files  1 passed (1)
     Tests  5 passed (5)
  Duration  97ms
```

---

## Acceptance Criteria Verification

| Check | Command | Result |
|---|---|---|
| 5 keys in SITUATION_PERSONA_MAP | grep count | 5 |
| Existing exports preserved | grep CATEGORY_LABELS\|NXT_COLORS\|GPS_THEME_LABELS | 3 |
| No unicode escapes | grep \\u00 | 0 |
| No ts-ignore | grep ts-ignore | 0 |
| No describe.skip in test file | grep describe.skip | 0 |
| TypeScript clean | npx tsc --noEmit | exit 0 |
| Vitest passes | npx vitest run constants.test.ts | 5/5 |
| Grep coverage | grep SituationType\|ElevenLabsPersona\|SITUATION_PERSONA_MAP | 13 lines |

---

## Deviations from Plan

None — plan executed exactly as written. CONTEXT.md D5 code block copied verbatim. French UTF-8 characters used in comments per CLAUDE.md constraint.

---

## Known Stubs

None — all 4 exports are fully wired. The 4 non-mandats `SituationType` values are intentional type-locking placeholders per CONTEXT.md D5 decision, not code stubs. Phase 6 plans will implement their scenario files when the Train-my-agent port scope is confirmed.

## Self-Check: PASSED

- `src/lib/constants.ts` — FOUND (extended)
- `src/lib/__tests__/constants.test.ts` — FOUND (active suite, 5 tests)
- Commit `c954224` (RED) — FOUND in git log
- Commit `591157a` (GREEN) — FOUND in git log
- `npx tsc --noEmit` — exit 0
- `npx vitest run src/lib/__tests__/constants.test.ts` — 5/5 passing
