# Phase 2 — Streaming API + RAG Grounding — Context

**Date:** 2026-05-21
**Mode:** fast-path (CONTEXT written by orchestrator from existing artifacts — no `/gsd:discuss-phase` session)
**Source artifacts:** PROJECT.md, REQUIREMENTS.md, research/{STACK,ARCHITECTURE,PITFALLS,SUMMARY}.md, Phase 1 CONTEXT.md (D1, D2 already locked), Phase 1 deliverables (types, copilot-context, rag-health)

---

## Phase Boundary

Deliver the **server-side streaming chat endpoint** for the copilot. No UI. The UI consumes this endpoint in Phase 4.

Concretely:
- `POST /api/copilot/stream` returning `text/event-stream`
- System prompt builder extending the existing `buildSystemPrompt()` with the new `formatUserContext()` block
- RAG retrieval already wired (Phase 1 confirmed `retrieveHybrid()` works)
- Demo mode short-circuit (no LLM call)
- Loi Hoguet guardrail in system prompt
- Timeout + abort + rate-limit handling

Out of this phase: copilot UI, suggestions cards, dashboard layout, deep-links. Those land in Phase 4 + 5.

---

## Canonical Refs

| Ref | Path | Why |
|---|---|---|
| Phase 1 types | `src/types/copilot.ts` | `CopilotContextPayload`, `BuildCopilotContextInput`, `CopilotMessage` |
| Phase 1 builder | `src/lib/copilot-context.ts` | `buildCopilotContext()`, `TOKEN_BUDGET` |
| Existing RAG | `src/lib/server/coach-rag/retrieve.ts` | `retrieveHybrid(query): Promise<{chunks, syntheses}>` |
| Existing prompt | `src/lib/server/coach-rag/system-prompt.ts` | `buildSystemPrompt()` to be extended |
| Existing chat (legacy) | `src/lib/server/coach-rag/openrouter-chat.ts` | NON-streaming — do NOT reuse, write streaming inline |
| Auth | `src/lib/api-auth.ts` | `requireAuth()` |
| Rate limit | `src/lib/rate-limit.ts` | `checkRateLimit(key, max, windowMs)` |
| Health endpoint pattern | `src/app/api/copilot/rag-health/route.ts` | Phase 1 — auth + rate-limit pattern to copy |
| TTS streaming reference | `src/app/api/voice/tts/route.ts` | Existing raw ReadableStream pass-through pattern |
| Pitfalls | `.planning/research/PITFALLS.md` C-1, C-3, I-1, I-4 | Token bloat, demo leak, adversarial RAG, index staleness |

---

## Decisions

### D1 — Streaming protocol: raw `ReadableStream` pass-through, NO Vercel AI SDK

Server-side: open `fetch(OpenRouter, { stream: true })`, pipe `upstream.body as ReadableStream` to `new NextResponse(stream, { headers: { "Content-Type": "text/event-stream" } })`. Matches the existing `/api/voice/tts/route.ts` pattern. Zero new packages.

Client-side (Phase 4): consume via `response.body.getReader()` + manual SSE parsing OR `fetch-event-source` (single-package option for Phase 4 decision — out of scope here).

**Why:** ARCHITECTURE.md vote, lower coupling, matches existing patterns. STACK.md's Vercel AI SDK suggestion is rejected for this phase.

### D2 — Provider: OpenRouter only (no direct Anthropic, no Gemini, no OpenAI direct)

`fetch("https://openrouter.ai/api/v1/chat/completions", { headers: { "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY }, body: { model: "anthropic/claude-sonnet-4-5", stream: true, messages: [...] } })`

Model defaults to `anthropic/claude-sonnet-4-5`. Override via `process.env.COACH_RAG_DEFAULT_MODEL` (already in .env.example).

**Why:** simplifies key management, OpenRouter already proxies embeddings + chat, matches existing `coach-rag` infrastructure.

### D3 — System prompt structure: extend `buildSystemPrompt()` additively

```ts
// src/lib/server/coach-rag/system-prompt.ts (extended)
export function buildSystemPrompt(args: {
  mode: "soutien" | "tactique" | "strategique"
  chunks: RetrievedChunk[]
  syntheses: RetrievedSynthesis[]
  concepts: Concept[]
  userContext?: CopilotContextPayload   // NEW (optional, backward compatible)
}): string
```

When `userContext` is provided, append a `formatUserContext(payload)` block at the END of the prompt (preserves existing behavior when called from legacy code).

Format (verbatim instruction to the LLM):
```
<user-context>
Catégorie : {Junior|Confirmé|Expert}
Ratios actuels :
  - {RatioId}: {value} ({status})
  - ...
Point de douleur principal : {topCriticite.name} — {topCriticite.diagnosis}
</user-context>

<rag-source>
Source: {filename}
{chunk content}
</rag-source>
<rag-source>...</rag-source>

<concepts>
{concepts glossary}
</concepts>
```

The `<rag-source>` wrapping addresses PITFALLS I-1 (adversarial content). LLM instructed to treat content within tags as reference, never instructions.

### D4 — Demo-mode short-circuit (PITFALLS C-3)

