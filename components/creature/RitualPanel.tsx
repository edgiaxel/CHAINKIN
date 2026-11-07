"use client";

import React, { FC, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { RITUAL_CATALOG, RITUAL_IDS, RitualId, CreatureState } from "@/lib/creature/types";
import { createPerformRitualTx, fetchCreatureAccount } from "@/lib/solana/transactions";
import { getExplorerUrl } from "@/lib/solana/connection";
import { Eye, Heart, Compass, Loader2, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";

interface RitualPanelProps {
  creature: CreatureState;
  onStateUpdated: (newState: CreatureState) => void;
  onObserve: () => void;
  onRitualCompleted: (ritualName: "bond" | "explore") => void;
}

export const RitualPanel: FC<RitualPanelProps> = ({
  creature,
  onStateUpdated,
  onObserve,
  onRitualCompleted,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [activeRitual, setActiveRitual] = useState<RitualId | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleObserve = () => {
    setErrorMsg(null);
    setSuccessMsg("Observed creature! No transaction needed.");
    onObserve();
  };

  const handleOnChainRitual = async (ritualId: RitualId, ritualName: "bond" | "explore") => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }

    try {
      setActiveRitual(ritualId);
      setErrorMsg(null);
      setSuccessMsg(null);
      setTxSignature(null);

      // Build program instruction
      const { transaction } = await createPerformRitualTx(
        wallet.publicKey,
        ritualId,
        connection
      );

      // Send transaction with wallet adapter
      const signature = await wallet.sendTransaction(transaction, connection);
      setTxSignature(signature);

      // Wait for confirmation on Devnet
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed"
      );

      // Fetch authoritative updated on-chain state
      const { creature: updated } = await fetchCreatureAccount(wallet.publicKey, connection);
      if (updated) {
        onStateUpdated(updated);
        setSuccessMsg(
          `Ritual confirmed! Awarded XP and updated traits on-chain.`
        );
        onRitualCompleted(ritualName);
      } else {
        setSuccessMsg(`Ritual confirmed on Devnet! Refreshing state...`);
      }
    } catch (err: any) {
      console.error("Ritual transaction error:", err);
      if (err.message?.includes("User rejected") || err.name === "WalletSignTransactionError") {
        setErrorMsg("Transaction was cancelled in wallet.");
      } else {
        setErrorMsg(err.message || "Failed to execute ritual transaction on Devnet.");
      }
    } finally {
      setActiveRitual(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Daily Rituals & Interactions
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          Total Rituals: {creature.ritualCount}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Observe: Free */}
        <button
          onClick={handleObserve}
          disabled={activeRitual !== null}
          className="flex flex-col items-start gap-1.5 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/50 transition-all text-left group disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Eye className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
              Observe
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 font-mono">
              Free (Off-chain)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Read current state and generate fresh creature thoughts.
          </p>
        </button>

        {/* Bond: On-chain */}
        <button
          onClick={() => handleOnChainRitual(RITUAL_IDS.BOND, "bond")}
          disabled={activeRitual !== null}
          className="flex flex-col items-start gap-1.5 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-rose-900/40 hover:border-rose-500/50 transition-all text-left group disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
              {activeRitual === RITUAL_IDS.BOND ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              ) : (
                <Heart className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
              )}
              Bond
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 font-mono font-semibold">
              +30 XP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Strengthen connection. Increases Empathy (+3) & Curiosity (+2).
          </p>
        </button>

        {/* Explore: On-chain */}
        <button
          onClick={() => handleOnChainRitual(RITUAL_IDS.EXPLORE, "explore")}
          disabled={activeRitual !== null}
          className="flex flex-col items-start gap-1.5 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-amber-900/40 hover:border-amber-500/50 transition-all text-left group disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              {activeRitual === RITUAL_IDS.EXPLORE ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Compass className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              )}
              Explore
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 font-mono font-semibold">
              +40 XP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Scout validator blocks. Increases Courage (+3) & Ingenuity (+2).
          </p>
        </button>
      </div>

      {/* Transaction status alert */}
      {txSignature && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-cyan-800/50 text-xs">
          <div className="flex items-center gap-2">
            {activeRitual !== null ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="text-slate-300">
              {activeRitual !== null ? "Confirming on Devnet..." : "Confirmed on-chain!"}
            </span>
          </div>
          <a
            href={getExplorerUrl(txSignature)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono font-medium"
          >
            <span>View Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && !errorMsg && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-xs text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
