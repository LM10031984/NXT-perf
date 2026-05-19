import { describe, it, expect } from "vitest";
import {
  SITUATION_PERSONA_MAP,
  PERSONA_VOICE_ENV_VAR,
} from "../constants";
import type { SituationType, ElevenLabsPersona } from "../constants";

describe("SITUATION_PERSONA_MAP — TRAIN-04", () => {
  it("contient exactement les 5 situations attendues", () => {
    const keys = Object.keys(SITUATION_PERSONA_MAP).sort();
    expect(keys).toEqual(
      [
        "estimation",
        "follow-up",
        "mandats",
        "negociation-honoraires",
        "objections-acheteur",
      ].sort(),
    );
  });

  it("mappe chaque situation vers une persona valide (kind|sport|warrior)", () => {
    const validPersonas: ElevenLabsPersona[] = ["kind", "sport", "warrior"];
    for (const situation of Object.keys(SITUATION_PERSONA_MAP) as SituationType[]) {
      expect(validPersonas).toContain(SITUATION_PERSONA_MAP[situation]);
    }
  });

  it("mandats est mappé sur warrior (locked CONTEXT.md D5)", () => {
    expect(SITUATION_PERSONA_MAP.mandats).toBe("warrior");
  });
});

describe("PERSONA_VOICE_ENV_VAR — TRAIN-04", () => {
  it("contient exactement les 3 personas", () => {
    const keys = Object.keys(PERSONA_VOICE_ENV_VAR).sort();
    expect(keys).toEqual(["kind", "sport", "warrior"]);
  });

  it("chaque valeur est un nom de variable ELEVENLABS_*_VOICE_ID", () => {
    for (const persona of Object.keys(PERSONA_VOICE_ENV_VAR) as ElevenLabsPersona[]) {
      expect(PERSONA_VOICE_ENV_VAR[persona]).toMatch(/^ELEVENLABS_.*_VOICE_ID$/);
    }
  });
});
