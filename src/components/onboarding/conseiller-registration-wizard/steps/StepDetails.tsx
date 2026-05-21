"use client";

import { useOnboardingWizardStore } from "@/stores/onboarding-wizard-store";

export function StepDetails() {
  const { formData, updateFormData, orgChoice, goToStep, goBack } = useOnboardingWizardStore();

  return (
    <div className="space-y-4">
      <h2 className="text-center text-xl font-bold text-foreground">
        Vos informations
      </h2>
      {/* TODO (plan 02): implement full form — firstName, lastName, email, password, inviteCode or agencyName */}
      <p className="text-center text-xs text-muted-foreground">
        {orgChoice === "join" ? "Saisissez votre code d'invitation" : "Nommez votre agence"}
      </p>
      <button
        type="button"
        onClick={() => goToStep("confirmation")}
        className="h-10 w-full rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        data-testid="wizard-details-next-btn"
      >
        Continuer
      </button>
      <button type="button" onClick={goBack} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
        Retour
      </button>
    </div>
  );
}
