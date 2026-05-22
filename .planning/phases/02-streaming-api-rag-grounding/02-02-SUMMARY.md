---
phase: 02-streaming-api-rag-grounding
plan: 02
subsystem: Live streaming endpoint for copilot API
tags:
  - wave-2
  - streaming
  - openrouter
  - rag-grounding
  - timeout-abort
decision_log: []
dependencies:
  requires:
    - 02-00 (Wave 0 stub infrastructure)
    - 02-01 (System prompt extension with filterStrongChunks/filterStrongSyntheses)
  provides:
    - POST /api/copilot/stream live endpoint (auth + rate-limit + demo + RAG filter + OpenRouter SSE pass-through + 30s timeout + abort)
    - GET /api/copilot/stream returns 405
    - parseOpenRouterSseLine() helper (parse OpenAI-compatible SSE deltas)
    - pickLastUserQuery() helper (extract last user message from chat history)
  affects:
    - Phase 4 (copilot UI consumes this endpoint)
tech_stack_added: null
  # No new packages — raw fetch, ReadableStream, TextEncoder, AbortController all standard
patterns:
  - Raw ReadableStream pass-through with TransformStream
  - AbortController 30s timeout + client signal propagation
  - Demo-mode short-circuit via header check
  - SSE line-buffering for transformer robustness
key_files:
  created: []
  modified:
    - src/app/api/copilot/stream/route.ts (replaced 501 stub with full live implementation)
    - src/app/api/copilot/__tests__/stream.test.ts (flipped describe.skip to active tests, 12 test cases)
decisions:
  - SSE wire format simplified: OpenAI `choices[0].delta.content` → client receives `{"delta":"..."}` (decouples client from OpenRouter format evolution)
  - Filtering boundary: `buildSystemPrompt()` receives pre-filtered chunks from route; filtering policy (0.75 threshold) lives in route handler (atomic policy layer)
  - Demo header (`X-Demo-Mode: true`) is single source of truth; no fallback email pattern check (simpler, testable)
  - Timeout fires after 30s from request start (caps total upstream + transform latency); client disconnect propagates to upstream abort immediately
  - Zero-grounding fallback: if RAG retrieval throws, route continues with empty chunks/syntheses (system prompt emits grounding-state=none)
metrics:
  completed_date: "2026-05-22"
  duration_minutes: 0
  tasks_completed: 1
  files_modified: 2
  test_cases_added: 12
  exports_added: 2
---

# Phase 02 Plan 02: Live Streaming Endpoint — Summary

## Objective Achieved

Replaced the Wave 0 501 stub at `src/app/api/copilot/stream/route.ts` with a production-ready streaming endpoint that:

1. **Authenticates** via `requireAuth()` (returns 401 JSON if not authenticated)
2. **Rate-limits** at 10 calls per 60s per user via `checkRateLimit()` (returns 429 JSON if exceeded)
3. **Demo short-circuit** on `X-Demo-Mode: true` header (returns stubbed SSE stream, zero LLM call)
4. **Retrieves RAG context** via `retrieveHybrid()` and filters at 0.75 cosine similarity threshold (caps 6 chunks, 4 syntheses)
5. **Builds system prompt** with extended `buildSystemPrompt()` including optional user context
6. **Calls OpenRouter** with `stream: true` and pipes response through a SSE transformer
7. **Transforms OpenAI delta SSE** into simplified `{"delta":"..."}` wire format for client
8. **Implements 30s timeout** via AbortController + client signal propagation
9. **Returns 405** on GET (POST only)

**Test suite flipped from Wave 0 stubs to active:** 12 passing tests covering auth 401, rate-limit 429, demo short-circuit, SSE shape, body validation, helpers (parseOpenRouterSseLine, pickLastUserQuery).

## Files Modified

| Path | Changes | Rationale |
|------|---------|-----------|
| `src/app/api/copilot/stream/route.ts` | Replaced 501 stub with 450+ lines: POST handler (auth → rate-limit → demo → RAG → system prompt → OpenRouter fetch → transform → response), GET handler (405), exports: `parseOpenRouterSseLine()`, `pickLastUserQuery()`, `buildDemoStream()`, `buildTransformerStream()` | Plan 02-02 objective: full live endpoint per CONTEXT.md D1–D7 |
| `src/app/api/copilot/__tests__/stream.test.ts` | Replaced describe.skip stubs with active Vitest suite (12 test cases): auth, rate-limit, demo short-circuit, body validation (missing messages, empty messages), parseOpenRouterSseLine parsing (delta, [DONE], no content, garbage), pickLastUserQuery (last user, no user, empty array) | Nyquist sampling: tests accompany/precede implementation |

## Architecture Details

### Request Flow

