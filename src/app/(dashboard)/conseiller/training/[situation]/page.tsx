"use client";

import Link from "next/link";
import { type SituationType, SITUATION_PERSONA_MAP } from "@/lib/constants";
import { mandatsScenario } from "@/data/training-scenarios/mandats";

const VALID_SITUATIONS: SituationType[] = [
  "mandats",
  "estimation",
  "objections-acheteur",
  "negociation-honoraires",
  "follow-up",
];

const STUB_SITUATIONS: SituationType[] = [
  "estimation",
  "objections-acheteur",
  "negociation-honoraires",
  "follow-up",
];

interface TrainingPageProps {
  params: { situation: string };
}

export default function TrainingPage({ params }: TrainingPageProps) {
  const situation = params.situation as SituationType;

  if (!VALID_SITUATIONS.includes(situation)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Scénario introuvable.</p>
        <Link href="/conseiller/diagnostic" className="text-sm text-agency-primary underline">
          Retour au diagnostic
        </Link>
      </div>
    );
  }

  if (STUB_SITUATIONS.includes(situation)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg font-semibold">Ce scénario arrive bientôt</p>
        <p className="text-muted-foreground text-sm">En cours de développement pour une prochaine version.</p>
        <Link href="/conseiller/training/mandats" className="text-sm text-agency-primary underline">
          Essayer le scénario Mandats
        </Link>
      </div>
    );
  }

  // situation === "mandats"
  const scenario = mandatsScenario;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{scenario.title}</h1>
      <p className="text-muted-foreground mb-6">{scenario.description}</p>
      {/* ScenarioRunner monté en plan 06-02 */}
      <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Moteur de scénario en cours de construction — plan 06-01
      </div>
    </div>
  );
}
