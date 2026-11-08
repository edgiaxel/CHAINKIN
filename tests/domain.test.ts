import { describe, it, expect } from "vitest";
import {
  SPECIES_CATALOG,
  SPECIES_IDS,
  RITUAL_CATALOG,
  RITUAL_IDS,
  calculateLevel,
  isEvolutionEligible,
  CreatureStateSchema,
} from "@/lib/creature/types";
import { getFallbackDialogue, getFallbackEvolutionNarrative } from "@/lib/ai/fallback";

describe("Creature Domain Logic", () => {
  it("has valid species metadata and base traits", () => {
    expect(SPECIES_CATALOG[SPECIES_IDS.WISP].baseTraits).toHaveLength(4);
    expect(SPECIES_CATALOG[SPECIES_IDS.BYTEBEAST].baseTraits).toHaveLength(4);
    expect(SPECIES_CATALOG[SPECIES_IDS.MOSSLING].baseTraits).toHaveLength(4);
  });

  it("calculates level deterministically from XP", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(39)).toBe(1);
    expect(calculateLevel(40)).toBe(2);
    expect(calculateLevel(99)).toBe(2);
    expect(calculateLevel(100)).toBe(3);
    expect(calculateLevel(199)).toBe(3);
    expect(calculateLevel(200)).toBe(4);
    expect(calculateLevel(650)).toBe(7);
    expect(calculateLevel(3200)).toBe(15);
  });

  it("checks evolution eligibility correctly", () => {
    expect(isEvolutionEligible({ level: 1, xp: 0, evolutionStage: 0 })).toBe(false);
    expect(isEvolutionEligible({ level: 2, xp: 80, evolutionStage: 0 })).toBe(false);
    expect(isEvolutionEligible({ level: 3, xp: 100, evolutionStage: 0 })).toBe(true);
    // Already evolved cannot evolve again
    expect(isEvolutionEligible({ level: 3, xp: 120, evolutionStage: 1 })).toBe(false);
  });

  it("validates CreatureState schema", () => {
    const valid = {
      owner: "11111111111111111111111111111111",
      creatureId: "CK1N111111111111111111111111111111111111111",
      species: 0,
      name: "Sparky",
      level: 1,
      xp: 0,
      traits: [12, 6, 10, 8] as [number, number, number, number],
      ritualCount: 0,
      evolutionStage: 0,
      evolutionChoice: 0,
      lastActionSlot: 1000,
      bump: 254,
    };
    const parsed = CreatureStateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("produces rich fallback dialogue without AI key", () => {
    const dialogue = getFallbackDialogue({
      species: SPECIES_IDS.WISP,
      speciesName: "Wisp",
      name: "Aura",
      level: 2,
      xp: 50,
      evolutionStage: 0,
      recentRitual: "bond",
    });

    expect(dialogue.speech).toBeTruthy();
    expect(dialogue.mood).toBeTruthy();
    expect(dialogue.isFallback).toBe(true);
  });

  it("produces fallback evolution narrative", () => {
    const narrative = getFallbackEvolutionNarrative({
      species: SPECIES_IDS.BYTEBEAST,
      name: "Gizmo",
      level: 3,
      choiceId: 1,
      choiceName: "Cyber Warden",
    });

    expect(narrative.title).toContain("Cyber Warden");
    expect(narrative.proclamation).toBeTruthy();
    expect(narrative.isFallback).toBe(true);
  });
});
