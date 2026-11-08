import { describe, it, expect } from "vitest";
import { PublicKey, Keypair } from "@solana/web3.js";
import { createHash } from "crypto";
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
  findCreaturePda,
  DEFAULT_PROGRAM_ID,
  CREATURE_SEED_PREFIX,
  getProgramId,
  DEVNET_RPC_URL,
} from "@/lib/solana/pda";
import {
  getSolanaConnection,
  getExplorerUrl,
  getAddressExplorerUrl,
} from "@/lib/solana/connection";
import {
  getClientIp,
  validatePayloadSize,
  isValidSolanaAddress,
  MAX_PAYLOAD_BYTES,
} from "@/lib/ai/rateLimit";
import { calculateLevel, SPECIES_IDS } from "@/lib/creature/types";

describe("Solana Anchor Sighash & Binary Encoding Invariants", () => {
  it("strictly matches Anchor SHA256 formula: sha256(namespace:name)[0..8]", () => {
    // Official Anchor SHA256 formula:
    // Instruction: sha256("global:<method_name>")[..8]
    // Account:     sha256("account:<account_name>")[..8]

    const expectedInit = createHash("sha256").update("global:initialize_creature").digest().subarray(0, 8);
    const expectedRitual = createHash("sha256").update("global:perform_ritual").digest().subarray(0, 8);
    const expectedEvolve = createHash("sha256").update("global:evolve").digest().subarray(0, 8);
    const expectedAccount = createHash("sha256").update("account:Creature").digest().subarray(0, 8);

    expect(INITIALIZE_CREATURE_IX_DISCRIMINATOR).toEqual(expectedInit);
    expect(PERFORM_RITUAL_IX_DISCRIMINATOR).toEqual(expectedRitual);
    expect(EVOLVE_IX_DISCRIMINATOR).toEqual(expectedEvolve);
    expect(CREATURE_ACCOUNT_DISCRIMINATOR).toEqual(expectedAccount);

    // Verify exact expected hexadecimal representation
    expect(expectedInit.toString("hex")).toBe("3abcfcb6b43ff520");
    expect(expectedRitual.toString("hex")).toBe("307f65c260f84df8");
    expect(expectedEvolve.toString("hex")).toBe("8b8ba062fce26a51");
    expect(expectedAccount.toString("hex")).toBe("bea54659422e88dd");
  });

  it("discriminators are mutually distinct with zero collision", () => {
    const discriminators = [
      INITIALIZE_CREATURE_IX_DISCRIMINATOR.toString("hex"),
      PERFORM_RITUAL_IX_DISCRIMINATOR.toString("hex"),
      EVOLVE_IX_DISCRIMINATOR.toString("hex"),
      CREATURE_ACCOUNT_DISCRIMINATOR.toString("hex"),
    ];
    const unique = new Set(discriminators);
    expect(unique.size).toBe(4);
  });

  it("encodes initialize_creature with strict Borsh wire format", () => {
    const testCases = [
      { species: 0, name: "A" },
      { species: 1, name: "Bytey-12345" },
      { species: 2, name: "32-Characters-Long-Maximal-Name!" },
    ];

    for (const { species, name } of testCases) {
      const ix = encodeInitializeCreatureInstruction(species, name);
      const nameBuf = Buffer.from(name, "utf8");

      expect(ix.length).toBe(8 + 1 + 4 + nameBuf.length);
      expect(ix.subarray(0, 8)).toEqual(INITIALIZE_CREATURE_IX_DISCRIMINATOR);
      expect(ix.readUInt8(8)).toBe(species);
      expect(ix.readUInt32LE(9)).toBe(nameBuf.length);
      expect(ix.subarray(13).toString("utf8")).toBe(name);
    }
  });

  it("encodes perform_ritual instruction to exact 9 bytes", () => {
    for (const ritualId of [1, 2]) {
      const ix = encodePerformRitualInstruction(ritualId);
      expect(ix.length).toBe(9);
      expect(ix.subarray(0, 8)).toEqual(PERFORM_RITUAL_IX_DISCRIMINATOR);
      expect(ix.readUInt8(8)).toBe(ritualId);
    }
  });

  it("encodes evolve instruction to exact 9 bytes", () => {
    for (const choice of [1, 2]) {
      const ix = encodeEvolveInstruction(choice);
      expect(ix.length).toBe(9);
      expect(ix.subarray(0, 8)).toEqual(EVOLVE_IX_DISCRIMINATOR);
      expect(ix.readUInt8(8)).toBe(choice);
    }
  });
});

