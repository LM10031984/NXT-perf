"use client";

import { useRouter } from "next/navigation";
import { useOnboardingWizardStore } from "@/stores/onboarding-wizard-store";

export function StepConfirmation() {
  const { goBack } = useOnboardingWizardStore();
  const router = useRouter();

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-bold text-foreground">Confirmation</h2>
      {/* TODO (plan 02): implement submit + success state */}
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="h-10 w-full rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        data-testid="wizard-confirmation-dashboard-btn"
      >
        Voir le dashboard
      </button>
      <button type="button" onClick={goBack} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
        Retour
      </button>
    </div>
  );
}
