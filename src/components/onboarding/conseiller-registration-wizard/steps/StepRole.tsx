"use client";

import { useRouter } from "next/navigation";
import { useOnboardingWizardStore } from "@/stores/onboarding-wizard-store";

export function StepRole() {
  const { goToStep } = useOnboardingWizardStore();
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h1 className="text-center text-2xl font-bold text-foreground">
        Quel est votre rôle ?
      </h1>
      <p className="text-center text-sm text-muted-foreground">
        {/* TODO (plan 02): implement role selection — single conseiller path + redirect for other roles */}
      </p>
      <button
        type="button"
        onClick={() => goToStep("org_choice")}
        className="h-10 w-full rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        data-testid="wizard-role-agent-btn"
      >
        Je suis agent immobilier
      </button>
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Retour
      </button>
    </div>
  );
}