describe("PDA Derivation Determinism, Collision Resistance & Off-Curve Property", () => {
  it("seed prefix matches exact Anchor Rust constant b'creature'", () => {
    const expected = Buffer.from([99, 114, 101, 97, 116, 117, 114, 101]); // b"creature"
    expect(CREATURE_SEED_PREFIX).toEqual(expected);
    expect(CREATURE_SEED_PREFIX.toString("utf8")).toBe("creature");
  });

  it("stress test: determinism and collision resistance across 500 distinct public keys", () => {
    const sampleSize = 500;
    const derivedPdaSet = new Set<string>();
    const programId = getProgramId();

    for (let i = 0; i < sampleSize; i++) {
      const owner = Keypair.generate().publicKey;

      // 1. Determinism: evaluate 3 times independently
      const [pda1, bump1] = findCreaturePda(owner, programId);
      const [pda2, bump2] = findCreaturePda(owner, programId);
      const [pda3, bump3] = findCreaturePda(owner, programId);

      expect(pda1.toBase58()).toBe(pda2.toBase58());
      expect(pda2.toBase58()).toBe(pda3.toBase58());
      expect(bump1).toBe(bump2);
      expect(bump2).toBe(bump3);

      // 2. Bump is valid canonical byte in [0, 255]
      expect(bump1).toBeGreaterThanOrEqual(0);
      expect(bump1).toBeLessThanOrEqual(255);

      // 3. Off-curve guarantee: PDAs must NOT be valid ed25519 public keys (no private key exists)
      expect(PublicKey.isOnCurve(pda1.toBytes())).toBe(false);

      // 4. PDA must be distinct from owner address
      expect(pda1.toBase58()).not.toBe(owner.toBase58());

      // 5. Collision resistance: each distinct owner must produce a unique PDA
      expect(derivedPdaSet.has(pda1.toBase58())).toBe(false);
      derivedPdaSet.add(pda1.toBase58());

      // 6. Manual PDA verification against PublicKey.createProgramAddressSync
      const reconstructedPda = PublicKey.createProgramAddressSync(
        [CREATURE_SEED_PREFIX, owner.toBuffer(), Buffer.from([bump1])],
        programId
      );
      expect(reconstructedPda.toBase58()).toBe(pda1.toBase58());
    }

    expect(derivedPdaSet.size).toBe(sampleSize);
  });
});