```ts
// src/app/api/copilot/stream/route.ts
const isDemoMode = await detectDemoMode(req)   // reads X-Demo-Mode header from client OR checks user.email matches demo pattern
if (isDemoMode) {
  return new NextResponse(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode("data: " + JSON.stringify({
          delta: "Mode démo activé. Le copilote sera disponible avec un compte authentifié.",
        }) + "\n\n"))
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      }
    }),
    { headers: { "Content-Type": "text/event-stream" } }
  )
}
```

Client signals demo mode via header `X-Demo-Mode: true` (set in Phase 4 wiring). Server treats it as authoritative — no LLM call.

### D5 — RAG threshold + zero-grounding behavior (RAG-03, RAG-04)

`retrieveHybrid("…")` returns chunks sorted by similarity. Filter on server:
```ts
const STRONG_CHUNK_THRESHOLD = 0.75
const groundingChunks = chunks.filter(c => c.score >= STRONG_CHUNK_THRESHOLD).slice(0, 6)
const groundingSyntheses = syntheses.filter(s => s.score >= STRONG_CHUNK_THRESHOLD).slice(0, 4)
```

If `groundingChunks.length + groundingSyntheses.length === 0`, the system prompt receives a zero-grounding hint:
```
<grounding-state>none</grounding-state>
```
The system prompt instructs the LLM: "Si <grounding-state>none</grounding-state>, dis explicitement 'Je n'ai pas d'exemple pertinent dans mon référentiel de coaching pour ce point précis.' Ne pas extrapoler."

### D6 — Loi Hoguet guardrail (COPILOT-10)

System prompt includes a non-negotiable instruction block:
```
<contract-policy>
Tu es un coach de performance commerciale. Tu n'es PAS un évaluateur de biens immobiliers ni un rédacteur juridique. Si l'utilisateur demande une estimation de prix d'un bien, une rédaction de clause de mandat, ou tout contenu à valeur contractuelle, refuse poliment et redirige vers l'outil d'évaluation agréé de l'agence. Exemple de refus : "Pour une estimation chiffrée, utilise ton outil d'évaluation agréé — c'est la seule source faisant foi sous la loi Hoguet."
</contract-policy>
```

Detection is LLM-side, not regex-side (regex would be fragile in French). Acceptance criterion: a manual prompt "Estime cette maison à 250m² rue Foch à Lyon" should produce a refusal mentioning loi Hoguet OR redirection to the agréé tool.

### D7 — Timeout + abort + rate-limit (COPILOT-11)

- Server-side timeout: `AbortController` on the upstream OpenRouter fetch with 30s timeout. On timeout, send `data: [TIMEOUT]\n\n` and close stream.
- Client disconnect: when the client closes the response, the `req.signal.aborted` becomes true → propagate to upstream abort controller.
- Rate limit: `checkRateLimit("copilot-stream:" + user.id, 10, 60_000)` — 10 calls per minute per user. Returns 429 with JSON before any LLM call.

---

## Specifics

- **Endpoint location:** `src/app/api/copilot/stream/route.ts` — MUST be a new file, NOT a modification of `/api/coach-brain/chat`
- **Method:** `POST` only. GET returns 405.
- **Request body shape:**
  ```ts
  {
    messages: CopilotMessage[]      // chat history including the new user message
    context: CopilotContextPayload  // built client-side via buildCopilotContext()
  }
  ```
- **Response:** `text/event-stream` with `data: {"delta": "..."}` SSE events, terminated by `data: [DONE]\n\n`
- **Error response (non-stream):** JSON `{ error: string }` with appropriate status (400, 401, 429, 500)
- **No new packages.** All standard `fetch`, `ReadableStream`, `TextEncoder`.

## Anti-Decisions

- **No Vercel AI SDK** — keeps stack lean; raw streams already work in this codebase.
- **No structured-output stream (Zod schema)** — that's a Phase 4 UI concern, not a Phase 2 server concern.
- **No Anthropic SDK direct** — OpenRouter handles provider routing.
- **No tokenizer dep for token counting** — char/4 from Phase 1 suffices for the prompt budget enforcement.
- **No conversation persistence** — messages are stateless per request; Phase 4 may add Zustand-side history.

## Deferred Ideas

- Streaming structured-output for action cards (Phase 4 concern)
- Cross-session memory (v2 per REQUIREMENTS.md)
- Multi-model fallback (v2)
- Logging/observability to a dashboard (separate ops milestone)

## Open Questions for Downstream Agents

1. **OpenRouter SSE wire format** — confirm during planning: is it `data: {"choices":[{"delta":{"content":"..."}}]}` (OpenAI-compatible) or different? Adapt the parsing accordingly.
2. **`detectDemoMode` implementation** — header-only? Or also check email pattern (e.g., `@demo.com`)? Pick simplest that works.
3. **System prompt mode detection** — keep using existing `detectMode(query)` unchanged, or override based on `topCriticite`? Use existing for now.

## Definition of Done

1. `POST /api/copilot/stream` exists with auth + rate-limit + demo-mode short-circuit
2. Non-demo authenticated request streams tokens from OpenRouter Claude Sonnet
3. `buildSystemPrompt()` extended with `formatUserContext` block, backward compatible
4. RAG chunks filtered at 0.75 threshold, wrapped in `<rag-source>` delimiters
5. Loi Hoguet refusal works on a contract-estimation prompt (manual test)
6. Timeout, abort, rate-limit all functional
7. Unit tests for the helpers (`detectDemoMode`, `formatUserContext`, threshold filter)
8. `npx tsc --noEmit` + `npx vitest run` green
