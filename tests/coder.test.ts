import { describe, it, expect } from "vitest";
import { PublicKey, SystemProgram } from "@solana/web3.js";
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
import {
  createInitializeCreatureInstruction,
  createPerformRitualInstruction,
  createEvolveInstruction,
} from "@/lib/solana/transactions";
import { findCreaturePda, getProgramId } from "@/lib/solana/pda";

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

  it("throws when decoding an account with name length exceeding 32 characters", () => {
    const owner = new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
    const pda = new PublicKey("CK1N111111111111111111111111111111111111111");
    const buf = Buffer.alloc(120);

    CREATURE_ACCOUNT_DISCRIMINATOR.copy(buf, 0);
    owner.toBuffer().copy(buf, 8);
    // species at offset 56
    buf.writeUInt8(0, 56);
    // nameLen = 33 (> 32)
    buf.writeUInt32LE(33, 57);

    expect(() => decodeCreatureAccount(buf, pda)).toThrow(/Invalid Creature name length/);
  });

  it("throws when decoding truncated creature accounts", () => {
    const pda = new PublicKey("CK1N111111111111111111111111111111111111111");

    // Extremely short buffer
    expect(() => decodeCreatureAccount(Buffer.alloc(20), pda)).toThrow(
      /Creature account data too short/
    );

    // Buffer with valid header and name length, but truncated tail
    const owner = new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
    const buf = Buffer.alloc(70); // Needs 61 + 5 + 22 = 88 bytes
    CREATURE_ACCOUNT_DISCRIMINATOR.copy(buf, 0);
    owner.toBuffer().copy(buf, 8);
    buf.writeUInt8(0, 56);
    buf.writeUInt32LE(5, 57); // 5-byte name
    Buffer.from("Hello").copy(buf, 61);

    expect(() => decodeCreatureAccount(buf, pda)).toThrow(/Creature account data too short/);
  });
});

describe("Solana Transaction Instruction Builders", () => {
  const owner = new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
  const programId = getProgramId();
  const [expectedPda] = findCreaturePda(owner, programId);

  it("builds valid initialize_creature instruction", () => {
    const { instruction, pda } = createInitializeCreatureInstruction(owner, 0, "Lumi", programId);
    expect(pda.toBase58()).toBe(expectedPda.toBase58());
    expect(instruction.programId.toBase58()).toBe(programId.toBase58());
    expect(instruction.keys).toHaveLength(3);

    // Key 0: PDA (writable, not signer)
    expect(instruction.keys[0].pubkey.toBase58()).toBe(expectedPda.toBase58());
    expect(instruction.keys[0].isSigner).toBe(false);
    expect(instruction.keys[0].isWritable).toBe(true);

    // Key 1: Owner (writable, signer)
    expect(instruction.keys[1].pubkey.toBase58()).toBe(owner.toBase58());
    expect(instruction.keys[1].isSigner).toBe(true);
    expect(instruction.keys[1].isWritable).toBe(true);

    // Key 2: System Program (read-only, not signer)
    expect(instruction.keys[2].pubkey.toBase58()).toBe(SystemProgram.programId.toBase58());
    expect(instruction.keys[2].isSigner).toBe(false);
    expect(instruction.keys[2].isWritable).toBe(false);

    expect(instruction.data).toEqual(encodeInitializeCreatureInstruction(0, "Lumi"));
  });

  it("builds valid perform_ritual instruction", () => {
    const { instruction, pda } = createPerformRitualInstruction(owner, 1, programId);
    expect(pda.toBase58()).toBe(expectedPda.toBase58());
    expect(instruction.programId.toBase58()).toBe(programId.toBase58());
    expect(instruction.keys).toHaveLength(2);

    // Key 0: PDA (writable, not signer)
    expect(instruction.keys[0].pubkey.toBase58()).toBe(expectedPda.toBase58());
    expect(instruction.keys[0].isSigner).toBe(false);
    expect(instruction.keys[0].isWritable).toBe(true);

    // Key 1: Owner (read-only, signer)
    expect(instruction.keys[1].pubkey.toBase58()).toBe(owner.toBase58());
    expect(instruction.keys[1].isSigner).toBe(true);
    expect(instruction.keys[1].isWritable).toBe(false);

    expect(instruction.data).toEqual(encodePerformRitualInstruction(1));
  });

  it("builds valid evolve instruction", () => {
    const { instruction, pda } = createEvolveInstruction(owner, 2, programId);
    expect(pda.toBase58()).toBe(expectedPda.toBase58());
    expect(instruction.programId.toBase58()).toBe(programId.toBase58());
    expect(instruction.keys).toHaveLength(2);

    // Key 0: PDA (writable, not signer)
    expect(instruction.keys[0].pubkey.toBase58()).toBe(expectedPda.toBase58());
    expect(instruction.keys[0].isSigner).toBe(false);
    expect(instruction.keys[0].isWritable).toBe(true);

    // Key 1: Owner (read-only, signer)
    expect(instruction.keys[1].pubkey.toBase58()).toBe(owner.toBase58());
    expect(instruction.keys[1].isSigner).toBe(true);
    expect(instruction.keys[1].isWritable).toBe(false);

    expect(instruction.data).toEqual(encodeEvolveInstruction(2));
  });
});