describe("State Progression & Saturating Arithmetic Resilience", () => {
  it("verifies calculate_level thresholds across full u32 boundary conditions", () => {
    // Level thresholds from Rust program (programs/chainkin/src/lib.rs:231-241):
    // xp >= 200 => 4
    // xp >= 100 => 3
    // xp >= 40  => 2
    // else      => 1

    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(1)).toBe(1);
    expect(calculateLevel(39)).toBe(1);
    expect(calculateLevel(40)).toBe(2);
    expect(calculateLevel(41)).toBe(2);
    expect(calculateLevel(99)).toBe(2);
    expect(calculateLevel(100)).toBe(3);
    expect(calculateLevel(101)).toBe(3);
    expect(calculateLevel(199)).toBe(3);
    expect(calculateLevel(200)).toBe(4);
    expect(calculateLevel(201)).toBe(4);
    expect(calculateLevel(650)).toBe(7);
    expect(calculateLevel(3200)).toBe(15);
    expect(calculateLevel(1_000_000)).toBe(15);

    // Maximum u32 value: 4,294,967,295 (capped at Level 15 Transcendent Apex)
    const MAX_U32 = 0xffffffff;
    expect(calculateLevel(MAX_U32)).toBe(15);
  });

  it("simulates saturating arithmetic under extreme boundary conditions", () => {
    const MAX_U32 = 0xffffffff;
    const MAX_U16 = 0xffff;
    const MAX_U8 = 0xff;

    // Rust saturating_add simulation
    const satAddU32 = (a: number, b: number) => Math.min(MAX_U32, a + b);
    const satAddU16 = (a: number, b: number) => Math.min(MAX_U16, a + b);
    const satAddU8 = (a: number, b: number) => Math.min(MAX_U8, a + b);

    // 1. XP saturation near u32::MAX
    const xpNearMax = MAX_U32 - 10;
    const bondXp = satAddU32(xpNearMax, 30);
    expect(bondXp).toBe(MAX_U32); // Saturates without integer wrap to 19

    const exploreXp = satAddU32(xpNearMax, 40);
    expect(exploreXp).toBe(MAX_U32);

    // 2. Trait saturation at u8::MAX (255)
    expect(satAddU8(254, 2)).toBe(255); // Does not wrap to 0
    expect(satAddU8(255, 3)).toBe(255); // Does not wrap to 2
    expect(satAddU8(250, 9)).toBe(255); // Evolution bonus (+9) does not wrap to 3

    // 3. Ritual count saturation at u16::MAX (65535)
    expect(satAddU16(65534, 1)).toBe(65535);
    expect(satAddU16(65535, 1)).toBe(65535); // Does not wrap to 0
  });

  it("decodes maximal boundary Creature account layout without truncation or error", () => {
    const owner = Keypair.generate().publicKey;
    const [pda] = findCreaturePda(owner);
    const maxName = "A".repeat(32); // Max 32 bytes
    const nameBytes = Buffer.from(maxName, "utf8");

    // Exact space: 8 + 32 + 16 + 1 + 4 + 32 + 1 + 4 + 4 + 2 + 1 + 1 + 8 + 1 = 115 bytes
    const buf = Buffer.alloc(115);
    let offset = 0;

    CREATURE_ACCOUNT_DISCRIMINATOR.copy(buf, offset);
    offset += 8;

    owner.toBuffer().copy(buf, offset);
    offset += 32;

    const maxId = Buffer.alloc(16, 0xff);
    maxId.copy(buf, offset);
    offset += 16;

    buf.writeUInt8(SPECIES_IDS.MOSSLING, offset);
    offset += 1;

    buf.writeUInt32LE(nameBytes.length, offset);
    offset += 4;
    nameBytes.copy(buf, offset);
    offset += nameBytes.length;

    buf.writeUInt8(4, offset); // Level 4
    offset += 1;

    buf.writeUInt32LE(0xffffffff, offset); // Max u32 XP
    offset += 4;

    buf.writeUInt8(255, offset); // Max u8 curiosity
    buf.writeUInt8(255, offset + 1); // Max u8 courage
    buf.writeUInt8(255, offset + 2); // Max u8 empathy
    buf.writeUInt8(255, offset + 3); // Max u8 ingenuity
    offset += 4;

    buf.writeUInt16LE(0xffff, offset); // Max u16 ritual count
    offset += 2;

    buf.writeUInt8(1, offset); // Evolution stage 1
    offset += 1;

    buf.writeUInt8(2, offset); // Evolution choice 2
    offset += 1;

    buf.writeBigUInt64LE(BigInt("18446744073709551615"), offset); // Max u64 slot (BigInt)
    offset += 8;

    buf.writeUInt8(254, offset); // Canonical bump
    offset += 1;

    expect(offset).toBe(115);

    const decoded = decodeCreatureAccount(buf, pda);
    expect(decoded.owner).toBe(owner.toBase58());
    expect(decoded.creatureId).toBe("ffffffffffffffffffffffffffffffff");
    expect(decoded.species).toBe(SPECIES_IDS.MOSSLING);
    expect(decoded.name).toBe(maxName);
    expect(decoded.level).toBe(4);
    expect(decoded.xp).toBe(0xffffffff);
    expect(decoded.traits).toEqual([255, 255, 255, 255]);
    expect(decoded.ritualCount).toBe(65535);
    expect(decoded.evolutionStage).toBe(1);
    expect(decoded.evolutionChoice).toBe(2);
    expect(decoded.bump).toBe(254);
  });

  it("rejects malformed account buffers with invalid discriminators or truncated bytes", () => {
    const owner = Keypair.generate().publicKey;
    const [pda] = findCreaturePda(owner);

    // 1. Truncated data (< minimum header size)
    const shortBuf = Buffer.alloc(30);
    expect(() => decodeCreatureAccount(shortBuf, pda)).toThrow(/Creature account data too short/);

    // 2. Corrupted discriminator
    const corruptedBuf = Buffer.alloc(115);
    Buffer.from("corrupt8").copy(corruptedBuf, 0);
    expect(() => decodeCreatureAccount(corruptedBuf, pda)).toThrow(/Invalid Creature account discriminator/);
  });
});

