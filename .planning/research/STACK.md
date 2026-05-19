# Stack Research

**Project:** NXT Performance — Milestone "Copilote IA + Training Vocal"
**Mode:** Ecosystem / Additive Stack Research
**Date:** 2026-05-18
**Confidence:** HIGH (infrastructure already in place; most recommendations are wiring decisions)

---

## Critical Finding: Almost Nothing Needs to Be Added

The codebase already has the full AI stack provisioned. This milestone is an **integration milestone, not a greenfield AI build**.

**Only 2 new npm packages are needed:**
- `ai` (Vercel AI SDK, v4.x) — `useChat`, `streamText`, `streamObject`
- `@ai-sdk/openai` — OpenAI-compatible provider, works with OpenRouter via `baseURL`

Everything else (ElevenLabs TTS, Groq Whisper, Google Drive ingest, Supabase pgvector, Gemini Live WebSocket) is already installed and partially wired.

---

## 1. Chat Copilot UI — Vercel AI SDK `useChat`

**Recommendation:** Vercel AI SDK `useChat` + custom React component using Radix primitives.

**Why over alternatives:**
- Codebase already on Vercel + Next.js App Router — Vercel AI SDK is purpose-built for this combo
- `streamText()` (server) + `useChat()` (client) is the idiomatic 2025 pattern
- Handles SSE streaming, loading state, message history, abort signals in ~10 lines vs. 200+ lines manual
- React 19 compatible (only `useState`/`useEffect`, no Server Component constraints)

**Do NOT use:**
- Raw Anthropic SDK (`@ai-sdk/anthropic`) — would split key management; OpenRouter is already standardized
- LangChain.js — 40+ transitive deps, massive bundle, overkill for retrieve-then-inject RAG
- Pre-built chat UI components (shadcn-chat, chatscope, react-chat-elements) — design system conflicts with Tailwind 4 OKLCH; `useChat` provides all logic, only rendering is needed

**Server route pattern:**

```typescript
// src/app/api/copilot/chat/route.ts (NEW route — do NOT modify existing /api/coach-brain/chat)
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
})

export async function POST(req: Request) {
  const { messages, context } = await req.json()
  const ragChunks = await retrieveRelevantChunks(context.lastMessage, { topK: 5 })
  const result = streamText({
    model: openrouter('anthropic/claude-sonnet-4-5'),
    system: buildSystemPrompt(context.ratios, ragChunks),
    messages,
  })
  return result.toDataStreamResponse()
}
```

**Client hook:**

```typescript
import { useChat } from 'ai/react'

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/copilot/chat',
  body: { context: { ratios: computedRatios, userId: user.id } },
})
```

**Action suggestions = structured output:** Use `streamObject` with a Zod 4 schema to stream typed action cards. Lets the LLM emit `{ actions: [{ label, route, type }] }` as parseable data instead of free text.

**Components to build:**
- `src/components/copilot/CopilotPanel.tsx` (container)
- `src/components/copilot/MessageList.tsx`
- `src/components/copilot/MessageInput.tsx`
- `src/components/copilot/ActionCard.tsx` (suggested actions)

~150-200 lines total, using Radix primitives for accessibility.

---

## 2. RAG Over Google Drive — Existing Infrastructure

**Recommendation:** Zero new packages. The RAG pipeline is **already complete** in production code.

| Component | Status | Location |
|---|---|---|
| Google Drive fetching | In place | `googleapis` 144.0.0 |
| Document parsing (PDF/DOCX) | In place | `pdf-parse`, `mammoth` |
| Embedding generation | In place | `src/lib/server/coach-rag/openai-embed.ts` using `openai/text-embedding-3-small` via OpenRouter |
| Vector store | In place | Supabase pgvector, 1536 dims, hybrid BM25 + vector |
| Existing RAG chat endpoint | In place (legacy) | `/api/coach-brain/chat/route.ts` |

**What this milestone wires:** The copilot UI calls the existing RAG retrieval function and injects chunks into the system prompt. It's a function import, not a new library.

**Do NOT add a separate vector DB** (Pinecone, Qdrant, Weaviate). Supabase pgvector is provisioned. A coaching corpus of 50-500 docs runs perfectly. The hybrid search (BM25 + vector) already outperforms pure vector for French real estate terminology.

**Voyage AI:** `VOYAGE_API_KEY` exists but Voyage was deprecated in this codebase due to rate limiting. Do NOT reactivate. `openai/text-embedding-3-small` via OpenRouter is working. The `VOYAGE_API_KEY` env var stays dormant.

