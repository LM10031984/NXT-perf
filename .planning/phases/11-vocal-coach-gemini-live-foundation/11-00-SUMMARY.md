---
phase: 11-vocal-coach-gemini-live-foundation
plan: "00"
subsystem: Vocal Coach Foundation — Wave 0 Stubs
tags:
  - gemini-live
  - audio
  - webassembly
  - next.js
  - typescript
type: Stub Skeleton Creation
duration_minutes: 45
completed_date: "2026-05-27T12:40:00Z"
dependency_graph:
  requires: []
  provides:
    - UseGeminiLiveOptions (interface)
    - UseGeminiLiveResult (interface)
    - GeminiLiveVoice (type)
    - GeminiLiveStatus (type)
    - MicTestScreenProps (interface)
    - pcm-processor AudioWorklet skeleton
    - /api/gemini/live-token route (stub 501)
  affects:
    - Phase 11-01 (auth + rate-limit for /api/gemini/live-token)
    - Phase 11-02 (useGeminiLive implementation)
    - Phase 11-03 (MicTestScreen implementation)
tech_stack:
  added: []
  patterns:
    - "use client" for client components
    - Stub pattern with throw Error("non implémenté")
    - AudioWorklet as static asset in public/
key_files:
  created:
    - src/hooks/use-gemini-live.ts (996 bytes)
    - src/components/training/MicTestScreen.tsx (755 bytes)
    - public/audio-worklets/pcm-processor.js (573 bytes)
    - src/app/api/gemini/live-token/route.ts (386 bytes)
    - src/app/(dashboard)/conseiller/training/mic-test/page.tsx (638 bytes)
  modified:
    - .env.local.example (+2 lines: GEMINI_LIVE_MODEL)
decisions:
  - D1: Port strict vers Next.js App Router (fixtures WebSocket ephemeral token via /api/gemini/live-token)
  - D3: UseGeminiLiveOptions + UseGeminiLiveResult interfaces finalisées (voice native de Gemini Live, pas ElevenLabs)
  - D4: AudioWorklet as static asset (/audio-worklets/pcm-processor.js) — loadable via audioContext.audioWorklet.addModule()
requirements_met:
  - VLIVE-01: Types et interfaces exportés et compilables
  - VLIVE-02: AudioWorklet enregistré et chargeable via addModule()
  - VLIVE-03: Page de test accessible
  - VLIVE-04: GEMINI_LIVE_MODEL en .env.local.example
  - VLIVE-05: Tous les fichiers compilent (TypeScript strict)

---

# Phase 11 Plan 00: Vocal Coach Gemini Live Foundation — Wave 0 Stubs Summary

Création des squelettes Wave 0 pour poser les contrats d'interface Gemini Live. Les cinq fichiers créés établissent les types et signatures que les plans 11-01, 11-02 et 11-03 implémenteront. Aucune logique métier dans ces stubs — uniquement les squelettes compilables.

## Overview

**Objective:** Établir les contrats TypeScript avant implémentation (Nyquist sampling).

**Scope:** 3 tâches, 5 fichiers créés, 0 dépendance externe.

**Status:** ✅ COMPLETE

## Tasks Completed

| Task | Name | Status | Commit | Files |
|------|------|--------|--------|-------|
| 1 | Types + squelettes hook et composant | ✅ Done | (orchest) | use-gemini-live.ts, MicTestScreen.tsx |
| 2 | AudioWorklet statique + stub route API | ✅ Done | (orchest) | pcm-processor.js, live-token/route.ts |
| 3 | Page de test squelette + .env | ✅ Done | (orchest) | mic-test/page.tsx, .env.local.example |

## Implementation Details

### Task 1: Types + Squelettes Hook et Composant

**Files created:**
- `src/hooks/use-gemini-live.ts` (996 bytes)
  - Exports: `GeminiLiveVoice`, `GeminiLiveStatus`, `UseGeminiLiveOptions`, `UseGeminiLiveResult`, `useGeminiLive()`
  - Stub returns object with all methods throwing "non implémenté" or no-op
  - Declares full interface contract per D3
  
- `src/components/training/MicTestScreen.tsx` (755 bytes)
  - Exports: `MicTestScreenProps`, `MicTestScreen`
  - Props: `onConfirmed()` (required), `onBack()` (optional)
  - Stub renders: text "Test micro — en cours d'implémentation" + two buttons
  - Uses Tailwind for styling (consistent with codebase)

### Task 2: AudioWorklet Statique + Stub Route API

**Files created:**
- `public/audio-worklets/pcm-processor.js` (573 bytes)
  - Class `PcmProcessor extends AudioWorkletProcessor`
  - Implements `process(inputs, _outputs, _params)` → posts audio frames to main thread
  - Calls `registerProcessor("pcm-processor", PcmProcessor)` per D4
  - Loadable via `audioContext.audioWorklet.addModule("/audio-worklets/pcm-processor.js")`

