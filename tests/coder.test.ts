import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  anchorSighash,
  CREATURE_ACCOUNT_DISCRIMINATOR,
  INITIALIZE_CREATURE_IX_DISCRIMINATOR,
  PERFORM_RITUAL_IX_DISCRIMINATOR,
  EVOLVE_IX_DISCRIMINATOR,
  encodeInitializeCreatureInstruction,
  encodePerformRitualInstruction,
  encodeEvolveInstruction,
  decodeCreatureAccount,
} from "@/lib/solana/coder";

describe("Solana Anchor Coder", () => {
  it("computes anchor sighash correctly", () => {
    const hash = anchorSighash("global", "initialize_creature");
    expect(hash).toHaveLength(8);
    expect(INITIALIZE_CREATURE_IX_DISCRIMINATOR).toHaveLength(8);
    expect(PERFORM_RITUAL_IX_DISCRIMINATOR).toHaveLength(8);
    expect(EVOLVE_IX_DISCRIMINATOR).toHaveLength(8);
  });

  it("encodes initialize_creature instruction correctly", () => {
    const ix = encodeInitializeCreatureInstruction(1, "Bytey");
    expect(ix.subarray(0, 8)).toEqual(INITIALIZE_CREATURE_IX_DISCRIMINATOR);
    expect(ix.readUInt8(8)).toBe(1); // speciesId
    expect(ix.readUInt32LE(9)).toBe(5); // string length
    expect(ix.subarray(13).toString("utf8")).toBe("Bytey");
  });

  it("encodes perform_ritual instruction correctly", () => {
    const ix = encodePerformRitualInstruction(1);
    expect(ix.subarray(0, 8)).toEqual(PERFORM_RITUAL_IX_DISCRIMINATOR);
    expect(ix.readUInt8(8)).toBe(1);
  });

  it("encodes evolve instruction correctly", () => {
    const ix = encodeEvolveInstruction(2);
    expect(ix.subarray(0, 8)).toEqual(EVOLVE_IX_DISCRIMINATOR);
    expect(ix.readUInt8(8)).toBe(2);
  });

  it("decodes a valid Creature account correctly", () => {
    const owner = new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
    const pda = new PublicKey("CK1N111111111111111111111111111111111111111");
    const name = "WispTest";
    const nameBuf = Buffer.from(name, "utf8");

    const totalLen = 8 + 32 + 16 + 1 + 4 + nameBuf.length + 1 + 4 + 4 + 2 + 1 + 1 + 8 + 1;
    const buf = Buffer.alloc(totalLen);

    let offset = 0;
    CREATURE_ACCOUNT_DISCRIMINATOR.copy(buf, offset);
    offset += 8;

    owner.toBuffer().copy(buf, offset);
    offset += 32;

    const idBuf = Buffer.from("0123456789abcdef", "utf8");
    idBuf.copy(buf, offset);
    offset += 16;

    buf.writeUInt8(0, offset); // species = Wisp
    offset += 1;

    buf.writeUInt32LE(nameBuf.length, offset);
    offset += 4;
    nameBuf.copy(buf, offset);
    offset += nameBuf.length;

    buf.writeUInt8(2, offset); // level
    offset += 1;

    buf.writeUInt32LE(60, offset); // xp
    offset += 4;

    buf.writeUInt8(14, offset); // curiosity
    buf.writeUInt8(6, offset + 1); // courage
    buf.writeUInt8(13, offset + 2); // empathy
    buf.writeUInt8(8, offset + 3); // ingenuity
    offset += 4;

    buf.writeUInt16LE(2, offset); // ritualCount
    offset += 2;

    buf.writeUInt8(0, offset); // evolutionStage
    offset += 1;

    buf.writeUInt8(0, offset); // evolutionChoice
    offset += 1;

    buf.writeBigUInt64LE(BigInt(123456), offset); // lastActionSlot
    offset += 8;

    buf.writeUInt8(253, offset); // bump

    const decoded = decodeCreatureAccount(buf, pda);
    expect(decoded.owner).toBe(owner.toBase58());
    expect(decoded.species).toBe(0);
    expect(decoded.name).toBe("WispTest");
    expect(decoded.level).toBe(2);
    expect(decoded.xp).toBe(60);
    expect(decoded.traits).toEqual([14, 6, 13, 8]);
    expect(decoded.ritualCount).toBe(2);
    expect(decoded.evolutionStage).toBe(0);
    expect(decoded.lastActionSlot).toBe(123456);
    expect(decoded.bump).toBe(253);
  });
});
