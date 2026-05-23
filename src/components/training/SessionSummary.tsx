"use client";

import Link from "next/link";
import type { StepEvaluation } from "@/types/training";

interface SessionSummaryProps {
  evaluations: StepEvaluation[];
  sessionScore: number;
  onRestart: () => void;
  onExit: () => void;
}

export function SessionSummary({
  evaluations,
  sessionScore,
  onRestart,
  onExit,
}: SessionSummaryProps) {
  const getProgressColor = (score: number) => {
    if (score > 70) return "bg-green-500";
    if (score > 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProgressBarWidth = (score: number) => {
    return `${Math.min(score, 100)}%`;
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Scénario terminé !
        </h2>
        <p className="text-muted-foreground">
          Voici ton résumé de performance
        </p>
      </div>

      {/* Overall score */}
      <div className="rounded-lg bg-agency-primary/5 border border-agency-primary/20 p-6">
        <div className="text-center mb-4">
          <p className="text-5xl font-bold text-agency-primary">
            {sessionScore}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Score global sur 100
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getProgressColor(sessionScore)}`}
            style={{ width: getProgressBarWidth(sessionScore) }}
          />
        </div>

        {/* Score label */}
        <div className="text-center mt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {sessionScore > 70
              ? "Excellent travail !"
              : sessionScore > 40
              ? "Bonne performance, continue à progresser"
              : "À améliorer — relance le scénario"}
          </p>
        </div>
      </div>

      {/* Step-by-step summary */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Détail par étape
        </h3>
        <div className="space-y-2">
          {evaluations.map((evaluation, idx) => (
            <div key={evaluation.stepId} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 border border-border">
              <span className="text-sm font-medium text-foreground">
                Étape {idx + 1}: {evaluation.stepId}
              </span>
              <span className="text-sm font-bold text-agency-primary">
                {Math.round(evaluation.score / 10)} / 10
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-4">
        <button
          onClick={onRestart}
          className="px-6 py-3 rounded-lg bg-agency-primary text-white font-medium hover:bg-agency-primary/90 transition-colors"
        >
          Recommencer
        </button>
        <Link
          href="/conseiller/diagnostic"
          className="px-6 py-3 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors text-center"
        >
          Retour au diagnostic
        </Link>
      </div>
    </div>
  );
}
