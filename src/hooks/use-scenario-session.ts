"use client";

import { useReducer, useEffect, useRef, useCallback } from "react";
import type { SessionState, StepPhase, StepEvaluation, TrainingScenario, TrainingStep } from "@/types/training";
import { evaluateAgentResponse, computeSessionScore } from "@/lib/scenario-engine";
import { transcribeAudio } from "@/lib/transcription";

/**
 * Session reducer actions
 */
type SessionAction =
  | { type: "START" }
  | { type: "TTS_DONE" }
  | { type: "RECORDING_DONE"; blob: Blob }
  | { type: "EVALUATION_DONE"; evaluation: StepEvaluation }
  | { type: "NEXT_STEP" }
  | { type: "SET_ERROR"; message: string }
  | { type: "RESET" };

/**
 * Reducer function for session state
 */
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        phase: "coach-speaking",
      };

    case "TTS_DONE":
      return {
        ...state,
        phase: "user-turn",
      };

    case "RECORDING_DONE":
      return {
        ...state,
        audioBlob: action.blob,
        phase: "evaluating",
      };

    case "EVALUATION_DONE":
      return {
        ...state,
        evaluations: [...state.evaluations, action.evaluation],
        phase: "feedback",
      };

    case "NEXT_STEP": {
      const nextIndex = state.currentStepIndex + 1;
      const isLastStep = nextIndex >= state.scenario.steps.length;
      return {
        ...state,
        currentStepIndex: nextIndex,
        phase: isLastStep ? "done" : "coach-speaking",
        audioBlob: null,
        error: null,
      };
    }

    case "SET_ERROR":
      return {
        ...state,
        error: action.message,
      };

    case "RESET":
      return {
        ...state,
        currentStepIndex: 0,
        phase: "coach-speaking",
        evaluations: [],
        audioBlob: null,
        error: null,
      };

    default:
      return state;
  }
}

/**
 * Hook to manage training scenario session
 *
 * Orchestrates:
 * - TTS playback for coach lines
 * - Audio recording for agent responses
 * - Transcription via /api/vocal
 * - Evaluation via evaluateAgentResponse
 * - Session state via useReducer
 */
export function useScenarioSession(scenario: TrainingScenario) {
  const initialState: SessionState = {
    scenario,
    currentStepIndex: 0,
    phase: "coach-speaking",
    evaluations: [],
    audioBlob: null,
    error: null,
  };

  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentStep = state.scenario.steps[state.currentStepIndex];
  const sessionScore = computeSessionScore(state.evaluations);

  /**
   * Play coach line via TTS
   */
  const playCoachLine = useCallback(async (text: string) => {
    if (typeof window === "undefined") return;

    try {
      const response = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          persona: state.scenario.personaId,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      // When audio finishes, move to user-turn
      audio.addEventListener("ended", () => {
        dispatch({ type: "TTS_DONE" });
      });

      audio.play().catch((err) => {
        dispatch({ type: "SET_ERROR", message: `Audio playback failed: ${err.message}` });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "TTS failed";
      dispatch({ type: "SET_ERROR", message });
    }
  }, [state.scenario.personaId]);

  /**
   * Run evaluation on current audio blob
   */
  const runEvaluation = useCallback(async () => {
    if (!state.audioBlob || !currentStep.expectedAgentResponse) {
      dispatch({ type: "SET_ERROR", message: "No audio blob or expected response criteria" });
      return;
    }

    try {
      const result = await transcribeAudio(state.audioBlob, state.scenario.id, { timeoutMs: 15_000 });

      if (!result.ok) {
        dispatch({ type: "SET_ERROR", message: `Transcription failed: ${result.error}` });
        return;
      }

      const evalResult = evaluateAgentResponse(result.text, currentStep.expectedAgentResponse.criteria);

      const evaluation: StepEvaluation = {
        stepId: currentStep.id,
        transcript: result.text,
        latencyMs: result.latencyMs,
        results: evalResult.results,
        score: evalResult.score,
      };

      dispatch({ type: "EVALUATION_DONE", evaluation });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Evaluation failed";
      dispatch({ type: "SET_ERROR", message });
    }
  }, [state.audioBlob, state.scenario.id, currentStep]);

  /**
   * Effect: handle coach-speaking phase — play TTS
   */
  useEffect(() => {
    if (state.phase !== "coach-speaking" || !currentStep) {
      return;
    }

    // If step has no expected response, skip to next step immediately
    if (currentStep.expectedAgentResponse === null) {
      dispatch({ type: "TTS_DONE" });
      return;
    }

    playCoachLine(currentStep.coachLine);

    // Cleanup: stop audio if component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [state.phase, currentStep, playCoachLine]);

  /**
   * Effect: handle evaluating phase — transcribe and evaluate
   */
  useEffect(() => {
    if (state.phase !== "evaluating") {
      return;
    }

    runEvaluation();
  }, [state.phase, runEvaluation]);

  /**
   * Public actions exposed to UI
   */
  const actions = {
    start: () => dispatch({ type: "START" }),
    next: () => dispatch({ type: "NEXT_STEP" }),
    recordingDone: (blob: Blob) => dispatch({ type: "RECORDING_DONE", blob }),
    setError: (message: string) => dispatch({ type: "SET_ERROR", message }),
    reset: () => dispatch({ type: "RESET" }),
  };

  return {
    state,
    currentStep,
    sessionScore,
    dispatch,
    actions,
    isLastStep: state.currentStepIndex === state.scenario.steps.length - 1,
    canProceed: state.phase === "feedback" || (state.phase === "coach-speaking" && currentStep?.expectedAgentResponse === null),
  };
}