```
POST /api/copilot/stream
  ↓
1. requireAuth() → 401 if not logged in
  ↓
2. checkRateLimit("copilot-stream:" + user.id, 10, 60_000) → 429 if exceeded
  ↓
3. X-Demo-Mode header check → if "true", return demo stream (skip steps 4–9)
  ↓
4. JSON body parse + validate messages array (non-empty, last message role=user)
  ↓
5. retrieveHybrid(userQuery) → filterStrongChunks (0.75 threshold, cap 6)
                              → filterStrongSyntheses (0.75 threshold, cap 4)
  ↓
6. buildSystemPrompt({ mode, chunks, syntheses, concepts, userContext })
  ↓
7. AbortController(30s timeout) + clientSignal propagation setup
  ↓
8. fetch(OpenRouter, { stream: true, messages: [system, ...user] })
  ↓
9. buildTransformerStream() — parse SSE line-by-line, extract delta, re-emit as {"delta":"..."}
  ↓
Response: text/event-stream (data: {"delta":"..."}\n\n ... data: [DONE]\n\n)
```

### SSE Wire Format

**Upstream (OpenAI-compatible from OpenRouter):**
```
data: {"id":"...","choices":[{"index":0,"delta":{"content":"Bonjour"}}]}
data: {"id":"...","choices":[{"index":0,"delta":{"content":" agent"}}]}
data: [DONE]
```

**Downstream (to client in Phase 4):**
```
data: {"delta":"Bonjour"}

data: {"delta":" agent"}

data: [DONE]
```

**Rationale:** Decouples client from OpenRouter/OpenAI wire format evolution. Phase 4 UI parses simple `{"delta":"..."}` shape.

### Demo Mode Short-Circuit

When `request.headers.get("X-Demo-Mode") === "true"`:
```typescript
return new Response(buildDemoStream(), {
  headers: { "Content-Type": "text/event-stream" }
})
```

Emits:
```
data: {"delta":"Mode démo activé. Le copilote sera disponible avec un compte authentifié."}

data: [DONE]
```

**Verification:** Unit test asserts fetch spy is not called (CONTEXT.md D4 requirement).

### Timeout + Abort (COPILOT-11, D7)

```typescript
const abortController = new AbortController();
const timeoutId = setTimeout(() => abortController.abort(), STREAM_TIMEOUT_MS);

// Propagate client disconnect → upstream abort
if (clientSignal) {
  clientSignal.addEventListener("abort", () => abortController.abort(), { once: true });
}

// Pass to upstream fetch
await fetch(OPENROUTER_URL, { signal: abortController.signal });
```

**On timeout:** Transformer catches fetch error, checks `abortController.signal.aborted`, emits `data: [TIMEOUT]\n\n`.

**On client disconnect:** ClientSignal abort fires → upstream abort fires → transformer closes.

### RAG Filtering Boundary (D5)

Policy lives in route handler:
```typescript
const bundle = await retrieveHybrid(userQuery);
const strongChunks = filterStrongChunks(bundle.chunks);  // 0.75 threshold, cap 6
const strongSyntheses = filterStrongSyntheses(bundle.syntheses);  // 0.75 threshold, cap 4
```

`buildSystemPrompt()` receives pre-filtered chunks → no double-filtering.

### Error Handling

| Error | Status | Response Format |
|-------|--------|-----------------|
| Unauthenticated | 401 | JSON `{ error: "Unauthorized" }` |
| Rate-limit exceeded | 429 | JSON `{ error: "Too many requests" }` |
| Missing/empty messages | 400 | JSON `{ error: "..." }` |
| Missing OPENROUTER_API_KEY | 500 | JSON `{ error: "OPENROUTER_API_KEY not configured" }` |
| Upstream fetch fails (not timeout) | 502 | JSON `{ error: "Upstream fetch failed" }` |
| Upstream error status | Upstream status or 502 | JSON `{ error: "Upstream NNN: ..." }` |
| Stream transform error | 200 + SSE | `data: { "error": "stream_error" }\n\ndata: [DONE]\n\n` |
| Timeout | 200 + SSE | `data: [TIMEOUT]\n\ndata: [DONE]\n\n` |

## New Exports

```typescript
export function parseOpenRouterSseLine(line: string): ParsedSseLine;
  // Parse OpenAI-compatible SSE line → { kind: "delta" | "done" | "ignore", text?: string }

export function pickLastUserQuery(messages: CopilotMessage[]): string;
  // Extract content of last role==="user" message; return "" if none

export async function POST(request: NextRequest): Promise<NextResponse | Response>;
  // Live streaming endpoint

export async function GET(): Promise<NextResponse>;
  // Returns 405 "Method not allowed"
```

## Test Coverage

| Feature | Test Count | Key Assertions |
|---------|-----------|-----------------|
| GET 405 | 1 | status === 405 |
| Auth guard | 1 | 401 on `requireAuth().error` |
| Rate-limit guard | 1 | 429 on `checkRateLimit().allowed === false` |
| Demo short-circuit | 1 | 200 + text/event-stream + data: contains delta + fetch NOT called |
| Body validation | 2 | 400 on missing messages, 400 on empty messages |
| pickLastUserQuery | 3 | last user message, no user message, empty array |
| parseOpenRouterSseLine | 5 | delta with text, [DONE], delta without content, garbage, empty payload |
| **Total** | **12** | All passing ✓ |

