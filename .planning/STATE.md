# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** En 5 secondes, l'utilisateur comprend où il en est ET sait quoi faire ensuite
**Current focus:** Phase 1 — Context Layer + Data Hygiene

## Current Position

Phase: 1 of 7 (Context Layer + Data Hygiene)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-05-19 — ROADMAP.md + STATE.md initialisés

Progress: [░░░░░░░░░░] 0%

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2] Drive corpus size + fraîcheur de l'index à vérifier (combien de docs dans `COACH_BRAIN_DRIVE_FOLDER_ID` ?)
- [Phase 6] Code training vocal externe : shape inconnue des composants/hooks/dépendances — risque le plus élevé du milestone
- [Phase 2] Confirmation streaming OpenRouter (`stream: true` + SSE) à smoke-tester avant implementation

## Session Continuity

Last session: 2026-05-19
Stopped at: Roadmap créé, STATE initialisé — prêt pour `/gsd:plan-phase 1`
Resume file: None
