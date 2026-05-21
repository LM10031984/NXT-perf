"use client";

import { useOnboardingWizardStore } from "@/stores/onboarding-wizard-store";

export function StepOrgChoice() {
  const { orgChoice, setOrgChoice, goToStep, goBack } = useOnboardingWizardStore();

  return (
    <div className="space-y-4">
      <h2 className="text-center text-xl font-bold text-foreground">
        Votre agence
      </h2>
      {/* TODO (plan 02): implement join vs create choice */}
      <button
        type="button"
        onClick={() => { setOrgChoice("join"); goToStep("details"); }}
        className="h-10 w-full rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted"
        data-testid="wizard-org-join-btn"
      >
        Rejoindre une agence existante
      </button>
      <button
        type="button"
        onClick={() => { setOrgChoice("create"); goToStep("details"); }}
        className="h-10 w-full rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted"
        data-testid="wizard-org-create-btn"
      >
        Créer mon agence
      </button>
      <button type="button" onClick={goBack} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
        Retour
      </button>
    </div>
  );
}