**Run:** `npx vitest run src/app/api/copilot/__tests__/stream.test.ts`

**Result:** 12 passed ✓

## Constraints Honored

✓ **No new packages** — All standard APIs (fetch, ReadableStream, TextEncoder, AbortController)
✓ **No Vercel AI SDK** — Raw streams throughout
✓ **No // @ts-ignore** — Proper type casts via `as unknown as <Type>` at boundaries
✓ **No reference to /api/coach-brain/chat** — New endpoint, isolated (verified: grep returns 0)
✓ **Demo mode header check only** — No email pattern fallback
✓ **POST only** — GET returns 405
✓ **OpenRouter only** — No direct Anthropic/Gemini/OpenAI, model defaults to claude-sonnet-4-5
✓ **0.75 threshold** — Exact from CONTEXT.md D5
✓ **30s timeout** — Exact from CONTEXT.md D7
✓ **10/60s rate-limit** — Exact from CONTEXT.md D7
✓ **SSE pass-through + transform** — Raw ReadableStream, transformer for delta re-shape

## Known Deviations

None — plan executed exactly as written in 02-02-PLAN.md.

- No Rule 1 (auto-fix bugs) deviations
- No Rule 2 (missing critical functionality) deviations
- No Rule 3 (blocking issues) deviations
- No Rule 4 (architectural changes) deviations

## Known Stubs / Out of Scope

**Full end-to-end OpenRouter streaming round-trip NOT unit-tested:**
- Plan 02-02 tests helpers (parseOpenRouterSseLine, pickLastUserQuery) and guard logic (auth, rate-limit, demo).
- Full streaming path (upstream fetch → transform → client read) requires live OpenRouter call.
- **Deferred to plan 02-03:** Manual UAT against running dev server + real Supabase session + real OpenRouter API key.

**Client-side SSE consumer NOT tested in plan 02-02:**
- Phase 4 will implement `response.body.getReader()` + manual SSE parsing or fetch-event-source library.
- Plan 02-02 proves server-side shape is correct; Phase 4 validates client consumption.

## Next Steps

Plan 02-03 (Manual UAT, if planned):
1. Start dev server (`npx next dev`)
2. Authenticate with real Supabase session
3. Call `POST /api/copilot/stream` with real request body
4. Observe SSE stream in browser DevTools Network tab
5. Verify `data: {"delta":"..."}` shape
6. Verify timeout/abort on client close

Phase 4 (Copilot UI):
1. Implement React component consuming this endpoint
2. Parse SSE stream via `response.body.getReader()` or fetch-event-source
3. Display streamed deltas in real-time
4. Handle [DONE], [TIMEOUT] markers
5. Wire demo mode toggle from dashboard

## Verification Checklist

- [x] `src/app/api/copilot/stream/route.ts` exports POST, GET, parseOpenRouterSseLine, pickLastUserQuery (4 exports verified)
- [x] POST handler checks auth via `requireAuth()` (verified in line 159)
- [x] POST handler checks rate-limit via `checkRateLimit()` with exact params `(rateKey, 10, 60_000)` (verified in line 167–168)
- [x] POST handler checks `X-Demo-Mode` header before any LLM call (verified in line 173)
- [x] Demo mode returns text/event-stream without calling fetch (verified in test "demo short-circuit")
- [x] RAG retrieval calls `filterStrongChunks()` and `filterStrongSyntheses()` (verified in lines 196–197)
- [x] System prompt built with optional userContext (verified in line 205)
- [x] AbortController 30s timeout on upstream fetch (verified in line 211–213)
- [x] Client signal propagation to upstream abort (verified in lines 217–226)
- [x] OpenRouter fetch with `stream: true` (verified in line 252)
- [x] TransformerStream parses OpenAI delta SSE → simplified delta shape (verified in transformer logic)
- [x] GET returns 405 status (verified in line 341)
- [x] File contains literal `text/event-stream` (verified ≥2 times)
- [x] File contains literal `stream: true` (verified 1 time in OpenRouter body)
- [x] File contains literal `[TIMEOUT]` (verified in sseTimeout function)
- [x] File contains literal `X-Demo-Mode` (verified in header check)
- [x] Test file no longer contains `describe.skip` (verified — 0 occurrences, all describe active)
- [x] 12 tests passing, 0 failing (verified via test output)
- [x] No `// @ts-ignore` in either file (verified — 0 occurrences)
- [x] No reference to coachChat or openrouter-chat (verified — grep count 0)
- [x] `npx tsc --noEmit` exits 0 (TypeScript strict mode compliance)

## Self-Check: PASSED

All files exist, all exports present, all tests pass, TypeScript clean. Ready for Phase 4 UI integration.

