/**
 * scripts/benchmark-llm.ts
 *
 * Benchmark des 4 modèles OpenRouter pour le copilote NXT.
 *
 * Usage : npx tsx scripts/benchmark-llm.ts
 *
 * Modèles testés :
 *   1. anthropic/claude-haiku-4-5
 *   2. openai/gpt-4o-mini
 *   3. google/gemini-flash-1.5
 *   4. mistralai/mistral-small-latest
 *
 * Résultats écrits dans docs/llm-benchmark.md
 * (les appels LLM réels sont faits par Laurent après avoir configuré OPENROUTER_API_KEY)
 */

import * as fs from "fs";
import * as path from "path";

// --- Types ---

interface BenchmarkPrompt {
  id: string;
  label: string;
  userMessage: string;
}

interface ModelResult {
  model: string;
  promptId: string;
  firstTokenMs: number;
  totalMs: number;
  inputTokensEstimate: number;
  outputTokensEstimate: number;
  costEurEstimate: number;
  response: string;
  error?: string;
}

// --- Prompts standards (3 prompts, per D-04 de 08-CONTEXT.md) ---

export const BENCHMARK_PROMPTS: BenchmarkPrompt[] = [
  {
    id: "p1-mandats",
    label: "Ratio mandats faible",
    userMessage: "Mon ratio RDV → mandats est de 0.4, la cible c'est 2.0. Comment je m'améliore ?",
  },
  {
    id: "p2-prospection",
    label: "Plan de prospection hebdomadaire",
    userMessage: "Donne-moi un plan de prospection concret pour cette semaine. Je démarre à zéro.",
  },
  {
    id: "p3-motivation",
    label: "Agent découragé (mode soutien)",
    userMessage: "J'en ai marre, j'arrive pas à signer. Ça fait 3 semaines sans mandat.",
  },
];

// --- Modèles à benchmarker ---

export const MODELS_TO_BENCHMARK = [
  "anthropic/claude-haiku-4-5",
  "openai/gpt-4o-mini",
  "google/gemini-flash-1.5",
  "mistralai/mistral-small-latest",
] as const;

// Coûts publics approximatifs ($/M tokens) — à vérifier sur https://openrouter.ai/models
// Source : OpenRouter pricing page, consulté 2026-05-26
export const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  "anthropic/claude-haiku-4-5": { inputPer1M: 0.8, outputPer1M: 4.0 },
  "openai/gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "google/gemini-flash-1.5": { inputPer1M: 0.075, outputPer1M: 0.3 },
  "mistralai/mistral-small-latest": { inputPer1M: 0.2, outputPer1M: 0.6 },
};

// --- Fonctions principales (stubs — implémentation Plan 08-02) ---

/**
 * Appelle OpenRouter en mode streaming pour un modèle + prompt donné.
 * Mesure first-token latency et total latency.
 * @throws si OPENROUTER_API_KEY n'est pas défini
 */
export async function runSingleBenchmark(
  _model: string,
  _prompt: BenchmarkPrompt,
  _systemPrompt: string,
  _apiKey: string,
): Promise<ModelResult> {
  throw new Error("NOT_IMPLEMENTED — implémenté dans Plan 08-02");
}

/**
 * Lance tous les benchmarks (4 modèles × 3 prompts = 12 appels) et retourne les résultats.
 */
export async function runAllBenchmarks(_systemPrompt: string): Promise<ModelResult[]> {
  throw new Error("NOT_IMPLEMENTED — implémenté dans Plan 08-02");
}

/**
 * Génère docs/llm-benchmark.md depuis les résultats.
 */
export function generateBenchmarkDoc(_results: ModelResult[]): string {
  throw new Error("NOT_IMPLEMENTED — implémenté dans Plan 08-02");
}

// --- Point d'entrée CLI ---

async function main(): Promise<void> {
  console.log("NXT Performance — Benchmark LLM");
  console.log("Modèles :", MODELS_TO_BENCHMARK.join(", "));
  console.log("Prompts  :", BENCHMARK_PROMPTS.map((p) => p.id).join(", "));
  console.log("");
  console.log("ATTENTION : Ce script est un stub. Les appels LLM réels nécessitent");
  console.log("OPENROUTER_API_KEY configuré + npm run benchmark (Plan 08-02).");

  const outDir = path.join(process.cwd(), "docs");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log("\nSortie prévue : docs/llm-benchmark.md");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