describe("Devnet Network Targeting and Application Integrity Invariants", () => {
  it("targets Solana Devnet exclusively without mainnet endpoints or credentials", () => {
    expect(DEVNET_RPC_URL).toContain("devnet");
    const connection = getSolanaConnection();
    expect(connection.rpcEndpoint).toContain("devnet");

    const txUrl = getExplorerUrl("testSig123");
    expect(txUrl).toBe("https://explorer.solana.com/tx/testSig123?cluster=devnet");

    const addrUrl = getAddressExplorerUrl("testAddr456");
    expect(addrUrl).toBe("https://explorer.solana.com/address/testAddr456?cluster=devnet");
  });

  it("extracts client IP prioritizing cf-connecting-ip then x-forwarded-for then x-real-ip", () => {
    // 1. cf-connecting-ip takes precedence
    const req1 = new Request("http://localhost", {
      headers: {
        "cf-connecting-ip": "203.0.113.195",
        "x-forwarded-for": "198.51.100.1, 192.0.2.1",
        "x-real-ip": "192.0.2.200",
      },
    });
    expect(getClientIp(req1)).toBe("203.0.113.195");

    // 2. x-forwarded-for first IP if cf-connecting-ip absent
    const req2 = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "198.51.100.1, 192.0.2.1",
        "x-real-ip": "192.0.2.200",
      },
    });
    expect(getClientIp(req2)).toBe("198.51.100.1");

    // 3. x-real-ip if forwarded absent
    const req3 = new Request("http://localhost", {
      headers: {
        "x-real-ip": "192.0.2.200",
      },
    });
    expect(getClientIp(req3)).toBe("192.0.2.200");

    // 4. Default fallback to 127.0.0.1
    const req4 = new Request("http://localhost");
    expect(getClientIp(req4)).toBe("127.0.0.1");
  });

  it("validates payload size limits to protect against oversized AI requests", () => {
    expect(validatePayloadSize("500")).toBe(true);
    expect(validatePayloadSize(null, 500)).toBe(true);
    expect(validatePayloadSize(String(MAX_PAYLOAD_BYTES))).toBe(true);
    expect(validatePayloadSize(String(MAX_PAYLOAD_BYTES + 1))).toBe(false);
    expect(validatePayloadSize(null, MAX_PAYLOAD_BYTES + 100)).toBe(false);
  });

  it("validates Solana base58 public key addresses", () => {
    const validKey = Keypair.generate().publicKey.toBase58();
    expect(isValidSolanaAddress(validKey)).toBe(true);
    expect(isValidSolanaAddress("DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB")).toBe(true);
    expect(isValidSolanaAddress("")).toBe(false);
    expect(isValidSolanaAddress("invalid-chars-0OIl")).toBe(false);
    expect(isValidSolanaAddress("short")).toBe(false);
    expect(isValidSolanaAddress(undefined)).toBe(false);
  });
});

