"use client";

import type { WizardStep } from "@/stores/onboarding-wizard-store";

const STEPS: WizardStep[] = ["role", "org_choice", "details", "confirmation"];
const STEP_LABELS: Record<WizardStep, string> = {
  role: "Rôle",
  org_choice: "Organisation",
  details: "Détails",
  confirmation: "Confirmation",
};

interface WizardProgressIndicatorProps {
  currentStep: WizardStep;
}

export function WizardProgressIndicator({ currentStep }: WizardProgressIndicatorProps) {
  const currentIdx = STEPS.indexOf(currentStep);
  const stepNumber = currentIdx + 1;

  return (
    <div className="mb-6 flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground">
        Étape {stepNumber} sur {STEPS.length} — {STEP_LABELS[currentStep]}
      </p>
      <div className="flex gap-2" role="progressbar" aria-valuenow={stepNumber} aria-valuemin={1} aria-valuemax={STEPS.length}>
        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`h-2 w-2 rounded-full transition-colors ${
              i < currentIdx
                ? "bg-primary"
                : i === currentIdx
                ? "bg-primary ring-2 ring-primary/30"
                : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
