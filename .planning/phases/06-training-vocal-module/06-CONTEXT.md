# Phase 6 — Training Vocal Module — Context

**Date:** 2026-05-22 — fast-path CONTEXT
**Source repo:** https://github.com/LM10031984/Train-my-agent (private, Vite/React/TS, ~1.5MB TS, own Supabase schema)
**Depends on:** Phase 3 (VocalFlow infra stable)

## Phase Boundary

**Port** (not copy) the training-vocal app from Vite/React to Next.js App Router. Ship **1 operational scenario** (mandats). Other scenarios stubbed for v2.

Out of scope: full scenario library, gamification UI, debrief deep-dive, full Supabase schema reconciliation (we make minimal changes only).

## Approach: Minimum Viable Port

The Train-my-agent repo is huge. We CANNOT port everything in one phase. Strategy:

1. **Cherry-pick the scenario engine** (the core: scenario JSON → coach voice → user mic → transcription → next step)
2. **Reuse NXT-perf infra**: ElevenLabs TTS via `/api/voice/tts`, Groq Whisper via `/api/vocal`, transcription wrapper via `src/lib/transcription.ts` (Phase 3)
3. **Hard-code the mandats scenario** as TypeScript data, not Supabase (defer multi-tenant schemas)
4. **Skip gamification** (badges, levels) — out of scope
5. **Skip debrief logs persistence** — keep session in memory only

## Canonical Refs

| Ref | Path |
|---|---|
| Train-my-agent root | `https://github.com/LM10031984/Train-my-agent` (read via gh api or clone temporarily) |
| Voice TTS | `src/app/api/voice/tts/route.ts` — POST `{ text, voiceId }` → audio stream |
| Voice STT | `src/app/api/vocal/route.ts` — POST audio → JSON |
| Transcription wrapper | `src/lib/transcription.ts` (Phase 3) |
| Persona map | `src/lib/constants.ts` — `SITUATION_PERSONA_MAP` (Phase 1) |
| Sidebar | `src/components/layout/sidebar.tsx` — add "Training vocal" nav item |
| Copilot deep-link | Phase 4 + 5 — Dashboard card action button `href="/conseiller/training/mandats"` |

## Decisions

### D1 — Scenario data structure

```ts
// src/data/training-scenarios/mandats.ts
export const mandatsScenario: TrainingScenario = {
  id: "mandats",
  title: "Décrocher un mandat exclusif",
  persona: SITUATION_PERSONA_MAP.mandats, // "warrior"
  steps: [
    {
      id: "intro",
      coachLine: "Bonjour ! Aujourd'hui on travaille la signature de mandat exclusif. Tu rencontres un vendeur qui hésite. Je joue son rôle. Présente-toi.",
      expectedAgentResponse: { criteria: ["self-intro", "confidence"], minDurationSec: 5 },
    },
    {
      id: "objection-prix",
      coachLine: "Votre prix me semble bas par rapport à mes attentes...",
      expectedAgentResponse: { criteria: ["acknowledge", "evidence", "redirect-to-strategy"], minDurationSec: 10 },
    },
    // ... 5-8 steps total for mandats
    {
      id: "wrap",
      coachLine: "Très bien. Tu as géré l'objection prix correctement. Ton score d'argumentation : 7/10. Garde le ton calme la prochaine fois.",
      expectedAgentResponse: null, // end of scenario
    },
  ],
}
```

Other 4 scenarios get stub files that throw `Error("Scenario [name] not implemented yet")` so type system catches breaks.

### D2 — Scenario runner UI

Page `src/app/(dashboard)/conseiller/training/[situation]/page.tsx`:

1. Hero: scenario title + persona avatar + "Commencer" button
2. Active step UI: coach speaking (pulsing avatar) → user turn (mic recording) → transcript shown → coach evaluates and moves to next step
3. End: summary + "Refaire" / "Retour dashboard"

State managed via Zustand-like local `useReducer` (no new store — keep it local to this route).

### D3 — Evaluation: simple heuristic for v1

Don't try to LLM-evaluate. For v1:
- Check `criteria` matches (simple keyword presence in transcript) — pure function `evaluateAgentResponse(transcript, criteria)`
- Show pass/fail per criterion
- Aggregate score = % of criteria matched

Phase 7+ can replace with LLM evaluation via copilot endpoint.

### D4 — Supabase schemas: minimal

Skip the full Train-my-agent schema. Don't create new Supabase tables this phase. Session data stays in memory. If user wants persistence later, that's a future phase.

This honors TRAIN-07's "either reconciled OR kept separate with documented isolation" — we choose the "neither now" sub-option, documented as deferred.

### D5 — Sidebar entry

Add to `src/components/layout/sidebar.tsx`, conseiller section:
```tsx
{ label: "Training vocal", href: "/conseiller/training/mandats", icon: <Mic2 /> }
```

(Direct link to mandats scenario since it's the only one shipping. Future scenarios get an index page at `/conseiller/training`.)

### D6 — No `// @ts-ignore`

Port carefully. If a piece of Train-my-agent code uses untyped externals, write proper types or skip that feature.

## Definition of Done

1. `src/data/training-scenarios/mandats.ts` exists with full step data
2. `src/app/(dashboard)/conseiller/training/[situation]/page.tsx` renders the mandats scenario end-to-end (TTS → user turn → transcript → next step → wrap)
3. Sidebar shows "Training vocal" entry pointing to mandats
4. Deep-link from copilot/dashboard works
5. Other 4 SituationTypes have stub data files that throw clearly
6. No new Supabase tables created
7. `npx tsc --noEmit` green
8. SUMMARY.md + VERIFICATION.md
