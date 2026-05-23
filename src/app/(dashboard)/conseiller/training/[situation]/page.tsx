"use client";

import Link from "next/link";
import { type SituationType } from "@/lib/constants";
import { mandatsScenario } from "@/data/training-scenarios/mandats";
import { ScenarioRunner } from "@/components/training/ScenarioRunner";

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
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/conseiller/diagnostic" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour
        </Link>
      </div>
      <ScenarioRunner scenario={mandatsScenario} />
    </div>
  );
}
