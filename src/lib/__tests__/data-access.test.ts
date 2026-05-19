import { describe, it, expect, beforeEach } from "vitest";
import { getWeeklyResults } from "../data-access";
import { useAppStore } from "@/stores/app-store";
import type { PeriodResults } from "@/types/results";

const sampleMonthResult: PeriodResults = {
  id: "r-1",
  userId: "u-1",
  periodType: "month",
  periodStart: "2026-02-01",
  periodEnd: "2026-02-28",
  prospection: { contactsTotaux: 50, rdvEstimation: 10 },
  vendeurs: {
    rdvEstimation: 10,
    estimationsRealisees: 8,
    mandatsSignes: 4,
    mandats: [],
    rdvSuivi: 3,
    requalificationSimpleExclusif: 1,
    baissePrix: 0,
  },
  acheteurs: {
    acheteursSortisVisite: 5,
    nombreVisites: 12,
    offresRecues: 3,
    compromisSignes: 2,
    chiffreAffairesCompromis: 18000,
  },
  ventes: { actesSignes: 1, chiffreAffaires: 9000 },
  createdAt: "2026-02-28T18:00:00.000Z",
  updatedAt: "2026-02-28T18:00:00.000Z",
};

const sampleWeekResult: PeriodResults = {
  ...sampleMonthResult,
  id: "r-2",
  periodType: "week",
  periodStart: "2026-02-03",
  periodEnd: "2026-02-09",
};

describe("getWeeklyResults — DATA-01", () => {
  beforeEach(() => {
    useAppStore.setState({ results: [] });
  });

  it("renvoie null quand aucun résultat ne correspond", () => {
    expect(getWeeklyResults("u-unknown", "2026-02")).toBeNull();
  });

  it("renvoie le PeriodResults correct pour un couple (userId, YYYY-MM) connu", () => {
    useAppStore.setState({ results: [sampleMonthResult] });
    const r = getWeeklyResults("u-1", "2026-02");
    expect(r).not.toBeNull();
    expect(r?.id).toBe("r-1");
  });

  it("renvoie null pour une période différente", () => {
    useAppStore.setState({ results: [sampleMonthResult] });
    expect(getWeeklyResults("u-1", "2026-03")).toBeNull();
  });

  it("exclut les périodes de type week même si la date matche", () => {
    useAppStore.setState({ results: [sampleWeekResult] });
    expect(getWeeklyResults("u-1", "2026-02")).toBeNull();
  });
});
