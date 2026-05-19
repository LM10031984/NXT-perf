# Phase 1 — Context Layer + Data Hygiene — Context

**Date:** 2026-05-19
**Mode:** `--auto` (decisions auto-selected with recommended option, logged inline)
**Source artifacts:** PROJECT.md, REQUIREMENTS.md, ROADMAP.md, research/SUMMARY.md, research/ARCHITECTURE.md, research/PITFALLS.md, codebase/STRUCTURE.md

---

## Phase Boundary

This phase delivers **pure-function foundations and data-hygiene work** that everything else in the milestone consumes. No UI. No LLM calls. No new API routes (with one exception: a smoke-test endpoint — see decision 6).

Concretely:
- A typed `CopilotContextPayload` and a `buildCopilotContext()` pure function
- A `src/lib/data-access.ts` thin wrapper
- A separate `src/stores/copilot-store.ts`
- `SITUATION_PERSONA_MAP` in `src/lib/constants.ts`
- A RAG health-check endpoint (smoke test only)
- Migration of 4 known mock-data-bypassing components

Out of this phase: streaming chat, copilot UI, training scenarios, dashboard refonte, onboarding wizard. Those land in later phases.

---

## Canonical Refs

| Ref | Path | Why |
|---|---|---|
| Vision + constraints | `.planning/PROJECT.md` | Core value, 5-role + 7-ratio constraints, FR language rules |
| All v1 requirements | `.planning/REQUIREMENTS.md` | Phase 1 covers DATA-01, DATA-02, COPILOT-07, COPILOT-08, RAG-01, RAG-05, TRAIN-04 |
| Phase plan | `.planning/ROADMAP.md` § Phase 1 | Goal + success criteria |
| Research summary | `.planning/research/SUMMARY.md` | Stack/architecture/pitfalls consolidation |
| Architecture detail | `.planning/research/ARCHITECTURE.md` | Component boundaries + integration points with existing `src/lib/` |
| Pitfalls catalog | `.planning/research/PITFALLS.md` | C-1 (context bloat), C-3 (mock data leak), I-3 (store pollution), I-5 (mock bypass) |
| Codebase conventions | `.planning/codebase/CONVENTIONS.md` | TypeScript strict, 5-role/7-ratio immutables, French UI |
| Existing RAG code | `src/lib/server/coach-rag/retrieve.ts` (and `system-prompt.ts`, `openai-embed.ts`) | RAG-01 reuses these unchanged |
| Existing copilot stub | `src/components/conseiller/layout/floating-copilote.tsx` | Phase 4 target (mentioned here only as the dependent consumer) |
| Existing store | `src/stores/app-store.ts` | Must NOT import `copilot-store.ts` (I-3) |
| Mock-bypass components | `src/app/(dashboard)/directeur/resultats/page.tsx`, `src/app/(dashboard)/manager/resultats/page.tsx`, `src/components/conseiller/diagnostic/key-figures-accordion.tsx`, `src/components/resultats/ventes-tab.tsx` | DATA-02 targets, confirmed by grep |

No external ADRs or specs for this phase.

---

## Decisions

### D1 — `CopilotContextPayload` shape: pragmatic minimum

The payload sent to the copilot server from the client carries **only** the fields that ground a coaching response for the current user:

- `userCategory: UserCategory` — "debutant" | "confirme" | "expert" (label "Junior/Confirmé/Expert" applied server-side via `CATEGORY_LABELS`)
- `computedRatios: ComputedRatio[]` — the 7 ratios with their `status` (surperf/stable/sousperf)
- `topCriticite: CriticitePoint | null` — single top criticité from `findCriticitePoints()`
- `currentMonthResults: PeriodResults | null` — current month only, NO history
- `userId: string` and `period: string` — for traceability only

Explicitly **excluded**: `users[]`, `networks`, `institutions`, other users' data of any kind, multi-month history, `financialData`, anything from manager/directeur/coach/reseau scope.

**Why:** PITFALLS C-1. Bigger payloads bloat tokens and risk leaking data across users. The RAG step (Phase 2) supplies coaching knowledge — the context payload supplies WHO the user is and WHERE they hurt, nothing else.

### D2 — Token budget allocation: smart split + log-alert

Hard cap **3000 tokens** for the entire system prompt body (context + RAG + concepts). Soft allocation:

| Slice | Soft budget |
|---|---|
| User context (computed from `CopilotContextPayload`) | ~1500 tokens |
| RAG chunks (`retrieveHybrid()` output, formatted) | ~1200 tokens |
| Concepts glossary (`listConcepts()` output) | ~300 tokens |

