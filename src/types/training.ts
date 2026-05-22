import type { SituationType, ElevenLabsPersona } from "@/lib/constants";
import type { PersonaId } from "@/lib/personas";

/** Critère d'évaluation d'une réponse agent */
export interface EvaluationCriteria {
  key: string;          // identifiant machine ex: "self-intro"
  label: string;        // libellé affiché ex: "Présentation personnelle"
  keywords: string[];   // mots-clés à chercher dans le transcript (insensible à la casse)
}

/** Une étape de scénario */
export interface TrainingStep {
  id: string;
  coachLine: string;                          // texte que le coach lit (TTS)
  expectedAgentResponse: {
    criteria: EvaluationCriteria[];
    minDurationSec: number;
  } | null;                                   // null = fin de scénario (pas de micro attendu)
}

/** Scénario complet */
export interface TrainingScenario {
  id: SituationType;
  title: string;
  description: string;
  persona: ElevenLabsPersona;                 // utilisé pour mapper la voix TTS
  personaId: PersonaId;                       // PersonaId résolu pour /api/voice/tts
  steps: TrainingStep[];
}

/** État d'une étape pendant l'exécution */
export type StepPhase =
  | "coach-speaking"    // TTS en lecture
  | "user-turn"         // micro actif, agent parle
  | "evaluating"        // transcription + évaluation en cours
  | "feedback"          // résultat affiché, attente "Étape suivante"
  | "done";             // fin de scénario

export interface StepEvaluation {
  stepId: string;
  transcript: string;
  latencyMs: number;
  results: Array<{ criteria: EvaluationCriteria; matched: boolean }>;
  score: number;        // 0–100, % de critères matchés
}

/** État de session (géré localement dans useReducer) */
export interface SessionState {
  scenario: TrainingScenario;
  currentStepIndex: number;
  phase: StepPhase;
  evaluations: StepEvaluation[];
  audioBlob: Blob | null;    // enregistrement courant
  error: string | null;
}
