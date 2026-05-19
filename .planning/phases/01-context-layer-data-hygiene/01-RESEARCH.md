# Phase 1: Context Layer + Data Hygiene — Research

**Researched:** 2026-05-19
**Domain:** TypeScript pure functions, Zustand store architecture, Next.js App Router API routes, RAG health verification
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D1 — CopilotContextPayload shape: pragmatic minimum**
- `userCategory: UserCategory`, `computedRatios: ComputedRatio[]`, `topCriticite: CriticitePoint | null`, `currentMonthResults: PeriodResults | null`, `userId: string`, `period: string`
- Explicitly excluded: `users[]`, `networks`, institutions, multi-month history, `financialData`, other-users data

**D2 — Token budget: smart split + log-alert**
- Hard cap 3000 tokens total. Soft split: ~1500 user context, ~1200 RAG chunks, ~300 concepts
- Tokenizer: char/4 heuristic (no new dependency in Phase 1)
- Truncation order: RAG chunks first, preserve user context
- `console.warn` with slice name + overflow amount when soft budget exceeded

**D3 — data-access.ts: thin wrapper, documented migration point**
- Single function: `getWeeklyResults(userId, period): PeriodResults | null`
- Reads from `useAppStore.getState().results` — no mock, no Supabase, no feature flag
- `// MIGRATION:` comment documents the swap point
- 4 components migrate to use it

**D4 — copilot-store.ts: streaming + suggestions cache**
- Schema as defined in CONTEXT.md (messages, isStreaming, streamAbort, suggestions, suggestionsLastFetchedAt, suggestionsForRatioSignature + 6 actions)
- `CopilotContextPayload` is NOT stored (built fresh on each request)
- `app-store.ts` MUST NOT import `copilot-store.ts`

**D5 — SITUATION_PERSONA_MAP: full enum, mandats data only**
- Exact code as specified in CONTEXT.md (5 situations, 3 personas, PERSONA_VOICE_ENV_VAR)
- Only `mandats` scenario ships in Phase 6; others are type-locked placeholders

**D6 — RAG health smoke-test endpoint**
- Route: `GET /api/copilot/rag-health`
- Calls `retrieveHybrid("test")`, measures latency, returns `{ ok, chunks, syntheses, embeddingLatencyMs, retrievalLatencyMs, driveFolderId }`
- Authenticated (`requireAuth`), rate-limited (1/10s/user)

### File locations (non-negotiable)
- `src/types/copilot.ts` — all copilot types
- `src/lib/copilot-context.ts` — `buildCopilotContext()` + `tokenize()` helper
- `src/lib/data-access.ts` — `getWeeklyResults()`
- `src/lib/constants.ts` — extend with `SituationType`, `ElevenLabsPersona`, maps
- `src/stores/copilot-store.ts` — separate Zustand store
- `src/app/api/copilot/rag-health/route.ts` — smoke-test endpoint

### Claude's Discretion
- None specified for Phase 1 (all decisions locked or deferred)

### Deferred Ideas (OUT OF SCOPE)
- Cross-session copilot memory
- Repository pattern for data-access
- Token budget instrumentation as dashboard metric
- Mock-bypass migration for `app-store.ts` itself
- Multi-locale support for SITUATION_PERSONA_MAP
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | New `src/lib/data-access.ts` exposes `getWeeklyResults(userId, period)` reading from store | D3: signature verified against `useAppStore.getState().results` array shape (`PeriodResults[]`) |
| DATA-02 | 4 components that import mock data directly are migrated to the data-access layer | 4 files confirmed and imports verified (see §Mock-Bypass Audit) |
| COPILOT-07 | `buildCopilotContext(userId)` hard-caps payload at 3000 tokens; never serializes forbidden fields | D1+D2: char/4 heuristic confirmed sufficient; `findCriticitePoints` signature verified |
| COPILOT-08 | Copilot state lives in dedicated `src/stores/copilot-store.ts`, never imported in `app-store.ts` | D4: Zustand 5 pattern verified; isolation guaranteed by grep/lint check |
| RAG-01 | Copilot uses existing `retrieveHybrid()` from `src/lib/server/coach-rag/retrieve.ts` | Signature confirmed: `retrieveHybrid(query, options?) → Promise<RetrievalBundle>` |
| RAG-05 | Drive ingestion pipeline operational and verifiable | D6: smoke-test endpoint reads `bundle.chunks.length` + `bundle.syntheses.length` |
| TRAIN-04 | `SITUATION_PERSONA_MAP` in `src/lib/constants.ts` maps each scenario to a voice | D5: exact enum code ready; `constants.ts` current content verified (no conflicts) |
</phase_requirements>