Implementation: a `tokenize()` helper using a cheap tokenizer estimator (e.g., character/4 heuristic if no tokenizer dep is in stack — verify during planning) wrapping each slice. If a slice exceeds its soft budget, the helper truncates it AND logs a `console.warn` with the slice name and overflow amount. If the total exceeds 3000, the helper truncates RAG chunks first (preserve user context).

**Why:** predictable costs + observable runtime behavior + ability to tune empirically without touching the LLM call site.

### D3 — `data-access.ts` depth: thin wrapper, documented migration point

```ts
// src/lib/data-access.ts
export function getWeeklyResults(userId: string, period: string): PeriodResults | null {
  return useAppStore.getState().results
    .find(r => r.userId === userId && r.period === period) ?? null
}
```

**No** repository interface, **no** mock-vs-prod feature flag, **no** Supabase pre-impl. Just a single function with a stable signature that consumers call instead of importing mock data directly. A `// MIGRATION:` comment in the file documents where Supabase fetch logic will replace the store read.

The 4 mock-bypass components migrate to use this function. Same `PeriodResults | null` return type — no caller-side change required.

**Why:** YAGNI. Pre-Supabase abstraction sounds future-proof but costs maintenance and would diverge from the actual schema we'll discover during migration. The signature is the contract; the implementation can swap atomically when ready.

### D4 — `copilot-store.ts` responsibilities: streaming + suggestions cache (NOT context payload)

```ts
// src/stores/copilot-store.ts — schema only, no impl
interface CopilotState {
  // Streaming state (Phase 2/3/4 consumers)
  messages: CopilotMessage[]          // current session only
  isStreaming: boolean
  streamAbort: AbortController | null

  // Suggestion cache (Phase 4 consumer)
  suggestions: SuggestionCard[]        // pre-computed 3 cards for the dashboard
  suggestionsLastFetchedAt: number | null
  suggestionsForRatioSignature: string | null  // invalidate when ratios change

  // Actions
  appendDelta(delta: string): void
  startStream(controller: AbortController): void
  endStream(): void
  setSuggestions(cards: SuggestionCard[], signature: string): void
  reset(): void
}
```

**Not in the store:** the `CopilotContextPayload` itself — built fresh from `buildCopilotContext()` on each request. Storing it would be a stale-state risk.

**Not in the store:** cross-session memory. Out of scope this milestone (v2).

`src/stores/app-store.ts` MUST NOT import or reference `copilot-store.ts` — verified via lint or grep check in tests.

**Why:** keeps the 467-strong `useAppStore` consumer list unaffected by copilot re-renders (PITFALLS I-3). Suggestions need caching because the dashboard re-mounts on navigation and we don't want to re-spend LLM tokens on every visit.

### D5 — `SITUATION_PERSONA_MAP` coverage: full enum, mandats data only

```ts
// src/lib/constants.ts — additions
export type SituationType =
  | "mandats"
  | "estimation"
  | "objections-acheteur"
  | "negociation-honoraires"
  | "follow-up"

export type ElevenLabsPersona = "kind" | "sport" | "warrior"

export const SITUATION_PERSONA_MAP: Record<SituationType, ElevenLabsPersona> = {
  "mandats": "warrior",                  // pitch fort, tone determined
  "estimation": "kind",                   // tone consultative, customer-facing
  "objections-acheteur": "sport",         // tone energetic, fast-paced
  "negociation-honoraires": "warrior",    // tone confident, decisive
  "follow-up": "kind",                    // tone warm, retention-focused
}

export const PERSONA_VOICE_ENV_VAR: Record<ElevenLabsPersona, string> = {
  kind: "ELEVENLABS_KIND_COACH_VOICE_ID",
  sport: "ELEVENLABS_SPORT_COACH_VOICE_ID",
  warrior: "ELEVENLABS_WARRIOR_VOICE_ID",
}
```

Only `mandats` will ship a usable scenario file in Phase 6. The other 4 are placeholders in the enum so the type system catches all branches today; Phase 6 plans MUST flag scenarios beyond `mandats` as out of scope (Train-my-agent port scope is already large).

**Why:** locks the type surface today, no enum churn later, makes Phase 6 planning explicit about which scenarios it owns.

### D6 — RAG pipeline verification: smoke-test endpoint

A new route `GET /api/copilot/rag-health` (the only API route added in this phase) calls `retrieveHybrid("test")` and returns:

```ts
// 200 OK
{
  ok: true,
  chunks: 12,
  syntheses: 4,
  embeddingLatencyMs: 230,
  retrievalLatencyMs: 85,
  driveFolderId: process.env.COACH_BRAIN_DRIVE_FOLDER_ID ?? null
}

// 500 (or 200 with ok:false)
{
  ok: false,
  error: "<exception message>",
  chunks: 0,
  syntheses: 0
}
```

