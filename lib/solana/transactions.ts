import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  findCreaturePda,
  getProgramId,
} from "./pda";
import { getSolanaConnection } from "./connection";
import {
  encodeInitializeCreatureInstruction,
  encodePerformRitualInstruction,
  encodeEvolveInstruction,
  decodeCreatureAccount,
} from "./coder";
import { CreatureState } from "../creature/types";

export interface TransactionResult {
  signature: string;
  confirmed: boolean;
  error?: string;
}

export async function fetchCreatureAccount(
  owner: PublicKey,
  connection: Connection = getSolanaConnection(),
  programId: PublicKey = getProgramId()
): Promise<{ pda: PublicKey; creature: CreatureState | null }> {
  const [pda] = findCreaturePda(owner, programId);
  try {
    const accountInfo = await connection.getAccountInfo(pda, "confirmed");

    if (!accountInfo || !accountInfo.data || accountInfo.data.length === 0) {
      return { pda, creature: null };
    }

    const creature = decodeCreatureAccount(accountInfo.data as Buffer, pda);
    return { pda, creature };
  } catch (err) {
    console.warn("Failed to fetch or decode creature account:", err);
    return { pda, creature: null };
  }
}

export function createInitializeCreatureInstruction(
  owner: PublicKey,
  speciesId: number,
  name: string,
  programId: PublicKey = getProgramId()
): { instruction: TransactionInstruction; pda: PublicKey } {
  const [pda] = findCreaturePda(owner, programId);
  const instructionData = encodeInitializeCreatureInstruction(speciesId, name);

  const keys = [
    { pubkey: pda, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const instruction = new TransactionInstruction({
    keys,
    programId,
    data: instructionData,
  });

  return { instruction, pda };
}

export async function createInitializeCreatureTx(
  owner: PublicKey,
  speciesId: number,
  name: string,
  connection: Connection = getSolanaConnection(),
  programId: PublicKey = getProgramId()
): Promise<{ transaction: Transaction; pda: PublicKey }> {
  const { instruction, pda } = createInitializeCreatureInstruction(owner, speciesId, name, programId);
  const tx = new Transaction().add(instruction);
  tx.feePayer = owner;
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  return { transaction: tx, pda };
}

export function createPerformRitualInstruction(
  owner: PublicKey,
  ritualId: number,
  programId: PublicKey = getProgramId()
): { instruction: TransactionInstruction; pda: PublicKey } {
  const [pda] = findCreaturePda(owner, programId);
  const instructionData = encodePerformRitualInstruction(ritualId);

  const keys = [
    { pubkey: pda, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
  ];

  const instruction = new TransactionInstruction({
    keys,
    programId,
    data: instructionData,
  });

  return { instruction, pda };
}

export async function createPerformRitualTx(
  owner: PublicKey,
  ritualId: number,
  connection: Connection = getSolanaConnection(),
  programId: PublicKey = getProgramId()
): Promise<{ transaction: Transaction; pda: PublicKey }> {
  const { instruction, pda } = createPerformRitualInstruction(owner, ritualId, programId);
  const tx = new Transaction().add(instruction);
  tx.feePayer = owner;
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  return { transaction: tx, pda };
}

export function createEvolveInstruction(
  owner: PublicKey,
  evolutionChoice: number,
  programId: PublicKey = getProgramId()
): { instruction: TransactionInstruction; pda: PublicKey } {
  const [pda] = findCreaturePda(owner, programId);
  const instructionData = encodeEvolveInstruction(evolutionChoice);

  const keys = [
    { pubkey: pda, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
  ];

  const instruction = new TransactionInstruction({
    keys,
    programId,
    data: instructionData,
  });

  return { instruction, pda };
}

export async function createEvolveTx(
  owner: PublicKey,
  evolutionChoice: number,
  connection: Connection = getSolanaConnection(),
  programId: PublicKey = getProgramId()
): Promise<{ transaction: Transaction; pda: PublicKey }> {
  const { instruction, pda } = createEvolveInstruction(owner, evolutionChoice, programId);
  const tx = new Transaction().add(instruction);
  tx.feePayer = owner;
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  return { transaction: tx, pda };
}
