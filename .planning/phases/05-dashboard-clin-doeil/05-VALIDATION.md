# Phase 5 — Dashboard "Clin d'œil" — Validation

**Phase :** 05-dashboard-clin-doeil
**Dépend de :** Phase 1 (ratios, criticité), Phase 4 (copilot-store)
**Date cible :** post-exécution des 3 plans

---

## Checklist de validation finale

Exécuter après que les 3 plans (05-00, 05-01, 05-02) sont marqués complets.

### A. TypeScript + Tests

```bash
cd /Users/laurentmarx/Documents/Dashboard/NXT-perf

# 1. Compilation stricte — 0 erreur attendue
npx tsc --noEmit

# 2. Tests unitaires dashboard-priorities
npx vitest run src/lib/__tests__/dashboard-priorities.test.ts

# 3. Suite complète
npx vitest run
```

Critère : toutes les commandes ci-dessus sortent avec code 0.

---

### B. Présence des artefacts

```bash
# Lib déterministe
ls -la src/lib/dashboard-priorities.ts
grep -c "derivePriorityCards\|RATIO_SITUATION_MAP\|PriorityCard" src/lib/dashboard-priorities.ts

# Composant Top3
ls -la src/components/conseiller/dashboard/Top3PrioritesSection.tsx
grep -c "severity\|verdict\|action" src/components/conseiller/dashboard/Top3PrioritesSection.tsx

# Montage dans la page
grep -n "Top3PrioritesSection" src/app/\(dashboard\)/conseiller/diagnostic/page.tsx

# Header ?
grep -n "resetTourStatus\|HelpCircle" src/components/layout/header.tsx
```

---

### C. Vérification DASH-03 — aucun LLM appelé au rendu

```bash
# Aucun "fetch" dans Top3PrioritesSection (les actions sont des href, pas des appels)
grep -n "fetch\|axios\|api/" src/components/conseiller/dashboard/Top3PrioritesSection.tsx || echo "OK — pas de fetch"

# derivePriorityCards est une fonction pure (pas de async, pas de fetch)
grep -n "async\|fetch\|Promise" src/lib/dashboard-priorities.ts || echo "OK — pure function"
```

---

### D. Vérification DASH-06 — pages existantes préservées

```bash
# Les 5 composants existants sont toujours présents dans diagnostic/page.tsx
grep -c "VocalDrawer\|CopilotSuggestionCards\|DiagnosticVerdictView\|DiagnosticRatiosView\|DiagnosticVolumesView" \
  src/app/\(dashboard\)/conseiller/diagnostic/page.tsx
# Attendu : 5
```

---

### E. Vérification visuelle (checkpoint humain)

1. Démarrer le serveur : `npx next dev --port 3000 --hostname 0.0.0.0`
2. Ouvrir http://localhost:3000 en mode démo
3. Naviguer vers `/conseiller/diagnostic`

**Vérifier :**
- [ ] 3 cartes apparaissent en haut de page (avant VocalDrawer)
- [ ] Card 1 a une bordure rouge, card 2 orange, card 3 verte
- [ ] Chaque card affiche un verdict en français (phrase lisible, pas "Chargement…")
- [ ] Chaque card a 1 bouton d'action (pas 0, pas 2)
- [ ] Cliquer le bouton "Lancer le training X" redirige vers `/conseiller/training/X`
- [ ] Cliquer "Voir le détail" redirige vers `/conseiller/diagnostic?view=ratios&highlight=...`
- [ ] VocalDrawer est toujours visible sous les 3 cartes
- [ ] CopilotSuggestionCards est toujours visible
- [ ] Le bouton "?" dans le header est présent
- [ ] Cliquer "?" recharge la page et relance le tour guidé
- [ ] Les pages `/resultats`, `/performance`, `/comparaison`, `/saisie`, `/formation`, `/objectifs` s'ouvrent sans erreur

---

## Critères de complétion de la phase

| Critère | Vérification | Statut |
|---------|-------------|--------|
| DASH-01 : 3 cartes rouge/orange/vert en haut du dashboard | Section E — visuellement | [ ] |
| DASH-02 : 1 verdict + 1 bouton par carte | Section E — visuellement | [ ] |
| DASH-03 : déterministe, sans LLM | Section C — grep | [ ] |
| DASH-04 : deep-links corrects | Section E — clic manuel | [ ] |
| DASH-05 : bouton "?" relance le tour | Section E — clic manuel | [ ] |
| DASH-06 : pages existantes accessibles | Section D — grep + navigation | [ ] |
| TypeScript strict | Section A — `npx tsc --noEmit` | [ ] |
| Tests unitaires | Section A — `npx vitest run` | [ ] |

Phase complète quand tous les critères sont cochés.

---

## Artéfacts produits par cette phase

- `src/lib/dashboard-priorities.ts` — logique déterministe (types + derivePriorityCards + RATIO_SITUATION_MAP)
- `src/components/conseiller/dashboard/Top3PrioritesSection.tsx` — composant UI 3 cartes
- `src/app/(dashboard)/conseiller/diagnostic/page.tsx` — modifié (Top3PrioritesSection monté)
- `src/lib/__tests__/dashboard-priorities.test.ts` — tests unitaires
- (header.tsx — vérification/confirmation du bouton HelpCircle existant)
