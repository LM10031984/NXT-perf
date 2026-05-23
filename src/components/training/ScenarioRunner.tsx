"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Loader2, AlertCircle } from "lucide-react";
import type { TrainingScenario } from "@/types/training";
import { useScenarioSession } from "@/hooks/use-scenario-session";
import { StepFeedback } from "./StepFeedback";
import { SessionSummary } from "./SessionSummary";

interface ScenarioRunnerProps {
  scenario: TrainingScenario;
}

export function ScenarioRunner({ scenario }: ScenarioRunnerProps) {
  const { state, currentStep, sessionScore, actions, isLastStep } = useScenarioSession(scenario);
  const [hasStarted, setHasStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect for recording
  useEffect(() => {
    if (!isRecording) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 59) {
          // Auto-stop at 60 seconds
          stopRecording();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        actions.recordingDone(blob);
        cleanupStream();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Micro non disponible";
      actions.setError(`Erreur micro: ${message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Count interactive steps only (exclude wrap steps with no expectedAgentResponse)
  const interactiveSteps = scenario.steps.filter((s) => s.expectedAgentResponse !== null);
  const currentInteractiveIndex = interactiveSteps.findIndex((s) => s.id === currentStep?.id);
  const stepProgress = `Étape ${Math.max(currentInteractiveIndex + 1, 1)} / ${interactiveSteps.length}`;

  // Hero section (initial state)
  if (!hasStarted && state.phase === "coach-speaking") {
    return (
      <div className="space-y-8">
        {/* Scenario title & persona */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            {scenario.title}
          </h2>
          <p className="text-muted-foreground">
            {scenario.description}
          </p>
        </div>

        {/* Start button */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              setHasStarted(true);
              actions.start();
            }}
            className="px-8 py-3 rounded-lg bg-agency-primary text-white font-semibold hover:bg-agency-primary/90 transition-colors"
          >
            Commencer
          </button>
        </div>
      </div>
    );
  }

  // Main flow (after start)
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="text-center text-sm text-muted-foreground">
        {stepProgress}
      </div>

      {/* Error state */}
      {state.error && (
        <div className="flex gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">{state.error}</p>
            <button
              onClick={() => actions.reset()}
              className="text-xs text-red-600 hover:text-red-700 underline mt-2"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Coach speaking phase */}
      {state.phase === "coach-speaking" && currentStep && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center h-20 w-20">
              <div className="absolute h-20 w-20 rounded-full bg-agency-primary/20 animate-pulse" />
              <div className="relative text-3xl">🎤</div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Le coach parle...
            </p>
            <p className="text-sm text-foreground italic">
              {currentStep.coachLine}
            </p>
          </div>
        </div>
      )}

      {/* User recording phase */}
      {state.phase === "user-turn" && currentStep && (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-20 w-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
                    : "bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500"
                }`}
              >
                <Mic className={`h-8 w-8 ${isRecording ? "text-white" : "text-red-500"}`} />
              </button>
              {isRecording && (
                <div className="absolute inset-0 animate-pulse rounded-full border-2 border-red-500" />
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {isRecording ? "Parle maintenant..." : "Clique pour commencer à parler"}
            </p>

            {isRecording && (
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{recordingTime}s</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique sur le micro pour terminer
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evaluating phase */}
      {state.phase === "evaluating" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-agency-primary" />
          <p className="text-sm text-muted-foreground">
            Transcription en cours...
          </p>
        </div>
      )}

      {/* Feedback phase */}
      {state.phase === "feedback" && state.evaluations.length > 0 && (
        <div className="space-y-6">
          <StepFeedback evaluation={state.evaluations[state.evaluations.length - 1]} />

          {!isLastStep && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => actions.next()}
                className="px-6 py-3 rounded-lg bg-agency-primary text-white font-semibold hover:bg-agency-primary/90 transition-colors"
              >
                Étape suivante
              </button>
            </div>
          )}

          {isLastStep && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => actions.next()}
                className="px-6 py-3 rounded-lg bg-agency-primary text-white font-semibold hover:bg-agency-primary/90 transition-colors"
              >
                Voir mon résumé
              </button>
            </div>
          )}
        </div>
      )}

      {/* Done phase */}
      {state.phase === "done" && (
        <SessionSummary
          evaluations={state.evaluations}
          sessionScore={sessionScore}
          onRestart={() => {
            setHasStarted(false);
            actions.reset();
          }}
          onExit={() => {
            setHasStarted(false);
            actions.reset();
          }}
        />
      )}
    </div>
  );
}
