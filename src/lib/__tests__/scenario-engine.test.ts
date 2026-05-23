import { describe, it, expect } from "vitest";
import { evaluateAgentResponse, computeSessionScore } from "../scenario-engine";
import type { EvaluationCriteria, StepEvaluation } from "@/types/training";

describe("evaluateAgentResponse", () => {
  it("should match all criteria when keywords are present", () => {
    const transcript = "je m'appelle Lucas, ravi de vous rencontrer";
    const criteria: EvaluationCriteria[] = [
      { key: "self-intro", label: "Présentation", keywords: ["je m'appelle", "je suis"] },
      { key: "confidence", label: "Ton assuré", keywords: ["ravi"] },
    ];

    const result = evaluateAgentResponse(transcript, criteria);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].matched).toBe(true);
    expect(result.results[1].matched).toBe(true);
    expect(result.score).toBe(100);
  });

  it("should return 0 score when no criteria are matched", () => {
    const transcript = "oui bonjour";
    const criteria: EvaluationCriteria[] = [
      { key: "self-intro", label: "Présentation", keywords: ["je m'appelle"] },
      { key: "confidence", label: "Ton assuré", keywords: ["ravi"] },
    ];

    const result = evaluateAgentResponse(transcript, criteria);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].matched).toBe(false);
    expect(result.results[1].matched).toBe(false);
    expect(result.score).toBe(0);
  });

  it("should return 50 score for partial match (1 out of 2 criteria)", () => {
    const transcript = "je m'appelle Lucas";
    const criteria: EvaluationCriteria[] = [
      { key: "self-intro", label: "Présentation", keywords: ["je m'appelle"] },
      { key: "confidence", label: "Ton assuré", keywords: ["ravi"] },
    ];

    const result = evaluateAgentResponse(transcript, criteria);
    expect(result.results[0].matched).toBe(true);
    expect(result.results[1].matched).toBe(false);
    expect(result.score).toBe(50);
  });

  it("should return 0 score for empty transcript", () => {
    const transcript = "";
    const criteria: EvaluationCriteria[] = [
      { key: "self-intro", label: "Présentation", keywords: ["je m'appelle"] },
    ];

    const result = evaluateAgentResponse(transcript, criteria);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].matched).toBe(false);
    expect(result.score).toBe(0);
  });

  it("should match keywords case-insensitively", () => {
    const transcript = "JE M'APPELLE LUCAS";
    const criteria: EvaluationCriteria[] = [
      { key: "self-intro", label: "Présentation", keywords: ["je m'appelle"] },
    ];

    const result = evaluateAgentResponse(transcript, criteria);
    expect(result.results[0].matched).toBe(true);
    expect(result.score).toBe(100);
  });
});

describe("computeSessionScore", () => {
  it("should return 0 for empty evaluations array", () => {
    const evaluations: Pick<StepEvaluation, "score">[] = [];
    const result = computeSessionScore(evaluations);
    expect(result).toBe(0);
  });

  it("should compute average score across evaluations", () => {
    const evaluations: Pick<StepEvaluation, "score">[] = [
      { score: 80 },
      { score: 60 },
    ];
    const result = computeSessionScore(evaluations);
    expect(result).toBe(70);
  });

  it("should handle single evaluation", () => {
    const evaluations: Pick<StepEvaluation, "score">[] = [
      { score: 85 },
    ];
    const result = computeSessionScore(evaluations);
    expect(result).toBe(85);
  });

  it("should round the final average", () => {
    const evaluations: Pick<StepEvaluation, "score">[] = [
      { score: 85 },
      { score: 76 },
    ];
    const result = computeSessionScore(evaluations);
    expect(result).toBe(81); // (85 + 76) / 2 = 80.5, rounded to 81
  });
});
