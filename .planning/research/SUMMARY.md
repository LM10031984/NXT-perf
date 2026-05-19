# Research Summary

**Project:** NXT Performance — UX Simplification + AI Copilot Milestone
**Date:** 2026-05-18
**Sources:** [STACK.md](./STACK.md), [FEATURES.md](./FEATURES.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [PITFALLS.md](./PITFALLS.md)

---

## Headline Finding

**This is an integration milestone, not a greenfield AI build.** The codebase already has the full plumbing for everything we want to ship:

| Capability | State |
|---|---|
| LLM provider (OpenRouter / Anthropic via key) | ✓ Installed, wired |
| Embeddings (OpenAI `text-embedding-3-small` via OpenRouter) | ✓ In use |
| Vector store (Supabase pgvector, 1536 dims, hybrid BM25 + vector) | ✓ Operational with RPCs |
| Coach-RAG retrieval function (`retrieveHybrid()`) | ✓ Production code |
| Existing copilot stub (`FloatingCopilote.tsx`) | ✓ Already mounted in conseiller layout |
| ElevenLabs streaming TTS endpoint | ✓ `/api/voice/tts` works |
| Groq Whisper transcription endpoint | ✓ `/api/vocal` works |
| Coach-brain chat endpoint (legacy, non-streaming) | ✓ `/api/coach-brain/chat` exists |

The milestone replaces stubs, wires existing pieces together, and ships a 7-phase build sequence — it does not introduce new tech foundations.

---

## Stack Decisions

| Question | Decision | Rationale |
|---|---|---|
| Add Vercel AI SDK (`ai` package)? | **No on server, optional on client** | Architecture research found existing pattern (raw ReadableStream pass-through in `voice/tts/route.ts`). Server uses raw streams. Client may use `ai/react`'s `useChat` IF it cleanly consumes raw SSE — to be validated during Phase 2. |
| Vector DB choice? | **Supabase pgvector (existing)** | Provisioned, populated, hybrid retrieval already implemented. Pinecone/Qdrant rejected. |
| Embeddings provider? | **OpenAI `text-embedding-3-small` via OpenRouter (existing)** | Already in use. Voyage deprecated in codebase due to rate limiting — do NOT reactivate. |
| LLM provider for copilot? | **OpenRouter → Anthropic Claude Sonnet** | OpenRouter is the standardized gateway. Disable other providers in copilot route this milestone. |
| New npm packages needed | **0–2** | Worst case: `ai` + `@ai-sdk/openai` if `useChat` proves cleaner than custom hook. Best case: zero. |

> ⚠️ **STACK ↔ ARCHITECTURE conflict resolved:** STACK research suggested Vercel AI SDK; ARCHITECTURE found the existing raw-stream pattern is already proven. **Decision: raw streams server-side, custom hook OR `useChat` client-side (Phase 2 implementer's call).**

---

## UX Decisions

| Question | Decision | Source |
|---|---|---|
| Chat-first or suggestion-first? | **Suggestion-first.** 3 pre-generated cards on dashboard load. Chat = secondary, on demand | FEATURES.md §1, PITFALLS C-5 |
| Streaming required? | **Mandatory for chat**, optional for cards (cards can be cached) | FEATURES.md §2 |
| RAG citations? | **Mandatory** — every grounded answer shows `Source: [filename]` | FEATURES.md §3 |
| Voice-in priority? | **Table stakes** (after VocalFlow bug fixes) | FEATURES.md §4 |
| Voice-out priority? | **Differentiator** — toggle off by default | FEATURES.md §4 |
| FR regulation guardrail | **No contractual content generation** (loi Hoguet) | FEATURES.md §6 |

---

## Architecture: Build Order (7 phases)

| # | Phase | Risk | Output |
|---|---|---|---|
| 1 | **Context Layer** | None — pure functions | `src/types/copilot.ts`, `src/lib/copilot-context.ts`, `src/data/training-scenarios.ts` |
| 2 | **Streaming API** | LLM cost, hallucination | `src/app/api/copilot/stream/route.ts` + extend `system-prompt.ts` |
| 3 | **Copilot UI** | UX density (mitigate via suggestion-first) | `src/components/conseiller/copilot/*`, `src/hooks/use-copilot.ts`, `src/stores/copilot-store.ts` |
| 4 | **Dashboard "Clin d'œil"** | Cognitive density | `src/components/conseiller/dashboard/Top3PrioritesSection.tsx` + header tour CTA |
| 5 | **Training Module** | External code import unknown | `src/app/(dashboard)/conseiller/training/[situation]/page.tsx` |
| 6 | **VocalFlow Stabilization** | Existing bugs block training | `src/components/vocal/VocalFlow.tsx` + saisie promotion |
| 7 | **Onboarding Wizard** | Risk of breaking other roles | `ConseillerRegistrationWizard` (isolated, doesn't touch manager/directeur paths) |

Phase 6 (VocalFlow) is a **prerequisite for Phase 5** (training) — they share infrastructure. Architecture research listed them in order 6 → 5, but dependency analysis says **6 must complete before 5 ships**.

---

## Top Critical Pitfalls (act on these in roadmap)

1. **Mock data leaks into LLM prompts** (C-3) — Add `isDemoMode` guard in copilot route before any LLM call. Demo mode returns stubs, never hits Anthropic.
2. **Context bloat** (C-1) — Hard cap 3,000 tokens via `buildCopilotContext()`. Never pass `users[]`, `networks`, other-user data.
3. **RAG hallucination on weak chunks** (C-2) — Threshold 0.75 cosine similarity. Return 0 chunks rather than weak. Prompt instructs "Je n'ai pas d'exemple pertinent" if grounding is thin.
4. **Copilot becomes a 5th dense surface** (C-5) — Suggestion-first, chat collapsed, single CTA per card. Limited to conseiller dashboard ONLY this milestone.
5. **VocalFlow bugs cascade into training** (C-4) — Fix VocalFlow before wiring training scenarios. Add E2E test before refactor.
6. **Copilot state bleeds into 467 store consumers** (I-3) — Separate `src/stores/copilot-store.ts`. Never import in `app-store.ts`.

---

## Critical Path Dependencies

```
Drive indexing operational (existing) ─┐
                                       ├─→ Copilot suggestions w/ RAG citations
buildCopilotContext() (Phase 1) ───────┘
                                          ↓
                              FloatingCopilote replaces stub (Phase 3)
                                          ↓
                              Top 3 dashboard (Phase 4)
                                          ↓
                              Deep-links → Training routes (Phase 5)
                                          ↑
VocalFlow stabilized (Phase 6) ──────────┘
```

---

## Open Questions for Phase-Specific Research

| Question | Phase Resolves It | Action Needed Now |
|---|---|---|
| Drive corpus size + indexing freshness today | Phase 2 | Laurent: how many docs in `COACH_BRAIN_DRIVE_FOLDER_ID`? |
| Training vocal external code shape | Phase 5 | Need access to the local files before Phase 5 planning |
| OpenRouter streaming (`stream: true`) confirmed? | Phase 2 | Smoke test before implementation |
| `findCriticitePoints` ThresholdContext accessible client-side? | Phase 1 | Read the file during plan-phase |
| ElevenLabs 2026 pricing | Phase 5 | Check before rollout (not blocking milestone) |

---

## Confidence

| Area | Confidence | Source |
|---|---|---|
| Infra already in place | HIGH | Direct codebase inspection by Architecture agent |
| Suggestion-first UX | HIGH | Cross-validated by Features + Pitfalls |
| Streaming wire format | HIGH | Existing pattern in `voice/tts/route.ts` |
| Phase build order | HIGH | Dependency analysis is unambiguous |
| Library choice (raw streams vs Vercel AI SDK) | MEDIUM | To be re-validated during Phase 2 |
| LLM cost projection | LOW | Depends on per-request token usage which we haven't measured |
