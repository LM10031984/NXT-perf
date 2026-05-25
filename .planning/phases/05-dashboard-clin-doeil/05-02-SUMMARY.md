---
phase: 05-dashboard-clin-doeil
plan: "02"
subsystem: header-guided-tour
tags:
  - tour-restart
  - help-button
  - dash-05
date_completed: 2026-05-25
duration_minutes: 3
---

# Phase 5 Plan 2: "?" Tour CTA — DASH-05 Summary

**One-liner:** Bouton "?" guidé confirmé fonctionnel dans header pour relancer le tour depuis l'étape 1 — aucune modification requise.

## Verdict

**ALREADY SATISFIED** — Le plan DASH-05 est complètement implémenté et fonctionnel dans le code existant.

## Findings

### Bouton HelpCircle dans header.tsx

**Location:** `src/components/layout/header.tsx` (lines 252–266)

```typescript
{/* Help / replay tour button */}
<button
  type="button"
  onClick={() => {
    if (user) {
      const tourRole = getTourRole(user.availableRoles, user.mainRole);
      resetTourStatus(tourRole);
      window.location.reload();
    }
  }}
  title="Revoir le tour guidé"
  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] text-muted-foreground transition-all duration-[var(--transition-fast)] hover:bg-muted hover:text-foreground"
>
  <HelpCircle className="h-4 w-4" />
</button>
```

### Vérification des 3 critères

1. ✅ **Réinitialise le statut du tour** — `resetTourStatus(tourRole)` appelle `setTourStatus(role, "unseen")` ([src/lib/guided-tour.ts](src/lib/guided-tour.ts:57))
   - Cela marque le tour comme "unseen", déclenchant sa relance au prochain reload (voir ligne 29)

2. ✅ **Recharge la page** — `window.location.reload()` relance le voyage guidé depuis l'étape 1

3. ✅ **Visible pour TOUS les rôles** — Aucune condition `if manager || directeur` ; le bouton s'affiche pour tous les utilisateurs authentifiés

### Imports & Dépendances

- ✅ `HelpCircle` importé ligne 4 depuis lucide-react
- ✅ `resetTourStatus` et `getTourRole` importés ligne 17 depuis `@/lib/guided-tour`
- ✅ Aucun `// @ts-ignore` ; TypeScript passe correctement

### Placement dans le header

Le bouton est placé entre le bouton thème (Sun/Moon, ligne 235) et le bouton notifications (Bell, ligne 269), dans la rangée des icônes de droite — position logique et accessible.

## Deviations

None — plan executed exactly as written (no code changes were needed).

## Architecture Notes

**Tour flow en synthèse :**
1. Utilisateur clique sur "?" dans le header
2. `resetTourStatus(tourRole)` met le localStorage à `"unseen"` pour ce rôle
3. `window.location.reload()` recharge la page
4. Au reload, `src/app/(dashboard)/layout.tsx` (non inclus ici) vérifie `getTourStatus()` → si "unseen", lance le GuidedTour overlay
5. `getTourSteps(tourRole)` retourne les étapes du rôle de l'utilisateur (conseiller, manager, directeur ou réseau)
6. Utilisateur revit le tour complet depuis l'étape 1

**Preuve du fonctionnement :** La structure dans `src/lib/guided-tour.ts` montre que :
- `getTourStatus()` lit et retourne `state[role]` (défaut "unseen", ligne 31)
- `setTourStatus()` persiste dans localStorage avec clé `"nxt-guided-tour"`
- `resetTourStatus(role)` appelle explicitement `setTourStatus(role, "unseen")` (ligne 58)

## Self-Check

✅ Bouton HelpCircle trouvé dans header.tsx (lignes 252–266)
✅ resetTourStatus importé et utilisé
✅ Comportement onclick correct (resetTourStatus + reload)
✅ Titre FR correct : "Revoir le tour guidé"
✅ TypeScript passe : aucune erreur de type
✅ Autres boutons du header inchangés (DASH-06 OK)

## Conclusion

Le plan est 100 % satisfait. Le bouton "?" était déjà implémenté et fonctionne comme spécifié : il relance le tour guidé depuis l'étape 1 pour tous les rôles d'utilisateur (conseiller, manager, directeur, réseau), avec un label français approprié et aucun effet secondaire sur le reste du header.

**Aucun code à écrire. Aucune modification requise.**
