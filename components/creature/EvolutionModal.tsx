"use client";

import React, { FC, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  EVOLUTION_CATALOG,
  EvolutionChoice,
  CreatureState,
} from "@/lib/creature/types";
import { createEvolveTx, fetchCreatureAccount } from "@/lib/solana/transactions";
import { fetchEvolutionNarrative } from "@/lib/ai/client";
import { EvolutionNarrativeResponse } from "@/lib/ai/types";
import { getExplorerUrl } from "@/lib/solana/connection";
import { CreatureAvatar } from "./CreatureAvatar";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
  CheckCircle2,
  Crown,
  Zap,
  ArrowRight,
  Shield,
  Heart,
  Cpu,
} from "lucide-react";

export interface EvolutionModalProps {
  creature: CreatureState;
  isOpen: boolean;
  onClose: () => void;
  onEvolved: (newState: CreatureState) => void;
}

export const EvolutionModal: FC<EvolutionModalProps> = ({
  creature,
  isOpen,
  onClose,
  onEvolved,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const choices = EVOLUTION_CATALOG[creature.species] || [];
  const [selectedChoice, setSelectedChoice] = useState<EvolutionChoice>(choices[0] || null);
  const [isEvolving, setIsEvolving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<EvolutionNarrativeResponse | null>(null);

  if (!isOpen) return null;

  const handleEvolve = async () => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }

    if (!selectedChoice) {
      setErrorMsg("Please select an evolutionary branch.");
      return;
    }

    try {
      setIsEvolving(true);
      setErrorMsg(null);
      setTxSignature(null);

      // 1. Build evolve transaction
      const { transaction } = await createEvolveTx(
        wallet.publicKey,
        selectedChoice.id,
        connection
      );

      // 2. Sign and send
      const signature = await wallet.sendTransaction(transaction, connection);
      setTxSignature(signature);

      // 3. Confirm on Devnet
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed"
      );

      // 4. Fetch updated creature state from chain
      const { creature: updated } = await fetchCreatureAccount(wallet.publicKey, connection);
      if (updated) {
        onEvolved(updated);
      }

      // 5. Fetch narrative flavor text
      const nar = await fetchEvolutionNarrative({
        species: creature.species,
        name: creature.name,
        level: creature.level,
        choiceId: selectedChoice.id as 1 | 2,
        choiceName: selectedChoice.name,
      });
      setNarrative(nar);
    } catch (err: any) {
      console.error("Evolution failed:", err);
      if (err.message?.includes("User rejected") || err.name === "WalletSignTransactionError") {
        setErrorMsg("Evolution was cancelled in wallet.");
      } else {
        setErrorMsg(err.message || "Failed to evolve creature on Devnet.");
      }
    } finally {
      setIsEvolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-purple-500/40 p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6 my-auto overflow-hidden">
        {/* Celestial Background Glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-pink-600/15 blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition z-10"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!narrative ? (
          <>
            {/* Modal Header */}
            <div className="text-center flex flex-col items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/50">
                <Sparkles className="w-4 h-4 text-purple-300" />
                Evolution Milestone Attained
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Transcend {creature.name}&apos;s Form
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md">
                Your companion has attained Level {creature.level} on Solana Devnet. Select its permanent evolutionary ascension path.
              </p>
            </div>

            {/* Evolutionary Choices Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {choices.map((choice) => {
                const isSelected = selectedChoice?.id === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => setSelectedChoice(choice)}
                    className={`p-4 sm:p-5 rounded-2xl flex flex-col items-center gap-3 border transition-all text-center relative group ${
                      isSelected
                        ? "bg-purple-950/70 border-purple-400 shadow-xl shadow-purple-950/60 ring-2 ring-purple-500/40"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100"
                    }`}
                  >
                    {/* Active choice checkmark indicator */}
                    <div className="absolute top-3 right-3">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700" />
                      )}
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60">
                      <CreatureAvatar
                        species={creature.species}
                        evolutionStage={1}
                        evolutionChoice={choice.id}
                        className="w-24 h-24 sm:w-28 sm:h-28"
                      />
                    </div>

                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-base font-bold text-white group-hover:text-purple-200 transition">
                        {choice.name}
                      </span>
                      <span className="text-xs text-purple-300 font-medium">
                        {choice.title}
                      </span>
                    </div>

                    {/* Compact Trait Bonus Badges */}
                    <div className="grid grid-cols-4 gap-1 w-full pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                      <span className="p-1 rounded bg-sky-950/60 text-sky-300 font-semibold">
                        +{choice.traitBonus[0]} Cur
                      </span>
                      <span className="p-1 rounded bg-amber-950/60 text-amber-300 font-semibold">
                        +{choice.traitBonus[1]} Cou
                      </span>
                      <span className="p-1 rounded bg-rose-950/60 text-rose-300 font-semibold">
                        +{choice.traitBonus[2]} Emp
                      </span>
                      <span className="p-1 rounded bg-emerald-950/60 text-emerald-300 font-semibold">
                        +{choice.traitBonus[3]} Ing
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected choice detailed lore */}
            {selectedChoice && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-900/40 text-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-200 text-sm">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span>Path: {selectedChoice.name}</span>
                    <span className="text-slate-400 font-normal">({selectedChoice.title})</span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono">Stage 1 Transformation</span>
                </div>

                <p className="text-slate-300 leading-relaxed italic">
                  &ldquo;{selectedChoice.description}&rdquo;
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-300">Permanent On-Chain Attribution:</span>
                  <div className="flex items-center gap-2 font-mono text-emerald-400">
                    <span>Curiosity +{selectedChoice.traitBonus[0]}</span>
                    <span>•</span>
                    <span>Courage +{selectedChoice.traitBonus[1]}</span>
                    <span>•</span>
                    <span>Empathy +{selectedChoice.traitBonus[2]}</span>
                    <span>•</span>
                    <span>Ingenuity +{selectedChoice.traitBonus[3]}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction feedback & alerts */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {txSignature && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-purple-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Transcending on Solana Devnet...</span>
                </div>
                <a
                  href={getExplorerUrl(txSignature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-mono font-medium"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Confirm Evolve Button */}
            <button
              onClick={handleEvolve}
              disabled={isEvolving || !selectedChoice}
              className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-xl shadow-purple-900/40 transition-all text-sm"
            >
              {isEvolving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transcending Form on Devnet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Ascend as {selectedChoice?.name || "Transcend"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        ) : (
          /* Rich Celebration Presentation View */
          <div className="flex flex-col items-center text-center gap-5 py-4 animate-in fade-in zoom-in-95 duration-500">
            {/* Celebration Sparkle Badge */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-900/80 to-pink-900/80 border border-purple-400/60 shadow-lg shadow-purple-950/60">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
              <span className="text-xs uppercase tracking-widest font-black text-purple-200">
                Transcendence Complete • Stage 1
              </span>
            </div>

            {/* Glowing Evolved Avatar in Cosmic Aura */}
            <div className="relative my-2">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-2xl opacity-40 animate-pulse" />
              <div className="relative creature-glow p-4 rounded-3xl bg-slate-950/60 border border-purple-500/40">
                <CreatureAvatar
                  species={creature.species}
                  evolutionStage={1}
                  evolutionChoice={selectedChoice?.id || 1}
                  className="w-36 h-36 sm:w-44 sm:h-44"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 max-w-md">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {narrative.title}
              </h2>
              <span className="text-xs font-semibold text-purple-300">
                {creature.name} has ascended into {selectedChoice?.name}
              </span>
            </div>

            {/* Proclamation Bubble */}
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-purple-950/50 border border-purple-600/50 text-sm sm:text-base text-purple-100 italic leading-relaxed shadow-lg shadow-purple-950/40 relative">
              <span className="text-3xl text-purple-400 absolute top-2 left-3 font-serif">&ldquo;</span>
              <p className="px-5 font-serif">{narrative.proclamation}</p>
              <span className="text-3xl text-purple-400 absolute bottom-0 right-3 font-serif">&rdquo;</span>
            </div>

            {/* Transformation Narrative Summary */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
              {narrative.transformationSummary}
            </p>

            {/* Devnet verification link if signature exists */}
            {txSignature && (
              <a
                href={getExplorerUrl(txSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 font-mono underline"
              >
                <span>View Evolution Transaction on Solana Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Return Button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-xl shadow-purple-900/30"
            >
              Return to Companion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
