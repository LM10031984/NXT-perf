# Architecture Research

**Project:** NXT Performance — RAG Copilot + Voice Training
**Date:** 2026-05-18
**Confidence:** HIGH — based entirely on direct codebase analysis, not web search or training-data assumptions

---

## Key Findings

1. **The RAG stack is already production-ready.** `src/lib/server/coach-rag/retrieve.ts` calls two live Supabase pgvector RPCs (`coach_chunks_search`, `coach_syntheses_search`). Vector store: pgvector in Supabase, hybrid retrieval (chunks + syntheses), 1536-dim `text-embedding-3-small` via OpenRouter. **Nothing to add.**

2. **The `FloatingCopilote` stub is already mounted.** `src/components/conseiller/layout/floating-copilote.tsx` exists and is registered in the conseiller layout. This milestone **replaces the placeholder content** — it does not need to add a new component to the layout.

3. **Zustand → server passthrough pattern is established.** Routes like `/api/post-saisie-tip` and `/api/coach-nudge` receive serialized computed context in the POST body. The copilot follows this same pattern: client calls `buildCopilotContext()` locally, sends payload to `/api/copilot/stream`. **Server never reads Zustand directly.**

4. **Streaming pattern = raw ReadableStream pass-through, NO Vercel AI SDK.** The ElevenLabs TTS route (`src/app/api/voice/tts/route.ts`) demonstrates the exact pattern: `return new NextResponse(upstream.body as ReadableStream, { "Content-Type": "audio/mpeg" })`. The copilot streaming route uses the same approach with `text/event-stream`.

> ⚠️ **Conflict with STACK.md**: Stack research recommended adding the `ai` package (Vercel AI SDK). Architecture research disagrees, citing that the existing pattern (raw streams) is already proven and adding `ai` introduces a new wire format. **Resolution in SUMMARY.md: prefer raw streams server-side, allow `ai/react` client hook only if it cleanly consumes raw SSE.** Validate during Phase 2 implementation.

5. **Seven existing `src/lib/` pure functions feed directly into the copilot prompt.** `computeAllRatios()`, `findCriticitePoints()`, `detectMode()`, `buildSystemPrompt()`, `retrieveHybrid()`, `listConcepts()`, `CATEGORY_LABELS`. The new `/api/copilot/stream` route calls these existing functions with minimal modification — `buildSystemPrompt()` gets an additive `formatUserContext()` block.

---

## Component Boundaries

```
CLIENT (Zustand store, read-only consumers)
│
├── src/components/conseiller/copilot/
│   ├── FloatingCopilote.tsx         ← replaces stub, drawer wrapper
│   ├── CopilotMessageThread.tsx     ← streaming text renderer
│   └── CopilotSuggestionChips.tsx   ← clickable scenario prompts
│
├── src/components/conseiller/dashboard/
│   └── Top3PrioritesSection.tsx     ← new "clin d'œil" dashboard widget
│
├── src/components/conseiller/training/
│   ├── TrainingScenarioCard.tsx
│   └── TrainingScenarioRunner.tsx   ← ElevenLabs TTS + Gemini Live
│
├── src/hooks/use-copilot.ts         ← stream state, send(), abort()
│
└── src/lib/copilot-context.ts       ← buildCopilotContext() pure fn
                                        reads: computedRatios, findCriticitePoints
                                        returns: CopilotContextPayload (plain JSON)

SERVER (Next.js API routes)
│
├── src/app/api/copilot/stream/route.ts  ← NEW
│   requires: requireAuth, checkRateLimit (existing)
│   calls: retrieveHybrid(), listConcepts(), buildSystemPrompt() (existing)
│   streams: ReadableStream → text/event-stream
│
├── src/lib/server/coach-rag/*           ← UNCHANGED
│   retrieve.ts, openrouter-chat.ts, system-prompt.ts, openai-embed.ts
│
└── Supabase pgvector                    ← UNCHANGED
    coach_chunks_search RPC
    coach_syntheses_search RPC
```

**Routes (App Router):**
- `src/app/(dashboard)/conseiller/training/[situation]/page.tsx` — NEW
- `src/app/api/copilot/stream/route.ts` — NEW
- All other routes unchanged

**Sidebar addition:** one nav item under conseiller section, `href="/conseiller/training"`, role-gated.

---

## Data Flow

