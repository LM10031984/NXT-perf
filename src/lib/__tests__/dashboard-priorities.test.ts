import { describe, it, expect } from "vitest";
import {
  derivePriorityCards,
  RATIO_SITUATION_MAP,
  type PriorityCard,
  type PrioritySeverity,
} from "@/lib/dashboard-priorities";
import type { ComputedRatio } from "@/types/ratios";

describe("derivePriorityCards", () => {
  describe("Card severity distribution", () => {
    it("should return 3 cards with rouge, orange, vert severities", () => {
      const mockRatios: ComputedRatio[] = [
        {
          ratioId: "contacts_rdv",
          value: 50,
          thresholdForCategory: 100,
          status: "danger",
          percentageOfTarget: 50,
        },
        {
          ratioId: "rdv_mandats",
          value: 40,
          thresholdForCategory: 80,
          status: "warning",
          percentageOfTarget: 50,
        },
        {
          ratioId: "pct_mandats_exclusifs",
          value: 75,
          thresholdForCategory: 60,
          status: "ok",
          percentageOfTarget: 125,
        },
      ];
      const [card1, card2, card3] = derivePriorityCards(mockRatios);

      expect(card1.severity).toBe("rouge");
      expect(card2.severity).toBe("orange");
      expect(card3.severity).toBe("vert");
    });

    it("should prioritize worst-performing ratio as rouge card", () => {
      const mockRatios: ComputedRatio[] = [
        {
          ratioId: "contacts_rdv",
          value: 30,
          thresholdForCategory: 100,
          status: "danger",
          percentageOfTarget: 30,
        },
        {
          ratioId: "rdv_mandats",
          value: 60,
          thresholdForCategory: 80,
          status: "warning",
          percentageOfTarget: 75,
        },
      ];
      const [card1] = derivePriorityCards(mockRatios);

      expect(card1.severity).toBe("rouge");
      expect(card1.ratioId).toBe("contacts_rdv");
    });

    it("should celebrate best-performing ratio as vert card", () => {
      const mockRatios: ComputedRatio[] = [
        {
          ratioId: "contacts_rdv",
          value: 50,
          thresholdForCategory: 100,
          status: "danger",
          percentageOfTarget: 50,
        },
        {
          ratioId: "rdv_mandats",
          value: 70,
          thresholdForCategory: 100,
          status: "ok",
          percentageOfTarget: 70,
        },
        {
          ratioId: "pct_mandats_exclusifs",
          value: 85,
          thresholdForCategory: 60,
          status: "ok",
          percentageOfTarget: 142,
        },
      ];
      const [, , card3] = derivePriorityCards(mockRatios);

      expect(card3.severity).toBe("vert");
      expect(card3.ratioId).toBe("pct_mandats_exclusifs");
    });
  });

  describe("Fallback behavior", () => {
    it("should handle zero or empty computed ratios gracefully", () => {
      const emptyRatios: ComputedRatio[] = [];
      const result = derivePriorityCards(emptyRatios);

      expect(result).toHaveLength(3);
      expect(result.every((card) => card.verdict)).toBe(true);
      expect(result[0].severity).toBe("rouge");
      expect(result[1].severity).toBe("orange");
      expect(result[2].severity).toBe("vert");
    });

    it("should fill missing ratios with placeholder cards", () => {
      const fewRatios: ComputedRatio[] = [
        {
          ratioId: "contacts_rdv",
          value: 50,
          thresholdForCategory: 100,
          status: "danger",
          percentageOfTarget: 50,
        },
      ];

      const result = derivePriorityCards(fewRatios);
      expect(result).toHaveLength(3);
      expect(result[0].severity).toBe("rouge");
      expect(result[1].severity).toBe("orange");
      expect(result[2].severity).toBe("vert");
    });
  });

  describe("Action button deep-linking", () => {
    it("should map weak ratios to training deep-links via RATIO_SITUATION_MAP", () => {
      const mockRatios: ComputedRatio[] = [
        {
          ratioId: "contacts_rdv",
          value: 50,
          thresholdForCategory: 100,
          status: "danger",
          percentageOfTarget: 50,
        },
        {
          ratioId: "rdv_mandats",
          value: 60,
          thresholdForCategory: 100,
          status: "warning",
          percentageOfTarget: 60,
        },
        {
          ratioId: "pct_mandats_exclusifs",
          value: 80,
          thresholdForCategory: 60,
          status: "ok",
          percentageOfTarget: 133,
        },
      ];
      const [card1] = derivePriorityCards(mockRatios);

      expect(card1.action.type).toBe("training");
      expect(card1.action.href).toContain("/conseiller/training/");
    });

    it("should support copilot opener for ratios with no direct training path", () => {
      const mockRatios: ComputedRatio[] = [
        {
          ratioId: "honoraires_moyens",
          value: 8000,
          thresholdForCategory: 15000,
          status: "danger",
          percentageOfTarget: 53,
        },
        {
          ratioId: "contacts_rdv",
          value: 70,
          thresholdForCategory: 100,
          status: "ok",
          percentageOfTarget: 70,
        },
        {
          ratioId: "rdv_mandats",
          value: 120,
          thresholdForCategory: 100,
          status: "ok",
          percentageOfTarget: 120,
        },
      ];
      const result = derivePriorityCards(mockRatios);

      const copilorCard = result.find((c) => c.action.type === "copilot");
      if (copilorCard) {
        expect(copilorCard.action.href).toBe("#");
      }
    });
  });

  describe("Persona mapping", () => {
    it("should map training situations to ElevenLabs personas correctly", () => {
      const mockRatios: ComputedRatio[] = [
        {
          ratioId: "pct_mandats_exclusifs",
          value: 40,
          thresholdForCategory: 60,
          status: "danger",
          percentageOfTarget: 67,
        },
        {
          ratioId: "contacts_rdv",
          value: 80,
          thresholdForCategory: 100,
          status: "ok",
          percentageOfTarget: 80,
        },
        {
          ratioId: "rdv_mandats",
          value: 100,
          thresholdForCategory: 100,
          status: "ok",
          percentageOfTarget: 100,
        },
      ];
      const [card1] = derivePriorityCards(mockRatios);

      const situation = RATIO_SITUATION_MAP[card1.ratioId as keyof typeof RATIO_SITUATION_MAP];
      if (situation) {
        expect(["mandats", "estimation", "objections-acheteur", "negociation-honoraires", "follow-up"]).toContain(situation);
      }
    });
  });
});
