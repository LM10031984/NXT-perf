# Features Research

**Project:** NXT-perf — AI Copilot + "Clin d'œil" UX (milestone conseiller)
**Mode:** Ecosystem — Feature landscape
**Date:** 2026-05-18
**Confidence:** HIGH (UX patterns + RAG) / MEDIUM (FR real estate specifics) / LOW (ElevenLabs pricing 2026)

---

## Key Findings

### 1. Suggestion-first, not chat-first

The real estate agent persona doesn't arrive with a formulated question — they arrive with a pain. The correct interface is **3 suggestion cards pre-generated on page load** (single-shot, contextual to real ratios), with chat as a secondary mode triggered on demand. A ChatGPT-style empty chat as primary UX is an explicit anti-feature for this profile.

### 2. Streaming mandatory for chat, optional for cards

Cards can be pre-generated and served "ready" (Zustand-cached, refreshed on page load). Multi-turn chat must stream via SSE — a 4-second blocking response feels like a crash to a field user.

### 3. RAG grounding = mandatory citations

Every response using the Drive corpus must display "Source: [filename]" with Drive link if available in metadata. Without citation, the response is perceived as invented. This is **table stakes, not a differentiator**.

### 4. Voice-in = table stakes / Voice-out = differentiator

Voice-in (Groq Whisper) is table stakes once VocalFlow.tsx bugs are fixed. Voice-out with personalities Kind/Sport/Warrior is the **strong differentiator** — "coach in your ear" doesn't exist in FR real estate. Toggle Off by default (open-space context).

### 5. Voice training full-duplex = maximum differentiator

Sales-situation scenarios (mandate pitch, buyer objections) where an AI plays the counterpart (ElevenLabs voice) and an LLM evaluates the agent's response — unique in the FR market. Complexity L. Deploy after copilot core is stable.

### 6. FR regulation = explicit guardrail

The copilot must NEVER generate contractually-binding content (price estimations, mandate clauses). Systematic warning when the topic touches estimation: "Utilisez votre outil d'évaluation agréé." Risk under loi Hoguet.

### 7. RAG Drive pipeline is the blocking prerequisite

`COACH_BRAIN_DRIVE_FOLDER_ID` is set in .env, but the indexing pipeline is partially in place. Before wiring citations, the indexing flow (Drive → embed → pgvector) must be operational. Complexity M, **critical path** for all RAG grounding.

---

## Table Stakes

| Feature | Complexity |
|---|---|
| Suggestions contextual to real ratios | M |
| 3 clickable cards on dashboard load (suggestion-first) | S |
| Streaming LLM response | M |
| RAG source citations (Drive filename) | M |
| Action buttons in responses (redirect to tools) | S |
| Voice-in (Groq Whisper) in copilot input | M |
| In-session message persistence (Zustand) | S |
| Loading indicator + LLM timeout fallback | S |

## Differentiators

| Feature | Complexity |
|---|---|
| 3 vocal personalities Kind/Sport/Warrior | M |
| Voice-out ElevenLabs (toggle off default) | M |
| Voice training full-duplex (AI sales situations) | L |
| Cross-session short memory (previous session summary) | L |
| Smart routing ratioId → exact route + params | M |
| "Clin d'œil" dashboard Top 3 red/orange/green | M |
| Inline copilot in dashboard (not separate page) | M |
| Clickable Drive links on RAG citations | M |
| 3-step onboarding wizard (conseiller only) | M |

## Anti-Features (deliberately NOT building)

- Generic chatbot ungrounded in real ratios
- Chat-first interface (empty ChatGPT-style screen)
- Multi-paragraph unstructured responses
- Cross-user or cross-organization memory (RGPD)
- Contractual document generation
- Global agent scoring/rating
- Voice-out autoplay without toggle
- Multi-LLM switcher in the UI
- Real-time suggestions per keystroke
- Permanent floating widget across the entire app

---

## Critical Dependencies

```
computeAllRatios() → Contextual suggestions → Top 3 dashboard
Drive corpus indexed → RAG grounding → Citations
VocalFlow.tsx fixed → Voice-in copilot → Voice training full-duplex
ElevenLabs configured → Voice-out + Personalities → AI training scenarios
```

## Suggested Phase Sequencing

- **Week 1**: Dashboard Top 3 cards (no LLM) + Suggestions on ratios (Anthropic, no RAG)
- **Week 2**: Streaming chat + RAG Drive pipeline operational
- **Week 3**: Citations + VocalFlow fixed + Training routing wires
- **Week 4**: Vocal personalities + Voice-out toggle + 1 operational training scenario

## Open Questions

- Drive corpus size? RAG quality scales with transcript richness/structure.
- ElevenLabs 2026 pricing — verify before any multi-agent rollout (risk of high per-character cost).
- Rate-limiting on copilot API routes — needed this milestone (solo usage: no, but plan for next milestone).
