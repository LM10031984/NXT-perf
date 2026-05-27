# Phase 11 — Vocal Coach Gemini Live Foundation — Validation

**Phase :** 11-vocal-coach-gemini-live-foundation
**Milestone :** M2 — Coach Brain + Vocal Coach Refonte
**Date de création :** 2026-05-26
**Requirements :** VLIVE-01, VLIVE-02, VLIVE-03, VLIVE-04, VLIVE-05

---

## Critères de validation par requirement

### VLIVE-01 — Hook use-gemini-live.ts

| Critère | Commande de vérification | Attendu |
|---------|--------------------------|---------|
| Le fichier existe | `ls src/hooks/use-gemini-live.ts` | Fichier présent |
| Exporte les types requis | `grep -c "UseGeminiLiveOptions\|UseGeminiLiveResult\|useGeminiLive" src/hooks/use-gemini-live.ts` | >= 3 |
| State machine correcte | Lire le fichier — vérifier les 6 statuts | idle, connecting, connected, speaking, listening, error |
| connect() appelle la route token | `grep "gemini/live-token" src/hooks/use-gemini-live.ts` | >= 1 ligne |
| WebSocket vers Gemini | `grep "generativelanguage.googleapis.com" src/hooks/use-gemini-live.ts` | >= 1 ligne |
| Zéro ts-ignore | `grep "ts-ignore" src/hooks/use-gemini-live.ts` | Vide |

### VLIVE-02 — AudioWorklet pcm-processor.js

| Critère | Commande de vérification | Attendu |
|---------|--------------------------|---------|
| Fichier dans public/ | `ls public/audio-worklets/pcm-processor.js` | Fichier présent |
| registerProcessor présent | `grep "registerProcessor" public/audio-worklets/pcm-processor.js` | >= 1 ligne |
| Resampling 16 kHz | `grep "TARGET_SAMPLE_RATE\|16000" public/audio-worklets/pcm-processor.js` | >= 1 ligne |
| Chargement dans hook | `grep "addModule.*pcm-processor" src/hooks/use-gemini-live.ts` | >= 1 ligne |

### VLIVE-03 — MicTestScreen

| Critère | Commande de vérification | Attendu |
|---------|--------------------------|---------|
| Fichier existe | `ls src/components/training/MicTestScreen.tsx` | Fichier présent |
| Exporte le composant | `grep "export function MicTestScreen\|export.*MicTestScreenProps" src/components/training/MicTestScreen.tsx` | >= 2 lignes |
| Gestion permission refusée | `grep -i "refus\|AlertTriangle\|error" src/components/training/MicTestScreen.tsx` | >= 2 lignes |
| Visualizer AnalyserNode | `grep "AnalyserNode\|AnalyserNode\|analyser\|getByteFrequencyData" src/components/training/MicTestScreen.tsx` | >= 1 ligne |
| Cleanup audio | `grep "audioContext.*close\|getTracks" src/components/training/MicTestScreen.tsx` | >= 1 ligne |

### VLIVE-04 — Configuration env

| Critère | Commande de vérification | Attendu |
|---------|--------------------------|---------|
| GEMINI_LIVE_MODEL dans example | `grep "GEMINI_LIVE_MODEL" .env.local.example` | >= 1 ligne |
| Valeur par défaut documentée | `grep "gemini-2.0-flash-live" .env.local.example` | >= 1 ligne |

### VLIVE-05 — Fallback permission micro

| Critère | Commande de vérification | Attendu |
|---------|--------------------------|---------|
| Écran fallback implémenté | `grep -i "Permission micro refusée\|paramètres navigateur" src/components/training/MicTestScreen.tsx` | >= 1 ligne |
| Bouton Réessayer | `grep -i "Réessayer\|onRetry" src/components/training/MicTestScreen.tsx` | >= 1 ligne |
| Bouton Retour | `grep "onBack" src/components/training/MicTestScreen.tsx` | >= 2 lignes (déclaration + usage) |

---

## Validation compilation globale

```bash
# Vérification TypeScript stricte
npx tsc --noEmit
# Résultat attendu : "Found 0 errors." (ou pas d'erreurs sur les fichiers de la phase)

# Vérification absence ts-ignore
grep -r "ts-ignore" \
  src/hooks/use-gemini-live.ts \
  src/components/training/MicTestScreen.tsx \
  src/app/api/gemini/live-token/route.ts
# Résultat attendu : aucune ligne

# Vérification assets statiques
ls public/audio-worklets/pcm-processor.js
# Résultat attendu : le fichier existe
```

---

## Tests fonctionnels manuels (UAT)

Ces tests doivent être effectués avec le serveur dev en cours (`npx next dev --port 3000`).

### Test 1 — Route demo mode

```bash
curl -s -X POST http://localhost:3000/api/gemini/live-token \
  -H "X-Demo-Mode: true" | jq .
```

Attendu :
```json
{
  "token": "demo-live-token-...",
  "expiresAt": "...",
  "demo": true
}
```

### Test 2 — Route sans auth

```bash
curl -s -X POST http://localhost:3000/api/gemini/live-token | jq .
```

Attendu : `{"error":"Unauthorized"}` avec status 401

### Test 3 — Page MicTestScreen

1. Naviguer vers `http://localhost:3000/conseiller/training/mic-test`
2. Vérifier : écran initial "Test du microphone" visible
3. Cliquer "Tester le microphone" → autoriser la permission
4. Vérifier : barres du visualizer bougent en parlant
5. Cliquer "Le micro fonctionne — Continuer"
6. Vérifier : alert "Micro validé" s'affiche (comportement Phase 11 — sera remplacé en Phase 12)

### Test 4 — Fallback permission refusée

1. Recharger `/conseiller/training/mic-test`
2. Cliquer "Tester le microphone" → refuser la permission navigateur
3. Vérifier : écran "Permission micro refusée" s'affiche
4. Vérifier : texte "Active-la dans tes paramètres navigateur" visible
5. Vérifier : bouton "Réessayer" présent
6. Vérifier : bouton "Retour" présent et navigue vers `/conseiller/dashboard`

### Test 5 — Déconnexion propre (si GEMINI_API_KEY valide disponible)

1. Naviguer vers `/conseiller/training/mic-test`
2. Passer le MicTestScreen
3. Ouvrir la DevTools Console
4. Appeler manuellement `connect()` via le hook (si exposé sur window en dev)
5. Vérifier : aucune erreur console sur le chargement du worklet `pcm-processor`
6. Vérifier : status passe à `connecting` puis `connected`

---

## Definition of Done — Phase 11

- [ ] `src/hooks/use-gemini-live.ts` implémenté, API conforme à D3
- [ ] `public/audio-worklets/pcm-processor.js` chargé sans erreur, resampling 16 kHz
- [ ] `src/components/training/MicTestScreen.tsx` : visualizer + permission + fallback FR
- [ ] `src/app/api/gemini/live-token/route.ts` : auth + rate-limit + demo mode
- [ ] Page `/conseiller/training/mic-test` navigable et fonctionnelle
- [ ] `GEMINI_LIVE_MODEL` dans `.env.local.example`
- [ ] `npx tsc --noEmit` propre
- [ ] Permission refusée → écran fallback FR, pas de crash
- [ ] Zéro `// @ts-ignore`
- [ ] Les fichiers Phase 6 (`ScenarioRunner`, `use-scenario-session`) sont intacts (per D7)
