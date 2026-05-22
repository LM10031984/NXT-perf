"use client";

import { useOnboardingWizardStore } from "@/stores/onboarding-wizard-store";

export function StepOrgChoice() {
  const { setOrgChoice, goToStep, goBack } = useOnboardingWizardStore();

  return (
    <div className="space-y-4">
      <h2 className="text-center text-2xl font-bold text-foreground">
        Votre agence
      </h2>
      <p className="text-center text-sm text-muted-foreground">
        Allez-vous rejoindre une agence existante ou en créer une nouvelle ?
      </p>

      <button
        type="button"
        onClick={() => {
          setOrgChoice("join");
          goToStep("details");
        }}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        data-testid="wizard-org-join-btn"
      >
        Je rejoins une agence existante
      </button>

      <button
        type="button"
        onClick={() => {
          setOrgChoice("create");
          goToStep("details");
        }}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        data-testid="wizard-org-create-btn"
      >
        Je crée mon agence
      </button>

      <button
        type="button"
        onClick={() => goBack()}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="wizard-org-back"
      >
        Retour
      </button>
    </div>
  );
}
