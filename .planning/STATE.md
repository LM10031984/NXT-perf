---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to execute
stopped_at: Completed 01-context-layer-data-hygiene/01-01-PLAN.md — copilot type surface + buildCopilotContext
last_updated: "2026-05-19T17:38:07.914Z"
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 6
  completed_plans: 3
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** En 5 secondes, l'utilisateur comprend où il en est ET sait quoi faire ensuite
**Current focus:** Phase 01 — Context Layer + Data Hygiene

## Current Position

Phase: 01 (Context Layer + Data Hygiene) — EXECUTING
Plan: 4 of 6

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01-context-layer-data-hygiene P00 | 5 | 3 tasks | 5 files |
| Phase 01-context-layer-data-hygiene P04 | 5 | 1 tasks | 2 files |
| Phase 01-context-layer-data-hygiene P01 | 8min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: VocalFlow (Phase 3) placé AVANT Training Vocal (Phase 6) — dépendance infrastructure partagée `VocalFlow.tsx`
- Roadmap: DATA-01/DATA-02 groupés en Phase 1 avec le Context Layer (I-5 PITFALLS : cohérence données copilote vs. écran)
- Roadmap: COPILOT-08 (copilot-store.ts séparé) en Phase 1 car c'est une contrainte structurelle, pas une feature UI
- Roadmap: Phase 7 (Onboarding) indépendante des phases 2-6, peut être planifiée en parallèle si besoin
- Stack: Raw ReadableStream server-side (pas de Vercel AI SDK), custom hook OU useChat client-side validé en Phase 4
- Stack: OpenRouter → Anthropic Claude Sonnet uniquement pour ce milestone (autres providers désactivés dans la route copilote)
- Validation: Laurent (usage perso) — pas de testeurs externes cette milestone
- [Phase 01-context-layer-data-hygiene]: Wave 0: describe.skip (not it.skip) used for test stubs — entire suite group reports as skipped for cleaner CI output
- [Phase 01-context-layer-data-hygiene]: Wave 0: period = YYYY-MM convention captured as test case name in data-access.test.ts stub — locks downstream contract for plan 01-02
- [Phase 01-context-layer-data-hygiene]: Wave 0: rag-health route stub uses typed Promise<NextResponse> return — enables tsc build-gate coverage without importing production modules
- [Phase 01-context-layer-data-hygiene]: CONTEXT.md D5 verbatim — SituationType 5 values, mandats only opérationnel Phase 6, 4 autres placeholders pour type-locking
- [Phase 01-context-layer-data-hygiene]: buildCopilotContext accepte topCriticite en param pré-calculé (CriticitePoint | null) — caller exécute findCriticitePoints() séparément, maintient la pure function sans couplage pipeline diagnostic
- [Phase 01-context-layer-data-hygiene]: TOKEN_BUDGET: total=3000, userContext=1500, ragChunks=1200, concepts=300 — troncature computedRatios en premier (pop loop), identité utilisateur toujours préservée

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2] Drive corpus size + fraîcheur de l'index à vérifier (combien de docs dans `COACH_BRAIN_DRIVE_FOLDER_ID` ?)
- [Phase 6] Code training vocal externe : shape inconnue des composants/hooks/dépendances — risque le plus élevé du milestone
- [Phase 2] Confirmation streaming OpenRouter (`stream: true` + SSE) à smoke-tester avant implementation

## Session Continuity

Last session: 2026-05-19T17:38:07.911Z
Stopped at: Completed 01-context-layer-data-hygiene/01-01-PLAN.md — copilot type surface + buildCopilotContext
Resume file: None