---

## Summary

Phase 1 is pure TypeScript scaffolding with no UI, no LLM calls, and no new npm packages. The codebase already has all the plumbing this phase consumes: the RAG retrieval stack (`retrieveHybrid`), the computation functions (`computeAllRatios`, `findCriticitePoints`), the Zustand store pattern, and the rate-limiting helper. The research task was to verify exact function signatures, confirm the mock-bypass components, and resolve the four open questions from CONTEXT.md.

All open questions are answered:

1. **Tokenizer choice**: char/4 heuristic confirmed — no tokenizer package needed (D2 anti-decision held).
2. **`avgCommissionEur` derivability**: confirmed derivable from `useAppStore.getState().agencyObjective?.avgActValue` without a new store field. The fallback pattern from `use-user-context.ts` (FALLBACK 8000€) applies when `agencyObjective` is null.
3. **`retrieveHybrid()` return shape**: returns `RetrievalBundle { chunks: RetrievedChunk[], syntheses: RetrievedSynthesis[] }` — the smoke-test endpoint reads `.length` on both arrays with zero further parsing.
4. **Rate-limit helper**: `checkRateLimit(key, maxRequests, windowMs)` exists at `src/lib/rate-limit.ts`. Already used by `post-saisie-tip` and `coach-nudge`. Identical pattern applies to `rag-health`.

The `ventes-tab.tsx` DATA-02 case differs from the other three: it imports `mockMonthlyCA` (a `{ month, ca }[]` chart data array), not a `PeriodResults` object. The migration is simpler than expected — the chart data should either be derived from real `PeriodResults` passed via props or moved to a static constant. This requires a judgment call (see §Mock-Bypass Audit).

**Primary recommendation:** Implement in dependency order — types first, then `data-access.ts` + mock migrations, then `copilot-context.ts` + `copilot-store.ts`, then `constants.ts` additions, then `rag-health` endpoint. Build passes `npx tsc --noEmit` before each commit.

---

## Standard Stack

### Core (already installed — zero new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.11 | State store for `copilot-store.ts` | Existing pattern for all stores (`app-store.ts`, `badge-store.ts`, `manager-scope-store.ts`) |
| TypeScript strict | 5.x | Type-safe payload and store definitions | Project-enforced (`strict: true` in tsconfig) |
| Next.js App Router | 16.1.6 | `GET /api/copilot/rag-health/route.ts` | Existing API route pattern |
| @supabase/supabase-js | 2.98.0 | `retrieveHybrid` calls Supabase pgvector RPCs | Already wired in `retrieve.ts` |

### Anti-Decisions (confirmed by research)

| Instead of | Decision | Reason |
|------------|----------|--------|
| `gpt-tokenizer` / `js-tiktoken` | char/4 heuristic | D2 anti-decision: "No tokenizer dependency." Phase 1 char/4 is sufficient for budget enforcement; exact tokenization is a Phase 2 concern. |
| Repository pattern | Direct `useAppStore.getState()` read | D3 anti-decision: YAGNI. Supabase schema unknown until migration. |
| Storing payload in copilot-store | Build fresh on each request | D4 anti-decision: stale-state risk. |

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 additions only)

```
src/
├── types/
│   └── copilot.ts              # CopilotContextPayload, CopilotMessage, SuggestionCard (new)
├── lib/
│   ├── copilot-context.ts       # buildCopilotContext() + tokenize() (new)
│   ├── data-access.ts           # getWeeklyResults() (new)
│   └── constants.ts             # extend: SituationType, ElevenLabsPersona, maps (extend)
├── stores/
│   └── copilot-store.ts         # CopilotState Zustand store (new)
└── app/api/copilot/
    └── rag-health/
        └── route.ts             # GET smoke-test (new)
```

### Pattern 1: Thin data-access wrapper

