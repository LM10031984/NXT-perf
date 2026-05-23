"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { StepEvaluation } from "@/types/training";

interface StepFeedbackProps {
  evaluation: StepEvaluation;
}

export function StepFeedback({ evaluation }: StepFeedbackProps) {
  return (
    <div className="space-y-6">
      {/* Transcript */}
      <div className="rounded-lg bg-muted/50 p-4 border border-border">
        <p className="text-sm text-muted-foreground italic">
          {evaluation.transcript}
        </p>
      </div>

      {/* Criteria list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Critères</h3>
        <div className="space-y-2">
          {evaluation.results.map((result) => (
            <div key={result.criteria.key} className="flex items-center gap-3">
              {result.matched ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}
              <span className={`text-sm ${result.matched ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {result.criteria.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Score */}
      <div className="rounded-lg bg-agency-primary/10 border border-agency-primary/20 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-agency-primary">
            {Math.round(evaluation.score / 10)} / 10
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {evaluation.score}% de critères correspondants
          </p>
        </div>
      </div>
    </div>
  );
}
