import { createHash } from "crypto";
import { PublicKey } from "@solana/web3.js";
import { CreatureState, SpeciesId } from "../creature/types";

export function anchorSighash(namespace: string, name: string): Buffer {
  const preimage = `${namespace}:${name}`;
  return createHash("sha256").update(preimage).digest().subarray(0, 8);
}

export const CREATURE_ACCOUNT_DISCRIMINATOR = anchorSighash("account", "Creature");
export const INITIALIZE_CREATURE_IX_DISCRIMINATOR = anchorSighash("global", "initialize_creature");
export const PERFORM_RITUAL_IX_DISCRIMINATOR = anchorSighash("global", "perform_ritual");
export const EVOLVE_IX_DISCRIMINATOR = anchorSighash("global", "evolve");

/**
 * Encodes initialize_creature instruction:
 * [8 bytes discriminator] + [1 byte species_id] + [4 bytes string length LE] + [string bytes]
 */
export function encodeInitializeCreatureInstruction(speciesId: number, name: string): Buffer {
  const nameBuffer = Buffer.from(name, "utf8");
  const buffer = Buffer.alloc(8 + 1 + 4 + nameBuffer.length);
  
  INITIALIZE_CREATURE_IX_DISCRIMINATOR.copy(buffer, 0);
  buffer.writeUInt8(speciesId, 8);
  buffer.writeUInt32LE(nameBuffer.length, 9);
  nameBuffer.copy(buffer, 13);
  
  return buffer;
}

/**
 * Encodes perform_ritual instruction:
 * [8 bytes discriminator] + [1 byte ritual_id]
 */
export function encodePerformRitualInstruction(ritualId: number): Buffer {
  const buffer = Buffer.alloc(8 + 1);
  PERFORM_RITUAL_IX_DISCRIMINATOR.copy(buffer, 0);
  buffer.writeUInt8(ritualId, 8);
  return buffer;
}

/**
 * Encodes evolve instruction:
 * [8 bytes discriminator] + [1 byte evolution_choice]
 */
export function encodeEvolveInstruction(evolutionChoice: number): Buffer {
  const buffer = Buffer.alloc(8 + 1);
  EVOLVE_IX_DISCRIMINATOR.copy(buffer, 0);
  buffer.writeUInt8(evolutionChoice, 8);
  return buffer;
}

/**
 * Decodes the on-chain Creature account data layout:
 * - 8 bytes: discriminator
 * - 32 bytes: owner (Pubkey)
 * - 16 bytes: creature_id
 * - 1 byte: species_id
 * - 4 bytes: name string length (u32 LE)
 * - N bytes: name utf8 string
 * - 1 byte: level (u8)
 * - 4 bytes: xp (u32 LE)
 * - 4 bytes: traits [u8; 4]
 * - 2 bytes: ritual_count (u16 LE)
 * - 1 byte: evolution_stage (u8)
 * - 1 byte: evolution_choice (u8)
 * - 8 bytes: last_action_slot (u64 LE)
 * - 1 byte: bump (u8)
 */
export function decodeCreatureAccount(data: Buffer, pdaAddress: PublicKey): CreatureState {
  if (data.length < 8 + 32 + 16 + 1 + 4) {
    throw new Error(`Creature account data too short: ${data.length} bytes`);
  }

  const discriminator = data.subarray(0, 8);
  if (!discriminator.equals(CREATURE_ACCOUNT_DISCRIMINATOR)) {
    throw new Error("Invalid Creature account discriminator");
  }

  let offset = 8;
  const owner = new PublicKey(data.subarray(offset, offset + 32)).toBase58();
  offset += 32;

  const creatureId = data.subarray(offset, offset + 16).toString("hex");
  offset += 16;

  const species = data.readUInt8(offset) as SpeciesId;
  offset += 1;

  const nameLen = data.readUInt32LE(offset);
  offset += 4;

  const name = data.subarray(offset, offset + nameLen).toString("utf8");
  offset += nameLen;

  const level = data.readUInt8(offset);
  offset += 1;

  const xp = data.readUInt32LE(offset);
  offset += 4;

  const traits: [number, number, number, number] = [
    data.readUInt8(offset),
    data.readUInt8(offset + 1),
    data.readUInt8(offset + 2),
    data.readUInt8(offset + 3),
  ];
  offset += 4;

  const ritualCount = data.readUInt16LE(offset);
  offset += 2;

  const evolutionStage = data.readUInt8(offset);
  offset += 1;

  const evolutionChoice = data.readUInt8(offset);
  offset += 1;

  const lastActionSlot = Number(data.readBigUInt64LE(offset));
  offset += 8;

  const bump = data.readUInt8(offset);

  return {
    owner,
    creatureId,
    species,
    name,
    level,
    xp,
    traits,
    ritualCount,
    evolutionStage,
    evolutionChoice,
    lastActionSlot,
    bump,
  };
}
