"use client";

import React, { FC, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  SPECIES_CATALOG,
  SPECIES_IDS,
  SpeciesId,
  CreatureState,
} from "@/lib/creature/types";
import { createInitializeCreatureTx, fetchCreatureAccount } from "@/lib/solana/transactions";
import { findCreaturePda } from "@/lib/solana/pda";
import { getExplorerUrl } from "@/lib/solana/connection";
import { CreatureAvatar } from "./CreatureAvatar";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  Zap,
  Info,
} from "lucide-react";

export interface HatchModalProps {
  onHatched: (creature: CreatureState, signature?: string) => void;
}

export const HatchModal: FC<HatchModalProps> = ({ onHatched }) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesId>(SPECIES_IDS.WISP);
  const [name, setName] = useState<string>("");
  const [isHatching, setIsHatching] = useState<boolean>(false);
  const [txStep, setTxStep] = useState<"idle" | "signing" | "confirming">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const activeMetadata = SPECIES_CATALOG[selectedSpecies];

  const handleHatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg("Please give your creature a name.");
      return;
    }
    if (trimmed.length > 32) {
      setErrorMsg("Name cannot exceed 32 characters.");
      return;
    }

    try {
      setIsHatching(true);
      setTxStep("signing");
      setErrorMsg(null);
      setTxSignature(null);

      // Build initialization transaction
      const { transaction, pda } = await createInitializeCreatureTx(
        wallet.publicKey,
        selectedSpecies,
        trimmed,
        connection
      );

      // Send transaction with wallet adapter
      const signature = await wallet.sendTransaction(transaction, connection);
      setTxSignature(signature);
      setTxStep("confirming");

      // Confirm transaction on Devnet
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed"
      );

      // Fetch confirmed creature state from chain
      const { creature } = await fetchCreatureAccount(wallet.publicKey, connection);
      if (creature) {
        onHatched(creature, signature);
      } else {
        // Fallback optimistic construct if RPC indexing delay
        const optimistic: CreatureState = {
          owner: wallet.publicKey.toBase58(),
          creatureId: pda.toBase58(),
          species: selectedSpecies,
          name: trimmed,
          level: 1,
          xp: 0,
          traits: activeMetadata.baseTraits,
          ritualCount: 0,
          evolutionStage: 0,
          evolutionChoice: 0,
          lastActionSlot: 0,
          bump: findCreaturePda(wallet.publicKey)[1],
        };
        onHatched(optimistic, signature);
      }
    } catch (err: any) {
      console.error("Hatch transaction failed:", err);
      setTxStep("idle");
      if (err.message?.includes("User rejected") || err.name === "WalletSignTransactionError") {
        setErrorMsg("Awakening transaction was cancelled in wallet.");
      } else {
        setErrorMsg(err.message || "Failed to awaken creature on Devnet.");
      }
    } finally {
      setIsHatching(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-slate-900/90 border border-cyan-800/50 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="text-center flex flex-col items-center gap-1.5">
        <div className="inline-flex items-center justify-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60">
          <Sparkles className="w-3.5 h-3.5" />
          First-Time Awakening
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Awaken Your Chainkin Companion
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          One creature per wallet. Permanently bonded to your Solana Devnet address as an authoritative Program Derived Address (PDA).
        </p>
      </div>

      {/* Archetype Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.values(SPECIES_CATALOG) as typeof activeMetadata[]).map((meta) => {
          const isSelected = selectedSpecies === meta.id;
          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => setSelectedSpecies(meta.id)}
              className={`p-3.5 rounded-2xl flex flex-col items-center gap-2 border transition-all text-center relative ${
                isSelected
                  ? "bg-slate-800/95 border-cyan-400 shadow-xl shadow-cyan-950 ring-2 ring-cyan-500/40"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <CreatureAvatar species={meta.id} className="w-16 h-16 sm:w-20 sm:h-20" />
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-slate-100">{meta.name}</span>
                <span className="text-[10px] text-slate-400">{meta.tagline}</span>
              </div>

              {/* Base Traits Mini-Pills */}
              <div className="grid grid-cols-2 gap-1 w-full pt-1.5 border-t border-slate-800/70 text-[9px] font-mono text-slate-400">
                <span className="text-sky-300">Cur: {meta.baseTraits[0]}</span>
                <span className="text-amber-300">Cou: {meta.baseTraits[1]}</span>
                <span className="text-rose-300">Emp: {meta.baseTraits[2]}</span>
                <span className="text-emerald-300">Ing: {meta.baseTraits[3]}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Archetype Description */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs text-slate-300 flex flex-col gap-1">
        <span className="font-semibold text-cyan-300">{activeMetadata.name}:</span>
        <p className="leading-relaxed text-slate-400">{activeMetadata.description}</p>
      </div>

      {/* Name Input & Form */}
      <form onSubmit={handleHatch} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex justify-between">
            <span>Creature Name</span>
            <span className="text-slate-500 font-mono">{name.length}/32</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lumis, Byte, Bramble..."
            maxLength={32}
            disabled={isHatching}
            className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-600 outline-none text-sm font-medium transition"
          />
        </div>

        {/* Transaction preview notice with Devnet SOL faucet guide */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-slate-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-200">Solana Devnet Transaction</span>
            <span>
              Initializes a deterministic Creature PDA account under your wallet address. Estimated fee: ~0.001 Devnet SOL.
            </span>
            <div className="flex items-center gap-1.5 pt-0.5 text-slate-400">
              <Info className="w-3 h-3 text-cyan-400" />
              <span>Need Devnet SOL? Grab free test tokens at</span>
              <a
                href="https://faucet.solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:underline font-mono inline-flex items-center gap-0.5"
              >
                <span>faucet.solana.com</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {txStep === "signing" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-950/70 border border-cyan-800 text-xs text-cyan-200">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Awaiting transaction signature in your wallet...</span>
          </div>
        )}

        {txStep === "confirming" && txSignature && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-cyan-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Confirming awakening on Solana Devnet...</span>
            </div>
            <a
              href={getExplorerUrl(txSignature)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono underline"
            >
              <span>View Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={isHatching || !name.trim()}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-cyan-900/30 flex items-center justify-center gap-2 transition"
        >
          {isHatching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Awakening on Devnet...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Awaken {activeMetadata.name}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
