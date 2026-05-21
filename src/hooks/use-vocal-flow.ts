import { useState, useCallback } from "react";
import { transcribeAudio } from "@/lib/transcription";
import { SECTION_ORDER, SECTION_QUESTIONS, generateMissingClarifications, type VocalSection } from "@/lib/vocal-prompts";

interface ExtractedData {
  [key: string]: unknown;
}

/** Sous-PR Coach-12 : tip RAG optionnel injecté par /api/vocal. */
export interface VocalCoachTip {
  observation: string;
  question: string;
  mood: "positive" | "focus" | "concern";
}

export interface SectionResult {
  section: VocalSection;
  transcript: string;
  extracted: ExtractedData;
  needsClarification: Array<{ field: string; question: string }>;
  allNull: boolean;
  /** Sous-PR Coach-12 : tip Coach NXT Tedesco optionnel (null si fail). */
  coachTip?: VocalCoachTip | null;
}

export type FlowStep = "intro" | "recording" | "processing" | "review" | "confirm_null" | "clarification" | "recap" | "done" | "error";

interface VocalFlowState {
  step: FlowStep;
  currentSectionIndex: number;
  results: SectionResult[];
  errorMessage: string | null;
  settings: {
    ttsEnabled: boolean;
    realtimeFeedback: boolean;
  };
}

export function useVocalFlow() {
  const [state, setState] = useState<VocalFlowState>({
    step: "intro",
    currentSectionIndex: 0,
    results: [],
    errorMessage: null,
    settings: {
      ttsEnabled: false,
      realtimeFeedback: true,
    },
  });

  const currentSection = SECTION_ORDER[state.currentSectionIndex] ?? null;
  const currentQuestion = currentSection
    ? SECTION_QUESTIONS[currentSection]
    : null;
  const isLastSection =
    state.currentSectionIndex >= SECTION_ORDER.length - 1;

  const updateSettings = useCallback(
    (partial: Partial<VocalFlowState["settings"]>) => {
      setState((s) => ({
        ...s,
        settings: { ...s.settings, ...partial },
      }));
    },
    []
  );

  const startFlow = useCallback(() => {
    setState((s) => ({ ...s, step: "recording", currentSectionIndex: 0, results: [] }));
  }, []);

  const setProcessing = useCallback(() => {
    setState((s) => ({ ...s, step: "processing" }));
  }, []);

  const updateLastResult = useCallback(
    (updatedResult: SectionResult) => {
      setState((s) => {
        const newResults = [...s.results];
        newResults[newResults.length - 1] = updatedResult;
        return { ...s, results: newResults };
      });
    },
    []
  );

  const submitSectionResult = useCallback(
    (result: SectionResult) => {
      // Normaliser needs_clarification
      const clarifications = Array.isArray(result.needsClarification)
        ? result.needsClarification.filter(
            (nc) => nc && typeof nc.field === "string" && typeof nc.question === "string"
          )
        : [];
      const normalizedResult = { ...result, needsClarification: clarifications };

      console.log("[vocal] submitSectionResult:", normalizedResult.section, {
        allNull: normalizedResult.allNull,
        needsClarification: normalizedResult.needsClarification,
        extractedKeys: Object.keys(normalizedResult.extracted),
      });

      setState((s) => {
        const newResults = [...s.results, normalizedResult];

        // Si "rien" → demander confirmation
        if (normalizedResult.allNull) {
          return { ...s, results: newResults, step: "confirm_null" as const };
        }

        // Si relance nécessaire → afficher les questions de clarification
        if (normalizedResult.needsClarification.length > 0) {
          return { ...s, results: newResults, step: "clarification" as const };
        }

        // Si feedback temps réel → afficher le review
        if (s.settings.realtimeFeedback) {
          return { ...s, results: newResults, step: "review" as const };
        }

        // Sinon → passer à la section suivante ou au récap
        if (s.currentSectionIndex >= SECTION_ORDER.length - 1) {
          return { ...s, results: newResults, step: "recap" as const };
        }

        return {
          ...s,
          results: newResults,
          currentSectionIndex: s.currentSectionIndex + 1,
          step: "recording" as const,
        };
      });
    },
    []
  );

  const nextSection = useCallback(() => {
    setState((s) => {
      if (s.currentSectionIndex >= SECTION_ORDER.length - 1) {
        return { ...s, step: "recap" as const };
      }
      return {
        ...s,
        currentSectionIndex: s.currentSectionIndex + 1,
        step: "recording" as const,
      };
    });
  }, []);

  const confirmAll = useCallback(() => {
    setState((s) => ({ ...s, step: "done" as const }));
  }, []);

  const setError = useCallback((message: string) => {
    setState((s) => ({ ...s, step: "error", errorMessage: message }));
  }, []);

  const dismissError = useCallback(() => {
    setState((s) => ({
      ...s,
      step: "recording",
      errorMessage: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      step: "intro",
      currentSectionIndex: 0,
      results: [],
      errorMessage: null,
      settings: { ttsEnabled: false, realtimeFeedback: true },
    });
  }, []);

  // Appel API vocal via transcribeAudio wrapper with typed Result + retry + timeout
  const processAudio = useCallback(
    async (audioBlob: Blob): Promise<SectionResult> => {
      if (!currentSection) throw new Error("No current section");

      // Validate audio blob (BUG-008 fix)
      if (audioBlob.size === 0) {
        throw new Error("Recording was empty — please try again");
      }

      const result = await transcribeAudio(audioBlob, currentSection, { timeoutMs: 10_000 });

      if (!result.ok) {
        // Map error types to user-visible messages
        const errorMap: Record<string, string> = {
          "rate-limited": "Trop de requêtes — réessayez dans quelques secondes",
          "timeout": "La transcription a pris trop de temps — réessayez",
          "audio-invalid": "Audio invalide ou vide — réenregistrez",
          "unknown": "Erreur de transcription",
        };
        throw new Error(errorMap[result.error] || `Erreur : ${result.error}`);
      }

      const data = result.raw as Record<string, unknown>;
      const extracted = data.extracted as ExtractedData;
      const section = data.section as VocalSection;

      // Merge LLM clarifications + auto-generated missing clarifications
      const llmClarifications: Array<{ field: string; question: string }> =
        ((extracted as Record<string, unknown>)?.needs_clarification as Array<{ field: string; question: string }>) ?? [];
      const autoClarifications = generateMissingClarifications(section, extracted);
      const allClarifications = [...llmClarifications, ...autoClarifications];

      // Deduplicate by field
      const seen = new Set<string>();
      const uniqueClarifications = allClarifications.filter((c) => {
        if (seen.has(c.field)) return false;
        seen.add(c.field);
        return true;
      });

      return {
        section,
        transcript: data.transcript as string,
        extracted,
        needsClarification: uniqueClarifications,
        allNull: ((extracted as Record<string, unknown>)?.all_null as boolean) ?? false,
        // Sous-PR Coach-12 : tip Coach NXT Tedesco optionnel (null si fail).
        coachTip: (data.coachTip as VocalCoachTip) ?? null,
      };
    },
    [currentSection]
  );

  return {
    state,
    currentSection,
    currentQuestion,
    isLastSection,
    updateSettings,
    startFlow,
    setProcessing,
    submitSectionResult,
    updateLastResult,
    nextSection,
    confirmAll,
    reset,
    setError,
    dismissError,
    processAudio,
  };
}
