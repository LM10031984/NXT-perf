import { create } from "zustand";

/** Les 4 étapes du wizard conseiller (per D2 in 07-CONTEXT.md) */
export type WizardStep = "role" | "org_choice" | "details" | "confirmation";

/** Choix d'organisation à l'étape 2 */
export type OrgChoice = "join" | "create" | null;

export interface WizardFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  inviteCode: string;
  agencyName: string;
}

interface OnboardingWizardState {
  currentStep: WizardStep;
  orgChoice: OrgChoice;
  formData: WizardFormData;

  // Actions
  goToStep: (step: WizardStep) => void;
  goBack: () => void;
  setOrgChoice: (choice: OrgChoice) => void;
  updateFormData: (partial: Partial<WizardFormData>) => void;
  reset: () => void;
}

const STEP_ORDER: WizardStep[] = ["role", "org_choice", "details", "confirmation"];

const DEFAULT_FORM: WizardFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  inviteCode: "",
  agencyName: "",
};

export const useOnboardingWizardStore = create<OnboardingWizardState>((set, get) => ({
  currentStep: "role",
  orgChoice: null,
  formData: { ...DEFAULT_FORM },

  goToStep: (step) => {
    // Push to browser history so back button works (per D2)
    if (typeof window !== "undefined") {
      window.history.pushState({ wizardStep: step }, "");
    }
    set({ currentStep: step });
  },

  goBack: () => {
    const { currentStep } = get();
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) {
      const prev = STEP_ORDER[idx - 1];
      set({ currentStep: prev });
    }
    // idx === 0 → caller redirects to /login (handled in StepRole)
  },

  setOrgChoice: (choice) => set({ orgChoice: choice }),

  updateFormData: (partial) =>
    set((s) => ({ formData: { ...s.formData, ...partial } })),

  reset: () =>
    set({ currentStep: "role", orgChoice: null, formData: { ...DEFAULT_FORM } }),
}));
