# Phase 11 — Vocal Coach Gemini Live Foundation — Context

**Date:** 2026-05-26 — fast-path CONTEXT
**Milestone:** v1.1 (M2)
**Source repo:** https://github.com/LM10031084/Train-my-agent (Vite/React — à porter vers Next.js App Router)
**Depends on:** rien (en parallèle de Phase 8)

## Phase Boundary

Poser les **fondations Gemini Live** (WebSocket full-duplex) en portant les pièces audio bas-niveau de Train-my-agent. Pas encore de scenarios ni d'UI scenario player — c'est la Phase 12. Cette phase produit : un hook réutilisable + un MicTestScreen onboarding + l'AudioWorklet.

Out of scope: scenarios JSON, VocalCoachScreen complet, debrief, sidebar updates (tous Phase 12 ou 13).

## Canonical Refs

| Ref | Path |
|---|---|
| Source hook | `https://github.com/LM10031984/Train-my-agent/blob/main/hooks/useGeminiLive.ts` |
| Source MicTest | `https://github.com/LM10031984/Train-my-agent/blob/main/components/MicTestScreen.tsx` |
| Source AudioWorklet | `https://github.com/LM10031984/Train-my-agent/blob/main/components/AudioWorkletTest.tsx` |
| Visualizer | `https://github.com/LM10031984/Train-my-agent/blob/main/components/Visualizer.tsx` |
| Existing Gemini dep | `@google/genai 1.48.0` (déjà installé dans NXT-perf) |
| Env | `GEMINI_API_KEY` (déjà en .env.local) — `GEMINI_LIVE_MODEL` à ajouter |
| Existing audio infra | `src/components/vocal/VocalFlow.tsx`, `src/hooks/use-vocal-recorder.ts` (Phase 3 — référence) |
| Deprecated turn-based | `src/hooks/use-scenario-session.ts`, `src/lib/scenario-engine.ts` (M1 Phase 6 — à marquer deprecated en Phase 12) |

## Decisions

### D1 — Port strict vers Next.js App Router

`hooks/useGeminiLive.ts` du repo Vite → `src/hooks/use-gemini-live.ts` NXT-perf.

Adaptations nécessaires :
- Vite import.meta.env → Next.js `process.env.NEXT_PUBLIC_GEMINI_API_KEY` OU mieux : passer par une route API qui retourne un token temporaire (Gemini Live supporte ephemeral tokens). **Décision : ephemeral token via `/api/gemini/live-token` pour ne PAS exposer la clé côté client.**
- Tout autre code Vite-specific (HMR, vite-plugin-*) → enlever
- TypeScript strict — pas de `// @ts-ignore`

### D2 — Architecture client/serveur

```
Client (NXT-perf)
  ↓ POST /api/gemini/live-token (Supabase auth check)
  ↓ → JSON { token: "...", expiresAt: "..." }
Client uses ephemeralToken
  ↓ open WebSocket wss://generativelanguage.googleapis.com/ws/...
  ↓ stream audio frames + receive audio frames
```

`/api/gemini/live-token` :
- POST endpoint
- requireAuth (avec X-Demo-Mode bypass comme Phase 2)
- Rate-limited (10 tokens/min/user)
- Génère un token via `@google/genai`
- Le client utilise CE token, pas la clé maître

### D3 — `use-gemini-live` API

```ts
export interface UseGeminiLiveOptions {
  systemPrompt?: string
  voice?: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede"  // Gemini Live voices
  onTranscript?: (text: string) => void
  onAudioFrame?: (frame: Float32Array) => void
}

export interface UseGeminiLiveResult {
  status: "idle" | "connecting" | "connected" | "speaking" | "listening" | "error"
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  sendAudioFrame: (frame: Float32Array) => void
  sendText: (text: string) => void
}
```

Reproduire l'API du hook Train-my-agent, ajouter `voice` (Gemini Live a des voices natifs, on n'a plus besoin d'ElevenLabs pour ce flow).

### D4 — AudioWorklet pour la capture micro

`public/audio-worklets/pcm-processor.js` : worklet qui convertit le flux micro en frames Float32Array 16kHz mono (format que Gemini Live attend). Porté depuis Train-my-agent.

Loader via `audioContext.audioWorklet.addModule("/audio-worklets/pcm-processor.js")` dans le hook.

### D5 — MicTestScreen

`src/components/training/MicTestScreen.tsx` : composant qui :
- Demande permission micro
- Affiche un visualizer (waveform OU level meter) pour vérifier que le micro capte
- Bouton "Test : dire 'allô'" → enregistre 3s, lecture pour vérifier
- Bouton "Continuer" → callback `onConfirmed()`

Affiché AVANT chaque scenario en Phase 12 si l'utilisateur n'a pas validé son micro dans la session.

### D6 — Fallback permission micro

Si l'utilisateur refuse la permission micro :
- Écran clair avec icône + texte FR : "Permission micro refusée. Active-la dans tes paramètres navigateur pour utiliser le training vocal."
- Bouton "Réessayer" → re-demande
- Bouton "Retour" → navigue vers le dashboard
- Pas de crash silencieux

### D7 — Pas de changement aux composants Phase 6 maintenant

`ScenarioRunner` + `use-scenario-session` + `scenario-engine` ne sont PAS supprimés en Phase 11. La Phase 12 les marquera `@deprecated` quand le nouveau VocalCoachScreen sera prêt. Phase 13 fera le cleanup final.

## Definition of Done

1. `src/hooks/use-gemini-live.ts` existe avec l'API documentée en D3
2. `public/audio-worklets/pcm-processor.js` chargé sans erreur
3. `src/components/training/MicTestScreen.tsx` rend l'écran de test micro fonctionnel
4. `src/app/api/gemini/live-token/route.ts` retourne un ephemeral token (auth + rate-limit + X-Demo-Mode)
5. Une page de test `/conseiller/training/_mic-test` (ou similar) permet à Laurent de valider que le micro capture et que Gemini Live répond
6. `GEMINI_LIVE_MODEL` dans `.env.local.example`
7. `npx tsc --noEmit` + lint clean
8. Permission micro refusée → écran fallback FR clair, pas de crash