Used as a readiness gate before Phase 2 lights up the chat endpoint. Authenticated route (requireAuth), rate-limited (1 call / 10s / user — prevent abuse). Zero LLM cost.

**Why:** observable, scriptable, fast feedback loop on the Drive→pgvector pipeline. Documents the assumption "RAG is operational" with a verifiable check.

---

## Specifics

- **Type names are non-negotiable:** `CopilotContextPayload`, `SuggestionCard`, `CopilotMessage`, `SituationType`, `ElevenLabsPersona`. Used as keys in CONTEXT/PLAN cross-references.
- **File locations are non-negotiable:**
  - `src/types/copilot.ts` — all copilot types
  - `src/lib/copilot-context.ts` — `buildCopilotContext()` + `tokenize()` helper
  - `src/lib/data-access.ts` — `getWeeklyResults()`
  - `src/lib/constants.ts` — extend with `SituationType`, `ElevenLabsPersona`, `SITUATION_PERSONA_MAP`, `PERSONA_VOICE_ENV_VAR`
  - `src/stores/copilot-store.ts` — separate Zustand store
  - `src/app/api/copilot/rag-health/route.ts` — smoke-test endpoint
- **French rule applies:** any log message, comment, or test description in French uses real characters (é, è, à, ç). Type names and code identifiers stay in English (matches existing conventions).
- **CATEGORY_LABELS reuse:** server-side prompt formatting uses existing `CATEGORY_LABELS` constant — don't duplicate the mapping.
- **No `ts-ignore` permitted in new files.** Strict TypeScript throughout.

## Anti-Decisions (deliberate non-choices)

- **No `discussMode` config flag** to gate this phase — config is already locked YOLO+auto.
- **No new package dependencies** added by Phase 1. (`ai`/`@ai-sdk/openai` evaluation is a Phase 2 question per SUMMARY.md.)
- **No tokenizer dependency.** If we need precise tokenization, planning Phase 2 decides — for Phase 1 budgeting, char/4 heuristic is enough.
- **No new tests are required in Phase 1** for the migration of 4 mock-bypass components — they're pure substitutions. A single lint/build check is sufficient.

---

## Deferred Ideas

These came up during analysis but are explicitly **out of Phase 1 scope** — captured for the backlog / future phases:

- Cross-session copilot memory (deferred to v2 per REQUIREMENTS.md)
- Repository pattern for data-access — only revisit when Supabase migration is scheduled
- Token budget instrumentation as a dashboard metric — nice-to-have, not blocking
- Mock-bypass migration for `app-store.ts` itself — out of scope (the store IS the source of truth for mock data right now; migration happens when Supabase wiring happens)
- Multi-locale support for `SITUATION_PERSONA_MAP` — single French market, single voice-per-situation, fine for v1

---

## Open Questions for Downstream Agents

Researcher / planner / verifier — read these before acting:

1. **Tokenizer choice for the soft budget enforcement.** Char/4 heuristic OR pulling in `gpt-tokenizer` / `js-tiktoken`? Decide during planning.
2. **`findCriticitePoints` signature accessibility.** Its `ThresholdContext` requires `avgCommissionEur`. Confirm during planning that this is derivable in `buildCopilotContext()` without adding a new store field.
3. **Existing `retrieve.ts` return shape.** `retrieveHybrid()` returns `{chunks, syntheses}` — confirm the smoke-test endpoint can read both arrays' `.length` without further parsing.
4. **Rate limit infra.** Confirm a rate-limit helper already exists in the codebase (research mentioned `checkRateLimit()`) — reuse it for the smoke-test endpoint.

---

## Definition of Done for Phase 1

A reviewer reading this CONTEXT.md, the codebase, and Phase 1's resulting plans should agree that:

1. `buildCopilotContext(userId, period)` exists, is typed, is unit-testable, and respects the 3000-token hard cap.
2. `src/stores/copilot-store.ts` exists, is NOT imported by `app-store.ts`, and lints clean.
3. `src/lib/data-access.ts` exposes `getWeeklyResults()` and the 4 mock-bypass components have been migrated to use it.
4. `SITUATION_PERSONA_MAP` exports the 5-situation enum with persona mapping in `src/lib/constants.ts`.
5. `GET /api/copilot/rag-health` returns `ok: true` when called against the live Supabase pgvector store with the Drive corpus indexed.
6. `npm run lint` and `npx tsc --noEmit` pass.

Phase 2's planner can read this file, see what types/functions Phase 1 will produce, and plan the streaming endpoint without re-asking these questions.
