"use client";

import { useEffect } from "react";
import { useOnboardingWizardStore } from "@/stores/onboarding-wizard-store";
import { WizardProgressIndicator } from "./WizardProgressIndicator";
import { StepRole } from "./steps/StepRole";
import { StepOrgChoice } from "./steps/StepOrgChoice";
import { StepDetails } from "./steps/StepDetails";
import { StepConfirmation } from "./steps/StepConfirmation";

export function ConseillerRegistrationWizard() {
  const { currentStep, goBack, reset } = useOnboardingWizardStore();

  // Reset wizard on mount so re-visits start from step 1
  useEffect(() => {
    reset();
  }, [reset]);

  // Handle browser back button (per D2 — browser history pushState)
  useEffect(() => {
    const handlePopState = () => {
      goBack();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [goBack]);

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <div className="mb-4 flex justify-center">
        <img src="/logo-icon.svg" alt="NXT Perf" className="h-12 w-12" />
      </div>

      <WizardProgressIndicator currentStep={currentStep} />

      {currentStep === "role" && <StepRole />}
      {currentStep === "org_choice" && <StepOrgChoice />}
      {currentStep === "details" && <StepDetails />}
      {currentStep === "confirmation" && <StepConfirmation />}
    </div>
  );
}