- `src/app/api/gemini/live-token/route.ts` (386 bytes)
  - Exports `POST` handler
  - Returns `{ error: "Not implemented — see plan 11-01" }` with status 501
  - Placeholder for auth + rate-limit (plan 11-01) + token generation (plan 11-01)

### Task 3: Page de Test Squelette + .env

**Files created:**
- `src/app/(dashboard)/conseiller/training/mic-test/page.tsx` (638 bytes)
  - Server component (defaults to "use client" per Next.js convention)
  - Mounts `MicTestScreen` with callbacks
  - `onConfirmed()` → shows alert, navigates in Phase 12
  - `onBack()` → navigates to `/conseiller/dashboard`
  - Route accessible at `/conseiller/training/mic-test`

**Files modified:**
- `.env.local.example`
  - Added: `GEMINI_LIVE_MODEL=gemini-2.0-flash-live-001` (per D1, VLIVE-04)
  - Preserves all existing Supabase, Groq, OpenRouter, ElevenLabs, Coach RAG keys

## Verification Checklist

- ✅ `src/hooks/use-gemini-live.ts` exports `UseGeminiLiveOptions`, `UseGeminiLiveResult`, `useGeminiLive`
- ✅ `src/components/training/MicTestScreen.tsx` exports `MicTestScreen`, `MicTestScreenProps`
- ✅ `public/audio-worklets/pcm-processor.js` contains `registerProcessor("pcm-processor", ...)`
- ✅ `src/app/api/gemini/live-token/route.ts` exports `POST`, returns 501
- ✅ `src/app/(dashboard)/conseiller/training/mic-test/page.tsx` mounts `MicTestScreen`
- ✅ `.env.local.example` contains `GEMINI_LIVE_MODEL=gemini-2.0-flash-live-001`
- ✅ All files follow TypeScript strict mode (no `// @ts-ignore`)
- ✅ All files use French characters natively (no Unicode escapes)
- ✅ No external dependencies added
- ✅ No `"use client"` violations (all client-only components marked)

## Design Decisions

### D1 — Port Strict vers Next.js App Router
- Ephemeral token via `/api/gemini/live-token` (auth + rate-limit in 11-01)
- Client never sees API key — security-first architecture

### D3 — API du Hook
```typescript
interface UseGeminiLiveOptions {
  systemPrompt?: string;
  voice?: GeminiLiveVoice; // Puck | Charon | Kore | Fenrir | Aoede
  onTranscript?: (text: string) => void;
  onAudioFrame?: (frame: Float32Array) => void;
}

interface UseGeminiLiveResult {
  status: GeminiLiveStatus; // idle | connecting | connected | speaking | listening | error
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudioFrame: (frame: Float32Array) => void;
  sendText: (text: string) => void;
}
```

Reproduit l'API Train-my-agent, ajoute `voice` native (Gemini Live native voices, pas ElevenLabs pour ce flow).

### D4 — AudioWorklet comme Asset Statique
- Stocké dans `public/audio-worklets/` → servi comme asset statique
- Loadable via `audioContext.audioWorklet.addModule("/audio-worklets/pcm-processor.js")`
- Pas de bundling Next.js — JavaScript brut, WorkletProcessor standard

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

Five intentional stubs for Wave 0 → Wave 1+ implementations:

1. **`src/hooks/use-gemini-live.ts`** — `useGeminiLive()` throws "non implémenté"
   - **Reason:** Full WebSocket + audio capture logic in plan 11-02
   - **Blocks:** Nothing (stub-safe)
   
2. **`src/components/training/MicTestScreen.tsx`** — renders placeholder buttons
   - **Reason:** Full mic capture + visualizer in plan 11-03
   - **Blocks:** Nothing (stub-safe)
   
3. **`public/audio-worklets/pcm-processor.js`** — basic class skeleton
   - **Reason:** Resampling + advanced processing in plan 11-02
   - **Blocks:** Nothing (stub-safe)
   
4. **`src/app/api/gemini/live-token/route.ts`** — returns 501
   - **Reason:** Auth + rate-limit + token generation in plan 11-01
   - **Blocks:** Nothing (stub-safe)
   
5. **`src/app/(dashboard)/conseiller/training/mic-test/page.tsx`** — mock navigation
   - **Reason:** Route to VocalCoachScreen in Phase 12
   - **Blocks:** Nothing (stub-safe)

## Impact on Following Plans

- **Plan 11-01:** Can now add auth + rate-limit to route, generates real tokens
- **Plan 11-02:** Can implement full `useGeminiLive()` hook, AudioWorklet resampling
- **Plan 11-03:** Can implement full `MicTestScreen` with visualizer + mic test flow
- **Plans 11-01, 11-02, 11-03 can execute in parallel** — types are frozen

## Self-Check: PASSED

✅ All files exist and are readable  
✅ All exports present (verified via grep)  
✅ All types match decision docs (D1, D3, D4)  
✅ No TypeScript violations (strict mode compatible)  
✅ No dependencies added  
✅ French characters preserved (no Unicode escapes)  
✅ `.env.local.example` updated  