```
OFFLINE (already done, ingestion scripts):
Google Drive (COACH_BRAIN_DRIVE_FOLDER_ID)
  → scripts/coach-rag/ingest.ts
  → OpenRouter embeddings (text-embedding-3-small, 1536 dims)
  → Supabase pgvector: coach_chunks + coach_syntheses + coach_concepts

ONLINE (per request):
1. Client: useRatios() + findCriticitePoints() → CopilotContextPayload
2. Client: POST /api/copilot/stream { messages, context: payload }
3. Server: requireAuth() + checkRateLimit()
4. Server: retrieveHybrid(userMessage) → top 6 chunks + 4 syntheses from pgvector
5. Server: listConcepts() → NXT glossary
6. Server: buildSystemPrompt() extended with formatUserContext(payload)
7. Server: fetch(OpenRouter, { stream: true }) → ReadableStream
8. Server: return new NextResponse(upstream.body, { "Content-Type": "text/event-stream" })
9. Client: response.body.getReader() → token-by-token UI update
```

---

## Suggested Build Order (7 phases)

| # | Phase | Key Files | Dependencies |
|---|---|---|---|
| 1 | Context Layer | `src/types/copilot.ts`, `src/lib/copilot-context.ts`, `src/data/training-scenarios.ts` | None — pure functions, zero risk |
| 2 | Streaming API | `src/app/api/copilot/stream/route.ts` + extend `system-prompt.ts` | Phase 1 (CopilotContextPayload type) |
| 3 | Copilot UI | `src/components/conseiller/copilot/*`, `src/hooks/use-copilot.ts` | Phase 2 (stream endpoint exists) |
| 4 | Dashboard Refactor | `src/components/conseiller/dashboard/Top3PrioritesSection.tsx` | Phase 1 (context types), Phase 3 (copilot deep-links) |
| 5 | Training Module | `src/app/(dashboard)/conseiller/training/[situation]/page.tsx`, training components | Phase 1 (scenario configs) |
| 6 | Vocal Flow Fixes | `src/components/vocal/VocalFlow.tsx` + saisie CTA promotion | Phase 3-5 complete (dashboard wired) |
| 7 | Onboarding Wizard | `src/app/(auth)/register/page.tsx` refactor | Independent — can parallelize with 4-5 |

---

## Integration Points with Existing `src/lib/`

| Existing Function | File | How Copilot Uses It |
|---|---|---|
| `computeAllRatios(results, category, ratioConfigs)` | `src/lib/ratios.ts` | Returns `ComputedRatio[]` — serialized into `CopilotContextPayload.ratioSummary` |
| `findCriticitePoints(measured, ctx, results, category, periodMonths)` | `src/lib/diagnostic-criticite.ts` | Returns top `CriticitePoint` — primary coaching focus in system prompt |
| `detectMode(query)` | `src/lib/server/coach-rag/system-prompt.ts` | Auto-detects soutien/tactique/stratégique from user message, unchanged |
| `buildSystemPrompt({mode, chunks, syntheses, concepts})` | `src/lib/server/coach-rag/system-prompt.ts` | Extended with one additive `formatUserContext()` block — backward-compatible |
| `retrieveHybrid(query)` | `src/lib/server/coach-rag/retrieve.ts` | Called from new streaming route, unchanged |
| `CATEGORY_LABELS` | `src/lib/constants.ts` | "Junior / Confirmé / Expert" labels in context block |
| `coachChat()` | `src/lib/server/coach-rag/openrouter-chat.ts` | NOT used by streaming route — streaming bypasses the non-streaming wrapper |

---

## Explicit Non-Decisions (with Rationale)

**Vector store → Supabase pgvector (already operational).**
Alternatives considered: in-memory FAISS, Chroma, SQLite-vec. All rejected. Supabase pgvector has populated tables, working RPCs, and an ingestion pipeline. No migration makes sense.

**Streaming → Raw ReadableStream pass-through.**
Alternatives considered: `ai` package (`streamText`, `useChat`). Conflicting recommendation in STACK.md to be resolved during Phase 2 — architecture research votes raw streams server-side because the pattern is already proven in `voice/tts/route.ts`.

**Zustand passthrough.**
Client sends context payload. Avoids a second DB query per copilot message. Consistent with existing `post-saisie-tip` and `coach-nudge` routes.

**Training route → `/conseiller/training/[situation]` slug.**
Consistent with the existing `directeur/conseiller/[id]` dynamic-segment convention. Slug is readable in deep-links from the copilot.

---

## Open Questions for Phase-Specific Research

1. **Training vocal external code** — What does the external training code look like? Components, hooks, dependencies? Will it import cleanly or need a rewrite? **Highest-risk unknown for Phase 5.**
2. **OpenRouter streaming confirmation** — Existing `openrouter-chat.ts` uses non-streaming. Streaming (`stream: true` + SSE chunks) needs to be confirmed against OpenRouter API before Phase 2.
3. **`findCriticitePoints` inputs in client context** — The function requires `MeasuredRatio[]` and `ThresholdContext` (including `avgCommissionEur`). Verify accessibility in Zustand store or derivability from existing hooks before implementing `buildCopilotContext()`.
