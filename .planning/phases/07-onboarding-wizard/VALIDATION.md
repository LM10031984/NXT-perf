# Phase 07 — Onboarding Wizard — Validation

**Date:** 2026-05-21
**Phase:** 07-onboarding-wizard
**Mode:** fast-track (no plan-checker)

---

## Critères de validation phase complète

### V-1 — Filet de sécurité non-conseiller (ONBO-03)

```bash
# Les tests E2E non-conseiller passent AVANT et APRÈS le wizard
cd /Users/laurentmarx/Documents/Dashboard/NXT-perf
npx playwright test e2e/register-non-conseiller.spec.ts --reporter=line
# Attendu : 0 failed
```

Vérifie que :
- `/register?profile=MANAGER` → legacy form avec bloc Organisation visible
- `/register?profile=INSTITUTION` → legacy form avec bloc Organisation (directeur)
- `/register` sans paramètre → wizard conseiller (après plan 02)
- `/register?code=AG-1234` → legacy form (roleLocked, conseiller verrouillé)

---

### V-2 — Wizard 4 étapes fonctionnel (ONBO-01, ONBO-04)

```bash
# TypeScript compile sans erreur
cd /Users/laurentmarx/Documents/Dashboard/NXT-perf
npx tsc --noEmit --skipLibCheck 2>&1 | grep -v "^$" | wc -l
# Attendu : 0 (ou identique au baseline avant la phase)
```

```bash
# Vérifier que les 4 étapes existent et exportent le bon composant
grep -l "export function Step" \
  src/components/onboarding/conseiller-registration-wizard/steps/*.tsx
# Attendu : 4 fichiers
```

```bash
# Vérifier l'indicateur de progression
grep -n "Étape.*sur 4" \
  src/components/onboarding/conseiller-registration-wizard/WizardProgressIndicator.tsx
# Attendu : au moins 1 résultat
```

Vérifie que :
- L'étape 1 affiche "Quel est votre rôle ?" et le bouton "Je suis agent immobilier"
- L'étape 2 affiche les options "Rejoindre" / "Créer mon agence"
- L'étape 3 affiche les champs email, password, prénom, nom + conditionnel (inviteCode ou agencyName)
- L'étape 4 permet de soumettre et redirige vers `/onboarding/identite`
- Chaque étape affiche "Étape N sur 4" + 4 points

---

### V-3 — Bouton Retour à chaque étape (ONBO-04)

```bash
# Vérifier que goBack est utilisé dans chaque step
grep -rn "goBack\|router.push.*login" \
  src/components/onboarding/conseiller-registration-wizard/steps/
# Attendu : au moins 4 occurrences (une par step)
```

```bash
# Test E2E du bouton retour
npx playwright test e2e/register-non-conseiller.spec.ts \
  --grep "Retour" --reporter=line
# Attendu : 0 failed
```

Vérifie que :
- Étape 1 → "Retour" redirige vers `/login`
- Étape 2 → "Retour" retourne à l'étape 1
- Étape 3 → "Retour" retourne à l'étape 2
- Étape 4 → "Retour" retourne à l'étape 3

---

### V-4 — Flows non-conseiller inchangés (ONBO-02)

```bash
# Vérifier que register/page.tsx n'a que des additions (≤5 lignes)
cd /Users/laurentmarx/Documents/Dashboard/NXT-perf
git diff --stat src/app/\(auth\)/register/page.tsx
# Attendu : "1 file changed, N insertions(+), 0 deletions(-)"
# N doit être ≤ 10 lignes (import + isConseillerWizardMode + if block)
```

```bash
# Vérifier que app-store.ts n'a pas été modifié
git diff src/stores/app-store.ts
# Attendu : aucune sortie (fichier inchangé)
```

```bash
# Vérifier que onboarding-wizard-store n'est jamais importé dans app-store.ts
grep "onboarding-wizard-store" src/stores/app-store.ts
# Attendu : aucun résultat (exit code 1)
```

---

### V-5 — Qualité TypeScript (contrainte globale)

```bash
# Pas de @ts-ignore dans le nouveau code
grep -rn "@ts-ignore" \
  src/components/onboarding/conseiller-registration-wizard/ \
  src/stores/onboarding-wizard-store.ts
# Attendu : aucun résultat

# Pas de nouvelles dépendances npm
git diff package.json package-lock.json
# Attendu : aucune sortie (fichiers inchangés)
```

---

### V-6 — Checklist finale (validation humaine)

Exécuter manuellement après les tests automatisés :

- [ ] Visiter `/register` → wizard étape 1 visible ("Quel est votre rôle ?")
- [ ] Cliquer "Je suis agent immobilier" → étape 2 visible ("Étape 2 sur 4")
- [ ] Choisir "Rejoindre une agence" → étape 3 avec champ "Code d'invitation" visible
- [ ] Bouton Retour à l'étape 3 → retour à l'étape 2
- [ ] Bouton Retour à l'étape 1 → redirection vers `/login`
- [ ] Visiter `/register?profile=MANAGER` → legacy form (pas le wizard)
- [ ] Visiter `/register?code=AG-1234` → legacy form verrouillé sur Conseiller (pas le wizard)

---

## Commande de validation complète

```bash
cd /Users/laurentmarx/Documents/Dashboard/NXT-perf

# 1. TypeScript
npx tsc --noEmit --skipLibCheck 2>&1 | grep -v "^$" | wc -l

# 2. E2E complet
npx playwright test e2e/register-non-conseiller.spec.ts --reporter=line

# 3. E2E existants toujours verts
npx playwright test e2e/accounts-roles.spec.ts e2e/onboarding-team.spec.ts --reporter=line

# 4. Intégrité register/page.tsx
git diff --stat src/app/\(auth\)/register/page.tsx
git diff src/stores/app-store.ts
```

Tous ces tests doivent passer avant de considérer la phase 07 comme complète.
