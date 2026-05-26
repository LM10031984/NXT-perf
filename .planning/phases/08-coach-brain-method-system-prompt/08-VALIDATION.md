# Phase 8 — Validation Plan

**Phase :** 08-coach-brain-method-system-prompt
**Requirements couverts :** METHOD-01, METHOD-02, METHOD-03, METHOD-04, RAG2-02, RAG2-03, RAG2-04

---

## Checks automatisés (après exécution complète des 3 plans)

Lancer dans l'ordre depuis la racine du projet :

```bash
# 1. TypeScript — aucune erreur
npx tsc --noEmit

# 2. Lint
npx next lint

# 3. Tests unitaires
npx vitest run src/lib/server/coach-rag/__tests__/

# 4. Vérification artefacts
test -f src/data/coaching-method/coaching-method.md && echo "METHOD-01 OK"
grep -q 'version: "1.0"' src/data/coaching-method/coaching-method.md && echo "METHOD-04 OK"
grep -q '<coaching-method>' src/lib/server/coach-rag/system-prompt.ts && echo "METHOD-02 OK"
grep -q 'readCoachingMethod' src/app/api/copilot/stream/route.ts && echo "METHOD-01 wiring OK"
test -f docs/llm-benchmark.md && echo "RAG2-02 OK"
grep -q 'COACH_RAG_DEFAULT_MODEL=google/gemini-flash-1.5' .env.local.example && echo "RAG2-03/04 OK"
npx tsx scripts/benchmark-llm.ts --dry-run && echo "RAG2-02 CLI OK"
```

---

## Critères de succès par requirement

### METHOD-01 — coaching-method.md rapatrié et versionné
- [ ] `src/data/coaching-method/coaching-method.md` existe dans le repo
- [ ] Contient un frontmatter YAML avec `version:`, `extractedFrom:`, `extractedAt:`
- [ ] Contient `# Méthode coaching NXT` et les 7 règles d'or

### METHOD-02 — buildSystemPrompt injecte `<coaching-method>`
- [ ] `grep '<coaching-method>' src/lib/server/coach-rag/system-prompt.ts` trouve la balise dans `formatCoachingMethod`
- [ ] `BuildSystemPromptInput` a le champ `coachingMethod?: string`
- [ ] `/api/copilot/stream` passe `coachingMethod: readCoachingMethod()` à `buildSystemPrompt`

### METHOD-03 — Tests unitaires de cohérence méthode
- [ ] `npx vitest run src/lib/server/coach-rag/__tests__/coaching-method-injection.test.ts` → 6 PASS
- [ ] Aucun test régressé dans `system-prompt.test.ts`

### METHOD-04 — Versioning traçable
- [ ] `extractedFrom: "nxt-coach/data/coaching-method.md"` présent dans le frontmatter
- [ ] `extractedAt:` avec date présent dans le frontmatter
- [ ] `coaching-method.ts` conserve `COACHING_METHOD_NXT` pour fallback + backward compat

### RAG2-02 — Benchmark documenté
- [ ] `docs/llm-benchmark.md` existe
- [ ] Contient les 4 modèles (Claude Haiku, GPT-4o-mini, Gemini Flash, Mistral)
- [ ] Contient les 3 prompts standards (`p1-mandats`, `p2-prospection`, `p3-motivation`)
- [ ] Contient un tableau de notes qualitatives vide pour Laurent
- [ ] Contient la méthodologie (critères mesurés, script à lancer)

### RAG2-03 — COACH_RAG_DEFAULT_MODEL configuré
- [ ] `.env.local.example` contient `COACH_RAG_DEFAULT_MODEL=google/gemini-flash-1.5` (décommenté)
- [ ] Commentaire référence `docs/llm-benchmark.md`

### RAG2-04 — Modèle configurable via env var
- [ ] `src/app/api/copilot/stream/route.ts` lit `process.env.COACH_RAG_DEFAULT_MODEL` (ligne ~35 inchangée)
- [ ] Aucun modèle hardcodé sans fallback env var

---

## Vérification manuelle (Laurent — post-exécution)

Ces checks ne peuvent PAS être automatisés :

### Check qualité méthode (METHOD-03 partiel)
1. Démarrer le serveur dev : `npx next dev --port 3000`
2. Ouvrir le copilote sur le dashboard conseiller
3. Envoyer le message : `"Mon ratio mandats est de 0.4, la cible c'est 2.0. Comment je m'améliore ?"`
4. Observer la réponse — elle doit :
   - Utiliser le tutoiement
   - Contenir au moins une question ouverte (ex : "Comment tu perçois...")
   - Proposer au moins 1 action concrète
   - Ne PAS inventer de statistiques

### Check benchmark réel (RAG2-02 run effectif)
```bash
OPENROUTER_API_KEY=sk-or-... npx tsx scripts/benchmark-llm.ts
```
Puis remplir les notes 1-10 dans `docs/llm-benchmark.md`.

### Check token budget (D-03)
- Vérifier dans les logs que `[coaching-method]` ne logue PAS de warning de troncature
- Si la méthode fait < 2000 tokens (~8000 chars) : injection complète OK

---

## Rollback

Si la méthode injectée dégrade les réponses :
1. Passer `coachingMethod: undefined` dans l'appel `buildSystemPrompt` de `route.ts`
2. Aucun autre changement nécessaire (champ optionnel, backward compat)

Si le modèle recommandé est insuffisant :
1. Changer `COACH_RAG_DEFAULT_MODEL` dans `.env.local` (ou `.env.local.example`)
2. Redémarrer le serveur
3. Aucun redéploiement nécessaire en dev
