"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingWizardStore } from "@/stores/onboarding-wizard-store";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/app-store";
import type { DbProfile } from "@/types/database";

export function StepConfirmation() {
  const { formData, orgChoice, goBack } = useOnboardingWizardStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    const supabase = createClient();

    // Validate invite code if joining
    if (orgChoice === "join") {
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .select("id")
        .eq("invite_code", formData.inviteCode.trim())
        .single();

      if (orgErr || !org) {
        setError("Code d'invitation invalide. Vérifiez avec votre manager.");
        setLoading(false);
        return;
      }
    }

    // Compute context_mode
    const contextMode: "invite" | "personal" = formData.inviteCode.trim()
      ? "invite"
      : "personal";

    // Sign up with metadata (trigger will create profile + org if needed)
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          main_role: "conseiller",
          selected_roles: ["conseiller"],
          category: "confirme",
          context_mode: contextMode,
          invite_code: formData.inviteCode.trim() || null,
          org_name: formData.agencyName.trim() || null,
        },
      },
    });

    setLoading(false);

    if (authError) {
      if (authError.message.includes("already registered")) {
        setError("Cet email est déjà utilisé.");
      } else {
        setError(authError.message);
      }
      return;
    }

    // Supabase returns a user with empty identities if email already exists
    if (signUpData.user && signUpData.user.identities?.length === 0) {
      setError("Un compte avec cet email existe déjà.");
      return;
    }

    if (!signUpData.session || !signUpData.user) {
      setError("Compte créé mais session non établie. Essayez de vous connecter.");
      router.push("/login");
      return;
    }

    // Pre-load profile in store so dashboard layout skips the async fetch
    const optimisticProfile: DbProfile = {
      id: signUpData.user.id,
      org_id: "",
      team_id: null,
      email: formData.email.trim(),
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      role: "conseiller",
      available_roles: ["conseiller"],
      category: "confirme",
      avatar_url: null,
      onboarding_status: "DONE",
      profile_type: "AGENT",
      sub_profile: null,
      agent_status: null,
      coach_code: null,
      onboarding_completed: false,
      last_voice_saisie_date: null,
      agency_logo_url: null,
      agency_primary_color: null,
      agency_secondary_color: null,
      coach_voice: "bienveillant",
      created_at: new Date().toISOString(),
    };
    useAppStore.getState().setProfile(optimisticProfile);

    // Create trial subscription (30 days free)
    await supabase.from("subscriptions").upsert(
      {
        user_id: signUpData.user.id,
        plan: "trial",
        status: "active",
        trial_ends_at: new Date(
          Date.now() + 30 * 24 * 60 * 60_000
        ).toISOString(),
      },
      { onConflict: "user_id" }
    );

    // Clear any leftover demo cookies
    document.cookie = "nxt-demo-mode=;path=/;max-age=0";
    document.cookie = "nxt-demo-onboarding=;path=/;max-age=0";
    document.cookie = "nxt-demo-saisie=;path=/;max-age=0";

    // Show success state
    setSuccess(true);

    // Wait 1s for trigger to create the real profile, then redirect to onboarding
    await new Promise((r) => setTimeout(r, 1000));
    window.location.href = "/onboarding/identite";
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Compte créé avec succès !
        </h2>
        <p className="text-sm text-muted-foreground">
          Redirection vers le dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-center text-2xl font-bold text-foreground">
        Confirmation
      </h2>

      <div className="space-y-3 rounded-lg bg-muted p-4">
        <div className="text-sm">
          <p className="text-muted-foreground">Prénom</p>
          <p className="font-medium text-foreground">{formData.firstName}</p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Nom</p>
          <p className="font-medium text-foreground">{formData.lastName}</p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Email</p>
          <p className="font-medium text-foreground">{formData.email}</p>
        </div>
        {orgChoice === "join" ? (
          <div className="text-sm">
            <p className="text-muted-foreground">Code d'invitation</p>
            <p className="font-medium text-foreground">
              {formData.inviteCode}
            </p>
          </div>
        ) : (
          <div className="text-sm">
            <p className="text-muted-foreground">Nom de l'agence</p>
            <p className="font-medium text-foreground">{formData.agencyName}</p>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="h-10 w-full rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        data-testid="wizard-submit-btn"
      >
        {loading ? "Création en cours..." : "Créer mon compte"}
      </button>

      <button
        type="button"
        onClick={() => goBack()}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="wizard-confirmation-back"
      >
        Retour
      </button>
    </div>
  );
}
