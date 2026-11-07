import { PublicKey } from "@solana/web3.js";

export const DEVNET_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const CLUSTER_NAME = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";

// Program ID placeholder or deployed program ID on Devnet
// Default fallback program ID if not set via environment variable
export const DEFAULT_PROGRAM_ID = new PublicKey("DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB");

export function getProgramId(): PublicKey {
  const envId = process.env.NEXT_PUBLIC_PROGRAM_ID;
  if (envId) {
    try {
      return new PublicKey(envId);
    } catch {
      // Fallback if malformed
    }
  }
  return DEFAULT_PROGRAM_ID;
}

export const CREATURE_SEED_PREFIX = Buffer.from("creature");

export function findCreaturePda(owner: PublicKey, programId: PublicKey = getProgramId()): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CREATURE_SEED_PREFIX, owner.toBuffer()], programId);
}
