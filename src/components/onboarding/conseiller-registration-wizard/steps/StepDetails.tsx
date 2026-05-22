"use client";

import { useState, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useOnboardingWizardStore } from "@/stores/onboarding-wizard-store";
import { createClient } from "@/lib/supabase/client";

export function StepDetails() {
  const { formData, updateFormData, orgChoice, goToStep, goBack } =
    useOnboardingWizardStore();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [inviteCodeStatus, setInviteCodeStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [validatedOrgName, setValidatedOrgName] = useState("");

  const validateInviteCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setInviteCodeStatus("idle");
      setValidatedOrgName("");
      return;
    }
    setInviteCodeStatus("checking");
    const supabase = createClient();
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("invite_code", trimmed)
      .single();
    if (!orgErr && org) {
      setInviteCodeStatus("valid");
      setValidatedOrgName(org.name);
    } else {
      setInviteCodeStatus("invalid");
      setValidatedOrgName("");
    }
  }, []);

  const handleContinue = async () => {
    setError("");
    const missing: string[] = [];

    if (!formData.firstName.trim()) missing.push("Prénom");
    if (!formData.lastName.trim()) missing.push("Nom");
    if (!formData.email.trim()) missing.push("Email");
    if (!formData.password.trim()) missing.push("Mot de passe");

    if (orgChoice === "join" && !formData.inviteCode.trim()) {
      missing.push("Code d'invitation");
    }
    if (orgChoice === "create" && !formData.agencyName.trim()) {
      missing.push("Nom de l'agence");
    }

    if (missing.length > 0) {
      setError(`Champ(s) manquant(s) : ${missing.join(", ")}`);
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    // If join mode, validate invite code
    if (orgChoice === "join") {
      if (inviteCodeStatus === "invalid") {
        setError("Code d'invitation invalide. Vérifiez avec votre manager.");
        return;
      }
      if (inviteCodeStatus !== "valid") {
        const supabase = createClient();
        const { data: org, error: orgErr2 } = await supabase
          .from("organizations")
          .select("id")
          .eq("invite_code", formData.inviteCode.trim())
          .single();

        if (orgErr2 || !org) {
          setError("Code d'invitation invalide. Vérifiez avec votre manager.");
          return;
        }
      }
    }

    // All validations passed
    goToStep("confirmation");
  };

  const inputClassName =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      <h2 className="text-center text-2xl font-bold text-foreground">
        Vos informations
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Prénom
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            className={inputClassName}
            placeholder="Votre prénom"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Nom
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            className={inputClassName}
            placeholder="Votre nom"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          className={inputClassName}
          placeholder="vous@exemple.fr"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => updateFormData({ password: e.target.value })}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            placeholder="Minimum 6 caractères"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {orgChoice === "join" ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Code d'invitation
          </label>
          <input
            type="text"
            value={formData.inviteCode}
            onChange={(e) => {
              updateFormData({ inviteCode: e.target.value });
              setInviteCodeStatus("idle");
              setValidatedOrgName("");
            }}
            onBlur={() => validateInviteCode(formData.inviteCode)}
            className={inputClassName}
            placeholder="Ex: AG-1234"
          />
          <InviteCodeFeedback
            status={inviteCodeStatus}
            orgName={validatedOrgName}
          />
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Nom de votre agence
          </label>
          <input
            type="text"
            value={formData.agencyName}
            onChange={(e) => updateFormData({ agencyName: e.target.value })}
            className={inputClassName}
            placeholder="Ex: Start Academy, Mon Agence"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Un code d'invitation sera généré automatiquement
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        className="h-10 w-full rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        data-testid="wizard-details-next-btn"
      >
        Continuer
      </button>

      <button
        type="button"
        onClick={() => goBack()}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="wizard-details-back"
      >
        Retour
      </button>
    </div>
  );
}

function InviteCodeFeedback({
  status,
  orgName,
}: {
  status: "idle" | "checking" | "valid" | "invalid";
  orgName: string;
}) {
  if (status === "idle") return null;

  if (status === "checking") {
    return (
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Vérification...
      </p>
    );
  }

  if (status === "valid") {
    return (
      <p className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        Code valide — Agence : {orgName}
      </p>
    );
  }

  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive">
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Code invalide
    </p>
  );
}