**Re-embedding policy:** Do NOT compute document embeddings per request. Ingestion script pre-computes embeddings. Only the query embedding (one API call per user message, ~$0.0001) is computed at request time.

---

## 3. Voice Training Scenarios — Existing ElevenLabs TTS

**Recommendation:** Existing `/api/voice/tts` + native `HTMLAudioElement`. No new packages.

The ElevenLabs streaming TTS endpoint already streams `audio/mpeg` with persona-specific voice IDs (Kind / Sport / Warrior via env vars).

**What the training feature needs:**

1. New route: `src/app/(dashboard)/conseiller/training/[situation]/page.tsx`
2. Scenario script data (JSON/TypeScript objects: coach lines + user prompts)
3. A scenario player component that:
   - POSTs to `/api/voice/tts` with the persona voice ID
   - Plays audio: `audioRef.current.src = URL.createObjectURL(blob)`
   - Awaits user turn → POSTs to `/api/vocal` (existing Groq Whisper endpoint)
   - Feeds transcript to LLM for feedback via copilot endpoint

**Audio playback:** Native `HTMLAudioElement` via `useRef`. No audio library. The pattern `URL.createObjectURL(blob)` → `audio.play()` already exists in the codebase.

**Voice stack covers all needs:**
- Gemini Live → real-time WebSocket conversation
- ElevenLabs → high-quality persona TTS
- Groq Whisper → transcription

---

## Package Delta

```bash
npm install ai @ai-sdk/openai
```

| Package | Version | Purpose | Confidence |
|---|---|---|---|
| `ai` | 4.x (verify with `npm show ai version`) | `useChat`, `streamText`, `streamObject`, `toDataStreamResponse` | MEDIUM-HIGH |
| `@ai-sdk/openai` | latest compatible | Provider factory; OpenRouter via `createOpenAI({ baseURL })` | HIGH |

---

## Alternatives Rejected

| Category | Rejected | Reason |
|---|---|---|
| LLM streaming | Raw fetch + manual SSE | 200+ lines vs. 5 lines with `useChat` |
| LLM provider | `@ai-sdk/anthropic` direct | Duplicates key management; OpenRouter already in use |
| LLM orchestration | LangChain.js | 40+ deps, overkill |
| Vector DB | Pinecone / Qdrant | pgvector provisioned, sufficient at corpus size |
| Embeddings | Voyage AI | Deprecated in codebase due to rate limiting |
| Chat UI lib | shadcn-chat / chatscope | Design system conflicts; `useChat` covers logic |
| TTS | Browser SpeechSynthesis | Quality is the differentiator; ElevenLabs personas non-negotiable |
| Audio playback | howler.js / tone.js | Native `HTMLAudioElement` sufficient |

---

## Compatibility Notes

- **`useChat` + React 19** — Uses only `useState`/`useEffect`. No Server Components required. No known React 19 incompatibilities. (HIGH)
- **`streamText` + Next.js 16 App Router** — Uses Web Streams API. Compatible with Node 20 runtime + Vercel Edge. (HIGH)
- **`@ai-sdk/openai` + OpenRouter** — `createOpenAI({ baseURL: 'https://openrouter.ai/api/v1' })` is the documented pattern. OpenRouter exposes an OpenAI-compatible API. (HIGH — pattern partially implemented already)
- **Zod 4.x + `streamObject`** — `streamObject` requires Zod. Zod 4.3.6 already in stack. (HIGH)

---

## Key Warnings for Roadmap

1. **Prompt engineering is a first-class task, not an afterthought.** The copilot system prompt must combine: user ratios + RAG chunks + conversation history + domain coaching. Budget 2-3 days of prompt engineering as a dedicated roadmap task.

2. **Do NOT adapt the existing `/api/coach-brain/chat` endpoint.** Create a NEW route `/api/copilot/chat` using Vercel AI SDK protocol (`toDataStreamResponse()`) from the start. The legacy endpoint uses a different response format and adapting it would create coupling.

3. **Version pinning at install time** — Run `npm show ai version` and `npm show @ai-sdk/openai version` before install to lock the most recent stable.

---

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| "Only 2 new packages" claim | HIGH | Verified against STACK.md and INTEGRATIONS.md |
| Vercel AI SDK v4.x API | MEDIUM | Core stable; verify exact version at install |
| OpenRouter + `@ai-sdk/openai` | HIGH | Standard documented pattern |
| RAG "no new packages" | HIGH | All components verified in codebase |
| ElevenLabs "no new packages" | HIGH | In production, verified |
| React 19 / Next.js 16 compat | HIGH | Vercel AI SDK maintained by Vercel |
