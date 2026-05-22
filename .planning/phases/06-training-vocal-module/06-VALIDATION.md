# Phase 6 — Validation Plan : Training Vocal Module

**Date plan:** 2026-05-22
**Scope:** Validation des 6 success criteria ROADMAP + DoD CONTEXT.md

---

## Critères de validation

### SC-1 — TypeScript propre, aucun `// @ts-ignore` non documenté (TRAIN-01)

**Commande :**
```bash
cd /Users/laurentmarx/Documents/Dashboard/NXT-perf
npx tsc --noEmit 2>&1 | grep "error TS" | head -20
grep -rn "ts-ignore" src/types/training.ts src/lib/scenario-engine.ts src/hooks/use-scenario-session.ts src/components/training/ src/data/training-scenarios/ src/app/\(dashboard\)/conseiller/training/ 2>/dev/null
```

**Attendu :**
- 0 ligne "error TS"
- 0 occurrence de `ts-ignore`

---

### SC-2 — Route training/[situation] répond (TRAIN-02)

**Commande :**
```bash
# Démarrer le serveur dev au préalable
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/conseiller/training/mandats
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/conseiller/training/estimation
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/conseiller/training/xyz-inconnu
```

**Attendu :**
- `/training/mandats` → 200
- `/training/estimation` → 200 (page "arrive bientôt")
- `/training/xyz-inconnu` → 200 (page "introuvable" — pas de 404 Next.js)

---

### SC-3 — Scénario mandats opérationnel end-to-end (TRAIN-03)

**Test manuel — séquence complète :**

1. Naviguer vers http://localhost:3000/conseiller/training/mandats
2. Vérifier : titre "Décrocher un mandat exclusif" + bouton "Commencer"
3. Cliquer "Commencer" → autoriser le micro si demandé
4. Vérifier : animation TTS active (avatar pulsant ou indicateur visuel)
5. Après lecture TTS step 0 : vérifier apparition du bouton micro rouge
6. Parler 5-10 secondes (se présenter en tant que conseiller)
7. Cliquer "Terminer" → vérifier spinner "Transcription..."
8. Vérifier feedback : transcript affiché, critères self-intro / confidence avec check/croix, score /10
9. Cliquer "Étape suivante" → TTS étape 1 ("Votre prix me semble bas...")
10. Répéter jusqu'à l'étape "wrap" (expectedAgentResponse: null)
11. Vérifier résumé final : score global, bouton "Recommencer"

**Critères de validation :**
- [ ] TTS joue audio (non silencieux)
- [ ] Transcript du tour agent affiché
- [ ] Feedback critères matchés/non matchés visible
- [ ] Score agrégé final affiché
- [ ] Bouton "Recommencer" relance depuis l'étape 0

---

### SC-4 — Endpoints existants utilisés sans nouveaux endpoints (TRAIN-05)

**Commande :**
```bash
grep -rn "api/voice/tts\|api/vocal" src/hooks/use-scenario-session.ts src/components/training/
grep -rn "new.*route\|createRoute\|export.*POST\|export.*GET" src/app/api/ 2>/dev/null | grep -i "training\|scenario"
```

**Attendu :**
- `use-scenario-session.ts` référence `/api/voice/tts` et utilise `transcribeAudio` (qui appelle `/api/vocal`)
- Aucun nouveau fichier route API dans src/app/api/ relatif au training

---

### SC-5 — Sidebar "Training vocal" (TRAIN-06)

**Commande :**
```bash
grep -n "Training vocal\|training/mandats\|Mic2" src/components/layout/sidebar.tsx
```

**Attendu :**
- Ligne avec `"Training vocal"` comme label
- Ligne avec `"/conseiller/training/mandats"` comme href
- Ligne avec `Mic2` comme icône

**Test visuel :** Dans le navigateur, vérifier que la sidebar conseiller affiche l'item "Training vocal" avec icône micro et qu'il est actif quand on est sur `/conseiller/training/mandats`.

---

### SC-6 — Pas de nouvelles tables Supabase (TRAIN-07)

**Commande :**
```bash
# Vérifier qu'aucune migration n'a été ajoutée
ls supabase/migrations/ 2>/dev/null | tail -5
grep -rn "supabase\|createClient\|from(" src/data/training-scenarios/ src/lib/scenario-engine.ts src/hooks/use-scenario-session.ts src/components/training/ 2>/dev/null
```

**Attendu :**
- Aucun nouveau fichier de migration relatif au training
- Aucun appel Supabase dans les fichiers training

---

## DoD complémentaire (CONTEXT.md)

### DoD-1 — Fichier mandats.ts complet
```bash
grep -c "id:" src/data/training-scenarios/mandats.ts
# Attendu : 6 (6 étapes)
grep "expectedAgentResponse: null" src/data/training-scenarios/mandats.ts
# Attendu : 1 ligne (l'étape wrap)
```

### DoD-2 — 4 stubs qui throw Error
```bash
for f in estimation objections-acheteur negociation-honoraires follow-up; do
  echo "=== $f ===" && grep "throw new Error" "src/data/training-scenarios/$f.ts"
done
```
**Attendu :** 4 lignes `throw new Error(...)` avec message explicite pour chaque fichier.

### DoD-3 — Build Next.js propre
```bash
cd /Users/laurentmarx/Documents/Dashboard/NXT-perf && npx next build 2>&1 | tail -10
```
**Attendu :** `✓ Compiled successfully` ou `Route (app)` tableau sans erreur rouge.

---

## Matrice de couverture requirements

| REQ-ID | Plan | Tâche | Validation |
|--------|------|-------|------------|
| TRAIN-01 | 06-00, 06-01, 06-02 | Types propres + aucun ts-ignore | SC-1 |
| TRAIN-02 | 06-00 (skeleton) + 06-02 (complet) | Route /training/[situation] | SC-2 |
| TRAIN-03 | 06-00 (données) + 06-01 (moteur) + 06-02 (UI) | Flow mandats E2E | SC-3 |
| TRAIN-05 | 06-01 (hook) | Endpoints TTS + STT réutilisés | SC-4 |
| TRAIN-06 | 06-02 | Sidebar nav | SC-5 |
| TRAIN-07 | (all) | Aucune table Supabase | SC-6 |

---

## Signaux de blocage

Si l'un des cas suivants se produit, stopper et documenter avant de continuer :

1. **TTS muet** : vérifier que `ELEVENLABS_WARRIOR_VOICE_ID` est défini dans `.env.local`. Si absent, le fallback `DEFAULT_VOICE_ID` sera utilisé — audio présent mais voix générique.

2. **MediaRecorder non disponible** : certains navigateurs demandent HTTPS. En dev (`localhost`), les navigateurs modernes autorisent le micro sur HTTP. Si refus, tester sur Chrome.

3. **Erreur CORS audio** : le `blob` retourné par `/api/voice/tts` est construit côté client via `response.blob()` — pas de problème CORS. Si `new Audio(objectURL)` échoue, vérifier que le type MIME est `audio/mpeg`.

4. **Erreur TypeScript sur MediaRecorder** : les types DOM incluent `MediaRecorder` — aucune lib externe nécessaire. Si erreur, vérifier `lib: ["dom"]` dans tsconfig.json (déjà présent dans la config NXT-perf).
