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
import { Sparkles, Loader2, AlertCircle, ExternalLink, X, ShieldAlert } from "lucide-react";

interface EvolutionModalProps {
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
  const [selectedChoice, setSelectedChoice] = useState<EvolutionChoice>(choices[0]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-purple-500/40 p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!narrative ? (
          <>
            <div className="text-center flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Evolution Milestone Unlocked
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Choose {creature.name}&apos;s Evolution
              </h2>
              <p className="text-xs text-slate-400">
                Your companion has achieved the necessary harmony to transcend its base form.
              </p>
            </div>

            {/* Allowlisted Paths */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {choices.map((choice) => {
                const isSelected = selectedChoice.id === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => setSelectedChoice(choice)}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-3 border transition-all text-center ${
                      isSelected
                        ? "bg-purple-950/60 border-purple-400 shadow-lg shadow-purple-950/50"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <CreatureAvatar
                      species={creature.species}
                      evolutionStage={1}
                      evolutionChoice={choice.id}
                      className="w-20 h-20"
                    />
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-white">{choice.name}</span>
                      <span className="text-[10px] text-purple-300 font-medium">{choice.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected choice lore & bonus */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col gap-2">
              <span className="font-semibold text-purple-300">{selectedChoice.name}:</span>
              <p className="text-slate-300 leading-relaxed">{selectedChoice.description}</p>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span className="font-mono text-emerald-400">
                  Trait bonuses: +{selectedChoice.traitBonus[0]} Cur / +{selectedChoice.traitBonus[1]} Cou / +{selectedChoice.traitBonus[2]} Emp / +{selectedChoice.traitBonus[3]} Ing
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {txSignature && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-purple-800 text-xs text-slate-300">
                <span>Confirming evolution on Devnet...</span>
                <a
                  href={getExplorerUrl(txSignature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-mono"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <button
              onClick={handleEvolve}
              disabled={isEvolving}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-purple-900/30 transition"
            >
              {isEvolving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transcending on Solana...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Ascend as {selectedChoice.name}</span>
                </>
              )}
            </button>
          </>
        ) : (
          /* Celebration View */
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="relative">
              <CreatureAvatar
                species={creature.species}
                evolutionStage={1}
                evolutionChoice={selectedChoice.id}
                className="w-32 h-32 creature-glow"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-purple-400 font-bold">
                Evolution Complete
              </span>
              <h2 className="text-2xl font-black text-white">{narrative.title}</h2>
            </div>
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-700/50 text-sm text-purple-100 italic leading-relaxed">
              &ldquo;{narrative.proclamation}&rdquo;
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              {narrative.transformationSummary}
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Return to Companion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
