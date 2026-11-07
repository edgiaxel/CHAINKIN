import { describe, it, expect } from "vitest";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  findCreaturePda,
  DEFAULT_PROGRAM_ID,
  CREATURE_SEED_PREFIX,
} from "@/lib/solana/pda";
import {
  encodeInitializeCreatureInstruction,
  encodePerformRitualInstruction,
  encodeEvolveInstruction,
  decodeCreatureAccount,
  CREATURE_ACCOUNT_DISCRIMINATOR,
} from "@/lib/solana/coder";
import { getFallbackDialogue, getFallbackEvolutionNarrative } from "@/lib/ai/fallback";
import { SPECIES_IDS, RITUAL_IDS } from "@/lib/creature/types";

describe("Solana Vertical Slice Integration", () => {
  const dummyOwner = Keypair.generate().publicKey;

  it("derives deterministic PDA correctly from owner", () => {
    const [pda1, bump1] = findCreaturePda(dummyOwner, DEFAULT_PROGRAM_ID);
    const [pda2, bump2] = findCreaturePda(dummyOwner, DEFAULT_PROGRAM_ID);

    expect(pda1.toBase58()).toBe(pda2.toBase58());
    expect(bump1).toBe(bump2);
    expect(bump1).toBeGreaterThanOrEqual(0);
    expect(bump1).toBeLessThanOrEqual(255);
  });

  it("produces different PDAs for different owners", () => {
    const ownerA = Keypair.generate().publicKey;
    const ownerB = Keypair.generate().publicKey;

    const [pdaA] = findCreaturePda(ownerA, DEFAULT_PROGRAM_ID);
    const [pdaB] = findCreaturePda(ownerB, DEFAULT_PROGRAM_ID);

    expect(pdaA.toBase58()).not.toBe(pdaB.toBase58());
  });

  it("builds and decodes end-to-end simulated lifecycle", () => {
    // 1. Initial State
    const creatureName = "AuraWisp";
    const nameBytes = Buffer.from(creatureName, "utf8");
    const accountSize = 8 + 32 + 16 + 1 + 4 + nameBytes.length + 1 + 4 + 4 + 2 + 1 + 1 + 8 + 1;
    const buf = Buffer.alloc(accountSize);

    let offset = 0;
    CREATURE_ACCOUNT_DISCRIMINATOR.copy(buf, offset);
    offset += 8;

    dummyOwner.toBuffer().copy(buf, offset);
    offset += 32;

    const dummyId = Buffer.alloc(16, 7);
    dummyId.copy(buf, offset);
    offset += 16;

    buf.writeUInt8(SPECIES_IDS.WISP, offset);
    offset += 1;

    buf.writeUInt32LE(nameBytes.length, offset);
    offset += 4;
    nameBytes.copy(buf, offset);
    offset += nameBytes.length;

    buf.writeUInt8(1, offset); // Level 1
    offset += 1;

    buf.writeUInt32LE(0, offset); // XP 0
    offset += 4;

    buf.writeUInt8(12, offset); // Curiosity
    buf.writeUInt8(6, offset + 1); // Courage
    buf.writeUInt8(10, offset + 2); // Empathy
    buf.writeUInt8(8, offset + 3); // Ingenuity
    offset += 4;

    buf.writeUInt16LE(0, offset); // Ritual count 0
    offset += 2;

    buf.writeUInt8(0, offset); // Evolution stage 0
    offset += 1;

    buf.writeUInt8(0, offset); // Evolution choice 0
    offset += 1;

    buf.writeBigUInt64LE(BigInt(100), offset); // Last action slot 100
    offset += 8;

    buf.writeUInt8(254, offset); // Bump

    const [pda] = findCreaturePda(dummyOwner);
    const state = decodeCreatureAccount(buf, pda);

    expect(state.owner).toBe(dummyOwner.toBase58());
    expect(state.name).toBe("AuraWisp");
    expect(state.level).toBe(1);
    expect(state.xp).toBe(0);
    expect(state.ritualCount).toBe(0);
    expect(state.evolutionStage).toBe(0);

    // 2. Perform Bond Ritual: XP +30, Empathy +3, Curiosity +2
    buf.writeUInt32LE(30, 8 + 32 + 16 + 1 + 4 + nameBytes.length + 1); // XP = 30
    buf.writeUInt8(14, 8 + 32 + 16 + 1 + 4 + nameBytes.length + 1 + 4); // Curiosity = 14
    buf.writeUInt8(13, 8 + 32 + 16 + 1 + 4 + nameBytes.length + 1 + 4 + 2); // Empathy = 13
    buf.writeUInt16LE(1, 8 + 32 + 16 + 1 + 4 + nameBytes.length + 1 + 4 + 4); // Rituals = 1

    const stateAfterBond = decodeCreatureAccount(buf, pda);
    expect(stateAfterBond.xp).toBe(30);
    expect(stateAfterBond.traits[0]).toBe(14);
    expect(stateAfterBond.traits[2]).toBe(13);
    expect(stateAfterBond.ritualCount).toBe(1);

    // 3. Dialogue reflecting ritual
    const dialogue = getFallbackDialogue({
      species: stateAfterBond.species,
      speciesName: "Wisp",
      name: stateAfterBond.name,
      level: stateAfterBond.level,
      xp: stateAfterBond.xp,
      evolutionStage: stateAfterBond.evolutionStage,
      recentRitual: "bond",
    });

    expect(dialogue.speech).toContain("connection");
    expect(dialogue.mood).toContain("Attuned");

    // 4. Evolve to Astral Guide (Choice 1)
    buf.writeUInt8(3, 8 + 32 + 16 + 1 + 4 + nameBytes.length); // Level 3
    buf.writeUInt32LE(100, 8 + 32 + 16 + 1 + 4 + nameBytes.length + 1); // XP 100
    buf.writeUInt8(1, 8 + 32 + 16 + 1 + 4 + nameBytes.length + 1 + 4 + 4 + 2); // Evolution Stage = 1
    buf.writeUInt8(1, 8 + 32 + 16 + 1 + 4 + nameBytes.length + 1 + 4 + 4 + 2 + 1); // Evolution Choice = 1

    const evolvedState = decodeCreatureAccount(buf, pda);
    expect(evolvedState.evolutionStage).toBe(1);
    expect(evolvedState.evolutionChoice).toBe(1);

    const evolutionNarrative = getFallbackEvolutionNarrative({
      species: evolvedState.species,
      name: evolvedState.name,
      level: evolvedState.level,
      choiceId: 1,
      choiceName: "Astral Guide",
    });

    expect(evolutionNarrative.title).toBe("Ascension of the Astral Guide");
    expect(evolutionNarrative.proclamation).toContain("Astral Guide");
  });
});
