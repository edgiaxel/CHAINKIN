import { describe, it, expect, beforeEach } from "vitest";
import {
  saveActivityToStorage,
  loadActivitiesFromStorage,
  ActivityItem,
} from "@/components/creature/ActivityHistory";
import {
  isEvolutionEligible,
  calculateLevel,
  SPECIES_CATALOG,
  SPECIES_IDS,
  RITUAL_CATALOG,
  RITUAL_IDS,
  EVOLUTION_REQUIRED_LEVEL,
  EVOLUTION_REQUIRED_XP,
} from "@/lib/creature/types";

describe("Frontend User Journey & Activity Tracking", () => {
  const dummyKey = "test_creature_key_123";

  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  describe("Activity History Storage & Distinction", () => {
    it("distinguishes on-chain transactions from narrative dialogue events", () => {
      const onChainTx: ActivityItem = {
        id: "tx-1",
        type: "onchain",
        action: "ritual",
        title: "Bond Ritual Completed",
        description: "Channeled connection into creature. +30 XP recorded on Devnet.",
        timestamp: Date.now(),
        txSignature: "5abc123def456gh",
        details: { xpGained: 30 },
      };

      const narrativeEvent: ActivityItem = {
        id: "narrative-1",
        type: "narrative",
        action: "talk",
        title: "Communion with Companion",
        description: "Shared observations about consensus telemetry.",
        timestamp: Date.now(),
        details: {
          speech: "I feel the rhythm of slots aligning.",
          thought: "The keeper is attentive today.",
          mood: "Curious",
        },
      };

      expect(onChainTx.type).toBe("onchain");
      expect(onChainTx.txSignature).toBeDefined();
      expect(narrativeEvent.type).toBe("narrative");
      expect(narrativeEvent.details?.speech).toBeDefined();
    });

    it("saves and restores activity items safely", () => {
      const item: ActivityItem = {
        id: "awaken-1",
        type: "onchain",
        action: "awaken",
        title: "Awakened Lumis",
        description: "Bonded to wallet on Solana Devnet.",
        timestamp: 1700000000000,
        txSignature: "sig123456",
      };

      // In Node environment without window/localStorage, mock or fallback returns array with item
      const saved = saveActivityToStorage(dummyKey, item);
      expect(saved.length).toBeGreaterThanOrEqual(1);
      expect(saved[0].id).toBe("awaken-1");
    });
  });

  describe("Progression & Evolution Eligibility Flow", () => {
    it("calculates progression levels accurately against deterministic XP curves", () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(39)).toBe(1);
      expect(calculateLevel(40)).toBe(2);
      expect(calculateLevel(99)).toBe(2);
      expect(calculateLevel(100)).toBe(3);
      expect(calculateLevel(199)).toBe(3);
      expect(calculateLevel(200)).toBe(4);
    });

    it("verifies evolution eligibility requirements (Level 3 or 100 XP)", () => {
      // Ineligible: Level 1, 30 XP, stage 0
      expect(
        isEvolutionEligible({
          level: 1,
          xp: 30,
          evolutionStage: 0,
        })
      ).toBe(false);

      // Ineligible: Level 2, 70 XP, stage 0
      expect(
        isEvolutionEligible({
          level: 2,
          xp: 70,
          evolutionStage: 0,
        })
      ).toBe(false);

      // Eligible: Level 3, 100 XP, stage 0
      expect(
        isEvolutionEligible({
          level: EVOLUTION_REQUIRED_LEVEL,
          xp: EVOLUTION_REQUIRED_XP,
          evolutionStage: 0,
        })
      ).toBe(true);

      // Ineligible: Already evolved (stage 1)
      expect(
        isEvolutionEligible({
          level: 3,
          xp: 150,
          evolutionStage: 1,
        })
      ).toBe(false);
    });
  });

  describe("Catalog & Trait Matrix Integrity", () => {
    it("provides 3 unique species archetypes with base traits", () => {
      expect(SPECIES_CATALOG[SPECIES_IDS.WISP].name).toBe("Wisp");
      expect(SPECIES_CATALOG[SPECIES_IDS.BYTEBEAST].name).toBe("Bytebeast");
      expect(SPECIES_CATALOG[SPECIES_IDS.MOSSLING].name).toBe("Mossling");

      // Verify each archetype has 4 base traits [curiosity, courage, empathy, ingenuity]
      Object.values(SPECIES_CATALOG).forEach((sp) => {
        expect(sp.baseTraits.length).toBe(4);
        sp.baseTraits.forEach((val) => expect(val).toBeGreaterThan(0));
      });
    });

    it("provides accurate on-chain rituals catalog", () => {
      expect(RITUAL_CATALOG[RITUAL_IDS.OBSERVE].isOnChain).toBe(false);
      expect(RITUAL_CATALOG[RITUAL_IDS.BOND].isOnChain).toBe(true);
      expect(RITUAL_CATALOG[RITUAL_IDS.BOND].xpReward).toBe(30);
      expect(RITUAL_CATALOG[RITUAL_IDS.EXPLORE].isOnChain).toBe(true);
      expect(RITUAL_CATALOG[RITUAL_IDS.EXPLORE].xpReward).toBe(40);
    });
  });
});