```typescript
// src/lib/data-access.ts
import { useAppStore } from "@/stores/app-store";
import type { PeriodResults } from "@/types/results";

/**
 * Reads results for a specific user + period from the Zustand store.
 * MIGRATION: replace the store read with a Supabase query when the
 * data layer is ready. Signature stays identical.
 */
export function getWeeklyResults(
  userId: string,
  period: string
): PeriodResults | null {
  return (
    useAppStore.getState().results.find(
      (r) => r.userId === userId && r.period === period
    ) ?? null
  );
}
```

Note on `period` matching: `PeriodResults` uses `periodStart` / `periodEnd` fields (strings like `"2026-02-01"`), NOT a single `period: string` field. The `getWeeklyResults` function signature uses `period` as a parameter name, but the matching logic will need to pick a convention: either match on `periodStart` (simplest) or use a composite like `"YYYY-MM"`. Research found no existing `period` string field on `PeriodResults` — this is a **resolution gap** the planner must address (see §Open Questions #1).

### Pattern 2: Zustand store (isolated)

```typescript
// src/stores/copilot-store.ts
import { create } from "zustand";
import type { CopilotMessage, SuggestionCard } from "@/types/copilot";

interface CopilotState {
  messages: CopilotMessage[];
  isStreaming: boolean;
  streamAbort: AbortController | null;
  suggestions: SuggestionCard[];
  suggestionsLastFetchedAt: number | null;
  suggestionsForRatioSignature: string | null;

  appendDelta: (delta: string) => void;
  startStream: (controller: AbortController) => void;
  endStream: () => void;
  setSuggestions: (cards: SuggestionCard[], signature: string) => void;
  reset: () => void;
}

export const useCopilotStore = create<CopilotState>((set) => ({
  messages: [],
  isStreaming: false,
  streamAbort: null,
  suggestions: [],
  suggestionsLastFetchedAt: null,
  suggestionsForRatioSignature: null,

  appendDelta: (delta) =>
    set((s) => {
      const last = s.messages[s.messages.length - 1];
      if (!last || last.role !== "assistant") {
        return { messages: [...s.messages, { role: "assistant", content: delta }] };
      }
      const updated = [...s.messages];
      updated[updated.length - 1] = { ...last, content: last.content + delta };
      return { messages: updated };
    }),
  startStream: (controller) => set({ isStreaming: true, streamAbort: controller }),
  endStream: () => set({ isStreaming: false, streamAbort: null }),
  setSuggestions: (cards, signature) =>
    set({
      suggestions: cards,
      suggestionsLastFetchedAt: Date.now(),
      suggestionsForRatioSignature: signature,
    }),
  reset: () =>
    set({
      messages: [],
      isStreaming: false,
      streamAbort: null,
    }),
}));
```

### Pattern 3: tokenize() helper (char/4 heuristic)

```typescript
// src/lib/copilot-context.ts (excerpt)
const CHARS_PER_TOKEN = 4;

export function tokenize(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function truncateToTokenBudget(
  text: string,
  budgetTokens: number,
  sliceName: string
): string {
  const actual = tokenize(text);
  if (actual <= budgetTokens) return text;
  console.warn(
    `[copilot-context] tranche "${sliceName}" dépasse le budget : ` +
      `${actual} tokens estimés vs ${budgetTokens} max. Troncature appliquée.`
  );
  return text.slice(0, budgetTokens * CHARS_PER_TOKEN);
}
```

### Pattern 4: rag-health route (reusing existing helpers)

```typescript
// src/app/api/copilot/rag-health/route.ts
import { NextResponse } from "next/server";
import { requireAuth, getClientIp } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { retrieveHybrid } from "@/lib/server/coach-rag/retrieve";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { user } = authResult;

  const rateKey = `rag-health:user:${user.id}`;
  const { allowed } = checkRateLimit(rateKey, 1, 10_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const t0 = Date.now();
    const bundle = await retrieveHybrid("test");
    const retrievalLatencyMs = Date.now() - t0;

    return NextResponse.json({
      ok: true,
      chunks: bundle.chunks.length,
      syntheses: bundle.syntheses.length,
      embeddingLatencyMs: 0,   // NOTE: embedText timing not exposed by retrieveHybrid; see §Open Questions #2
      retrievalLatencyMs,
      driveFolderId: process.env.COACH_BRAIN_DRIVE_FOLDER_ID ?? null,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[api/copilot/rag-health]", error);
    return NextResponse.json(
      { ok: false, error, chunks: 0, syntheses: 0 },
      { status: 500 }
    );
  }
}
```

### Pattern 5: buildCopilotContext() — ThresholdContext without a new store field

`findCriticitePoints` requires a `ThresholdContext` with:
```typescript
{
  seniority: "junior" | "confirme" | "expert",
  agentStatus: AgentStatus | null,
  teamSizeBucket: TeamSizeBucket,
  avgCommissionEur: number
}
```

`avgCommissionEur` is derivable from `useAppStore.getState().agencyObjective?.avgActValue` with the same 8000€ fallback used by `use-user-context.ts`. No new store field required. The `seniority` comes from `user.category`, `agentStatus` from `user.agentStatus`, and `teamSizeBucket` can default to `"small"` in the pure-function context (where team size is unknown without a hook — see §Open Questions #3).

### Anti-Patterns to Avoid

- **Importing `copilot-store.ts` from `app-store.ts`:** violates I-3. Verified: 467 components already subscribe to `app-store`; adding copilot re-renders to that graph would cascade. The lint/grep check in tests must verify this.
- **Storing `CopilotContextPayload` in the copilot store:** stale-state risk (D4 anti-decision). Build it fresh in the route handler.
- **Using `useAppStore()` as a hook inside `buildCopilotContext()`:** `buildCopilotContext` is a pure function called server-side. It must use `useAppStore.getState()` (the synchronous getter), NOT the React hook subscription. The hook throws outside a component.
- **Re-introducing `delaiMoyenVente`, `VenteInfo`, or other removed fields** in any new type file. ESLint blocks them; TypeScript strict will catch it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| In-memory rate limiting | Custom Map-based limiter | `checkRateLimit()` from `@/lib/rate-limit` | Already exists, already tested by usage in 2+ routes |
| Auth check in API route | Custom cookie parsing | `requireAuth()` from `@/lib/api-auth` | Supabase SSR cookie handling correctly scoped |
| Zustand store boilerplate | Custom store without `create<T>` | `create<CopilotState>(...)` from `zustand` | Existing store pattern in project (3 stores already follow it) |
| Token counting | tiktoken/gpt-tokenizer installation | `Math.ceil(text.length / 4)` | Anti-decision locked: no tokenizer dep in Phase 1 |
| RAG retrieval | New vector DB or new RPC | `retrieveHybrid()` from `@/lib/server/coach-rag/retrieve` | Already production-ready with hybrid BM25+vector |

---

## Mock-Bypass Audit (DATA-02)

Four files confirmed to import mock data directly. Exact import and usage:

### 1. `src/app/(dashboard)/directeur/resultats/page.tsx`
- **Import:** `import { mockWeeklyResults, mockYearlyResults } from "@/data/mock-results";` (line 22)
- **Usage:** `return isDemo ? mockWeeklyResults : null;` — used as fallback when no real weekly/yearly result is found
- **Migration:** Replace with `getWeeklyResults(userId, period)` for the month key. Weekly/yearly views may need `getWeeklyResults` variant — planner must decide whether to extend data-access or scope DATA-02 to month-only.

### 2. `src/app/(dashboard)/manager/resultats/page.tsx`
- **Import:** `import { mockWeeklyResults, mockYearlyResults } from "@/data/mock-results";` (line 23)
- **Usage:** Same pattern — `return isDemo ? mockWeeklyResults : null;` for individual conseiller results
- **Migration:** Same as directeur case.

### 3. `src/components/conseiller/diagnostic/key-figures-accordion.tsx`
- **Import:** `import { mockWeeklyResults } from "@/data/mock-results";` (line 13)
- **Usage:** `if (period === "semaine") return isDemo ? mockWeeklyResults : null;` (line 73)
- **Migration:** Replace with `getWeeklyResults(user.id, currentPeriod)` — the `user` and `useResults()` hook are already imported. Clean swap.

### 4. `src/components/resultats/ventes-tab.tsx`
- **Import:** `import { mockMonthlyCA } from "@/data/mock-results";` (line 7)
- **Usage:** `data={mockMonthlyCA}` — feeds a `LineChart` with `{ month: string, ca: number }[]` (a chart data array, NOT `PeriodResults`)
- **Migration:** This case is **different** from the others. `mockMonthlyCA` is chart visualization data derived from historical CA, not a `PeriodResults` object. It cannot be replaced by `getWeeklyResults()`. Two options:
  - (a) Promote the mock array to a static constant in `src/lib/constants.ts` or a separate `src/data/chart-data.ts` (not a mock file) — keeps the chart working without importing from `mock-results.ts`
  - (b) Accept that the chart data remains hardcoded until the Supabase migration produces real historical CA arrays
  - **Recommendation:** Option (a) — move `mockMonthlyCA` to a non-mock location so the import is no longer from `@/data/mock-results`. The component signature and behavior are unchanged.

---

## Existing Function Signatures (verified)

### `retrieveHybrid()` — confirmed

```typescript
// src/lib/server/coach-rag/retrieve.ts
export async function retrieveHybrid(
  query: string,
  options: { topChunks?: number; topSyntheses?: number } = {}
): Promise<RetrievalBundle>

export interface RetrievalBundle {
  chunks: RetrievedChunk[];   // default topK = 6
  syntheses: RetrievedSynthesis[];  // default topK = 4
}
```

The smoke-test reads `bundle.chunks.length` and `bundle.syntheses.length` — no further parsing needed. The function never throws on RPC error; it logs `console.error` and returns empty arrays. The smoke-test `ok: false` path triggers only on `embedText()` failure or unhandled exception, NOT on empty results — the planner should note that empty arrays with `ok: true` are a valid (but concerning) response indicating the corpus is not indexed.

### `computeAllRatios()` — confirmed

```typescript
// src/lib/ratios.ts
export function computeAllRatios(
  results: PeriodResults,
  category: UserCategory,
  ratioConfigs: Record<RatioId, RatioConfig> = defaultRatioConfigs
): ComputedRatio[]
```

Returns 8 ratios (7 core + `honoraires_moyens`). The `ComputedRatio` type:
```typescript
interface ComputedRatio {
  ratioId: string;
  value: number;
  thresholdForCategory: number;
  status: "ok" | "warning" | "danger";
  percentageOfTarget: number;
}
```

### `findCriticitePoints()` — confirmed

```typescript
// src/lib/diagnostic-criticite.ts
export function findCriticitePoints(
  measured: MeasuredRatio[],
  ctx: ThresholdContext,
  results: PeriodResults | null,
  category: UserCategory,
  periodMonths: number
): DiagnosticCriticite

export interface DiagnosticCriticite {
  top: CriticitePoint | null;
  others: CriticitePoint[];
}
```

`buildCopilotContext()` needs `topCriticite: CriticitePoint | null` — it takes `result.top`. The `MeasuredRatio[]` input comes from the pain-point-detector pipeline, which is not a simple transform of `ComputedRatio[]`. This is the most complex input to build (see §Open Questions #3).

### `ThresholdContext` — confirmed

```typescript
// src/lib/diagnostic/resolve-threshold.ts
export interface ThresholdContext {
  seniority: "junior" | "confirme" | "expert";
  agentStatus: AgentStatus | null;
  teamSizeBucket: TeamSizeBucket;  // "solo" | "small" | "medium" | "large"
  avgCommissionEur: number;
}
```

`avgCommissionEur` comes from `useAppStore.getState().agencyObjective?.avgActValue ?? 8000`. Confirmed derivable without a new store field (confirmed HIGH).

### `checkRateLimit()` — confirmed

```typescript
// src/lib/rate-limit.ts
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number }
```

For the rag-health endpoint: `checkRateLimit(\`rag-health:user:${user.id}\`, 1, 10_000)` — exactly as CONTEXT.md specifies (1 call / 10s / user).

### `useAppStore.getState().results` — confirmed

```typescript
// store slice
results: PeriodResults[];  // populated in enterDemo() + addResults() / setResults()
```

`getWeeklyResults` reads this array. `PeriodResults` has `userId`, `periodStart`, `periodEnd`, `periodType` — but NO single `period: string` field. The `period` parameter in `getWeeklyResults(userId, period)` must be matched against one of these (see §Open Questions #1).

---

## Common Pitfalls

### Pitfall 1: `period` string mismatch in getWeeklyResults
**What goes wrong:** `getWeeklyResults("u-demo-1", "2026-02")` finds nothing because `PeriodResults` has no `period` field — it has `periodStart: "2026-02-01"` and `periodEnd: "2026-02-28"`.
**Why it happens:** The CONTEXT.md signature uses `period: string` (probably meaning a YYYY-MM key) but the store shape uses `periodStart`/`periodEnd` strings.
**How to avoid:** Define the convention in `data-access.ts`: e.g., `period = periodStart.slice(0, 7)` (extract YYYY-MM from `periodStart`). Or match on `periodType === "month" && periodStart.startsWith(period)`.
**Warning signs:** TypeScript won't catch this at compile time; unit test for `getWeeklyResults` with a known period string will.

### Pitfall 2: buildCopilotContext uses React hook instead of getState()
**What goes wrong:** `useAppStore(s => s.results)` called inside a pure function that runs server-side — throws "Invalid hook call".
**Why it happens:** Developers copy from component patterns where the hook is the norm.
**How to avoid:** In `copilot-context.ts`, always use `useAppStore.getState()` — the synchronous getState accessor works outside React. Add a lint comment `// pure fn — use getState(), not hook` at the top of the file.
**Warning signs:** Runtime error "Hooks can only be called inside function components."

### Pitfall 3: app-store.ts accidentally imports copilot-store.ts
**What goes wrong:** The 467-strong `useAppStore` consumer list gets re-rendered on every copilot streaming tick.
**Why it happens:** A developer adds copilot state to the existing store for convenience.
**How to avoid:** The test suite must include a grep check: `grep -r "copilot-store" src/stores/app-store.ts` must return empty.
**Warning signs:** The app-wide re-render budget spikes on streaming.

### Pitfall 4: ventes-tab VentesTab chart data sourced from mock-results
**What goes wrong:** `data-access.ts` migration is considered "done" but `ventes-tab.tsx` still imports from `@/data/mock-results.ts`.
**Why it happens:** `mockMonthlyCA` is chart data, not a `PeriodResults` object — the migration strategy differs from the other three files.
**How to avoid:** Move `mockMonthlyCA` to a static data constant file (not `mock-*.ts`) during DATA-02 migration. The data itself doesn't change — only the import source.
**Warning signs:** `grep -r "from.*mock-results" src/` still matches `ventes-tab.tsx` after the migration.

### Pitfall 5: RAG smoke-test returns ok:true with 0 chunks
**What goes wrong:** The endpoint returns 200 OK with `chunks: 0, syntheses: 0` — interpreted as success but actually means the corpus is not indexed.
**Why it happens:** `retrieveHybrid` never throws on empty results; it logs and returns empty arrays.
**How to avoid:** Either (a) add `ok: bundle.chunks.length > 0 || bundle.syntheses.length > 0` to signal "RAG ready" vs "RAG reachable but empty", or (b) document the distinction in the response. The CONTEXT.md D6 spec does not address this case — planner must decide.
**Warning signs:** Phase 2 chat endpoint returns contextless responses despite the smoke-test returning 200.

### Pitfall 6: SituationType/ElevenLabsPersona naming conflict with future types
**What goes wrong:** Adding `SituationType` to `constants.ts` conflicts with an existing `SituationType` elsewhere.
**Why it happens:** Large codebases accumulate similar names.
**How to avoid:** Run `grep -r "SituationType\|ElevenLabsPersona" src/` before writing — currently returns 0 results (confirmed clean). The additions to `constants.ts` will be the only definitions.

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Import from `@/data/mock-*.ts` directly in components | Read from `getWeeklyResults()` abstraction layer | DATA-02 migration |
| No copilot store (stub component only) | Separate `copilot-store.ts` with Zustand 5 | COPILOT-08 |
| No typed context payload | `CopilotContextPayload` in `src/types/copilot.ts` | COPILOT-07 |
| No situation/persona mapping | `SITUATION_PERSONA_MAP` in `constants.ts` | TRAIN-04 |

---

## Open Questions

1. **`getWeeklyResults(userId, period)` — what does `period` match against?**
   - What we know: `PeriodResults` has `periodStart: string` (YYYY-MM-DD), `periodEnd: string`, `periodType: "day" | "week" | "month"`. No `period` field.
   - What's unclear: The exact convention for the `period` parameter. Should it be `"2026-02"` (YYYY-MM), matching `periodStart.slice(0, 7)`? Or `"2026-02-01"` (exact date)?
   - Recommendation: Adopt `period = "YYYY-MM"` convention. Match: `r.userId === userId && r.periodStart.startsWith(period) && r.periodType === "month"`. Document this convention in `data-access.ts`.

2. **`embeddingLatencyMs` in the RAG health response**
   - What we know: `retrieveHybrid()` calls `embedText()` internally but does not return timing. The D6 spec expects `embeddingLatencyMs` in the response.
   - What's unclear: Whether to measure total round-trip latency as a proxy, or to fork `embedText()` call separately before calling the RPCs.
   - Recommendation: Use two separate timing probes — one wrapping `embedText("test", "query")` directly, one wrapping the two RPC calls. This requires calling `embedText` once extra (cheap: ~50ms), then passing the embedding to `retrieveChunks` + `retrieveSyntheses` separately instead of using `retrieveHybrid`. Or simply report `embeddingLatencyMs: 0` and a single `totalLatencyMs` (simpler, loses granularity). Planner must pick.

3. **`MeasuredRatio[]` input to `findCriticitePoints()` — how to build it in `buildCopilotContext()`**
   - What we know: `findCriticitePoints` takes `MeasuredRatio[]` (from `@/lib/pain-point-detector`), not `ComputedRatio[]`. This is a more complex type used by the diagnostic pipeline.
   - What's unclear: Whether `buildCopilotContext()` should call the full diagnostic pipeline to get `topCriticite`, or use a simpler proxy (e.g., just the top `ComputedRatio` by status).
   - Recommendation: For the pure-function `buildCopilotContext()`, consider accepting `topCriticite: CriticitePoint | null` as an **input parameter** built externally (from a hook like `useDiagnosticCriticite`) rather than computing it internally. This keeps `buildCopilotContext` testable without needing to mock the full diagnostic pipeline. The caller (the API route) assembles all inputs and passes them in. Signature becomes: `buildCopilotContext(userId: string, period: string, ctx: BuildCopilotContextInput): CopilotContextPayload`.

4. **`ok: true` with 0 chunks in the smoke-test**
   - What we know: The CONTEXT.md D6 spec does not distinguish between "RAG reachable but empty" and "RAG fully loaded".
   - Recommendation: Return `ok: bundle.chunks.length > 0 || bundle.syntheses.length > 0` to make the gate meaningful. Add an `indexed: boolean` field or use `ok` for both "reachable" and "non-empty". Phase 2 will treat `ok: false` as a blocker.

---

## Project Constraints (from CLAUDE.md)

All directives apply to Phase 1 code:

- **French UI language:** Any `console.warn` messages, comments in French code, test descriptions must use real UTF-8 characters (é, è, à, ç). Type identifiers stay in English.
- **No `ts-ignore` in new files:** Strict TypeScript throughout. All types must be explicit.
- **7 ratios only:** `delai_moyen_vente` must not appear in any new type. ESLint will catch it.
- **5 roles immutable:** No new roles; no role-related changes needed in Phase 1.
- **"Junior" label:** `debutant` displays as "Junior" via `CATEGORY_LABELS` — copilot prompt uses `CATEGORY_LABELS[user.category]` when formatting the human-readable persona string.
- **No new backend beyond API routes:** `copilot-store.ts` is client-side Zustand; `rag-health` is a Next.js API route — both compliant.
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY` is server-only (used by `retrieve.ts` via `getServiceClient()`). Never expose in client-side code or copilot payload.
- **No new state library:** Zustand is the approved library. `copilot-store.ts` uses `create` from `zustand` — compliant.
- **GSD workflow:** All edits via GSD execute-phase workflow per CLAUDE.md enforcement section.

---

## Environment Availability

Step 2.6: SKIPPED (no external tool dependencies beyond already-installed packages. `retrieveHybrid` uses Supabase pgvector — the connection is an env-var concern validated by the rag-health endpoint itself at runtime, not a build-time dependency.)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (exists — path alias `@/*` → `./src/*` configured) |
| Quick run command | `npx vitest run src/lib/__tests__/copilot-context.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COPILOT-07 | `buildCopilotContext()` caps total at 3000 tokens | unit | `npx vitest run src/lib/__tests__/copilot-context.test.ts` | ❌ Wave 0 |
| COPILOT-07 | `buildCopilotContext()` excludes `users[]` and `networks` fields | unit (type-level) | `npx tsc --noEmit` | ❌ Wave 0 (enforced by type system) |
| COPILOT-08 | `copilot-store.ts` not imported by `app-store.ts` | structural (grep) | `grep -r "copilot-store" src/stores/app-store.ts \| wc -l` returns 0 | ❌ Wave 0 (script check) |
| DATA-01 | `getWeeklyResults(userId, period)` returns null when no match | unit | `npx vitest run src/lib/__tests__/data-access.test.ts` | ❌ Wave 0 |
| DATA-01 | `getWeeklyResults` returns correct PeriodResults for known userId+period | unit | same | ❌ Wave 0 |
| DATA-02 | 4 components no longer import from `@/data/mock-results` | structural (grep) | `grep -rn "from.*mock-results" src/app/\(dashboard\)/directeur/resultats src/app/\(dashboard\)/manager/resultats src/components/conseiller/diagnostic/key-figures-accordion.tsx src/components/resultats/ventes-tab.tsx` returns 0 | manual verification |
| RAG-01 | `retrieveHybrid()` is used unchanged (no new wrapper) | build | `npx tsc --noEmit` | existing |
| RAG-05 | `/api/copilot/rag-health` returns `ok: true` with `chunks > 0` | smoke (manual) | `curl -s http://localhost:3000/api/copilot/rag-health` (authenticated) | ❌ Wave 0 (route) |
| TRAIN-04 | `SITUATION_PERSONA_MAP` has all 5 situations | unit | `npx vitest run src/lib/__tests__/constants.test.ts` | ❌ Wave 0 |
| All | Build passes lint + tsc | build gate | `npx next lint && npx tsc --noEmit` | existing |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit && npx next lint`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** All unit tests green + smoke-test endpoint manually verified + `npm run build` passes

### Wave 0 Gaps (must exist before implementation)

- [ ] `src/lib/__tests__/copilot-context.test.ts` — covers COPILOT-07 token cap behavior and payload field exclusion
- [ ] `src/lib/__tests__/data-access.test.ts` — covers DATA-01 null return + match return
- [ ] `src/lib/__tests__/constants.test.ts` — covers TRAIN-04 SITUATION_PERSONA_MAP completeness (all 5 keys present)
- [ ] Grep script check for COPILOT-08 (can be a one-liner in the vitest test file using `fs.readFileSync`)

Note per CONTEXT.md anti-decision: "No new tests are required in Phase 1 for the migration of 4 mock-bypass components — they're pure substitutions. A single lint/build check is sufficient." Wave 0 gaps are therefore limited to the pure-function tests above.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `src/lib/server/coach-rag/retrieve.ts` — `retrieveHybrid()` exact signature and `RetrievalBundle` type verified
- `src/lib/ratios.ts` — `computeAllRatios()` signature and `ComputedRatio` type verified
- `src/lib/diagnostic-criticite.ts` — `findCriticitePoints()` signature, `ThresholdContext` import path, `CriticitePoint` type verified
- `src/lib/diagnostic/resolve-threshold.ts` — `ThresholdContext` interface definition confirmed
- `src/stores/app-store.ts` — `results: PeriodResults[]` slice confirmed; `agencyObjective.avgActValue` confirmed
- `src/hooks/use-user-context.ts` — `avgCommissionEur` derivation pattern confirmed (fallback 8000€)
- `src/lib/rate-limit.ts` — `checkRateLimit()` signature confirmed
- `src/lib/api-auth.ts` — `requireAuth()` signature confirmed
- `src/lib/constants.ts` — current content verified (no SituationType conflict)
- `src/types/results.ts` — `PeriodResults` field set confirmed (no `period` string field)
- `src/types/ratios.ts` — `ComputedRatio`, `RatioId` confirmed
- `src/types/user.ts` — `UserCategory`, `AgentStatus`, `UserRole` confirmed
- `vitest.config.ts` — test framework config confirmed
- `src/lib/__tests__/` — 5 existing test files confirmed (pattern for new tests)
- All 4 mock-bypass components — exact import lines and usage lines confirmed

### Secondary (MEDIUM confidence)

- `.planning/research/SUMMARY.md` — stack decisions cross-validated with codebase inspection
- `.planning/codebase/CONVENTIONS.md` — import order and naming conventions cross-validated

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; all libraries direct codebase inspection
- Architecture: HIGH — patterns verified against existing working code in the same repo
- Pitfalls: HIGH — three of six pitfalls are derived from direct codebase reading; three from SUMMARY.md pitfalls catalog
- Open questions: MEDIUM — unresolvable without implementation decisions (planner must address)

**Research date:** 2026-05-19
**Valid until:** 2026-06-18 (stable domain; no external library changes expected)
