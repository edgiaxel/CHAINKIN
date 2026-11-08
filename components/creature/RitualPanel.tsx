"use client";

import React, { FC, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { RITUAL_CATALOG, RITUAL_IDS, RitualId, CreatureState } from "@/lib/creature/types";
import { createPerformRitualTx, fetchCreatureAccount } from "@/lib/solana/transactions";
import { getExplorerUrl } from "@/lib/solana/connection";
import {
  Eye,
  Heart,
  Compass,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";

export interface RitualPanelProps {
  creature: CreatureState;
  onStateUpdated: (newState: CreatureState) => void;
  onObserve: () => void;
  onRitualCompleted: (ritualName: "bond" | "explore", txSignature?: string) => void;
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
  const [txStep, setTxStep] = useState<"idle" | "signing" | "confirming" | "success" | "error">("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleObserve = () => {
    setErrorMsg(null);
    setSuccessMsg("Observed creature! Fresh perceptions attuning...");
    onObserve();
  };

  const handleOnChainRitual = async (ritualId: RitualId, ritualName: "bond" | "explore") => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setErrorMsg("Please connect your wallet first.");
      setTxStep("error");
      return;
    }

    try {
      setActiveRitual(ritualId);
      setTxStep("signing");
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
      setTxStep("confirming");

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
      setTxStep("success");

      if (updated) {
        onStateUpdated(updated);
        const xpDelta = ritualId === RITUAL_IDS.BOND ? 30 : 40;
        setSuccessMsg(
          `${ritualName === "bond" ? "Bonding" : "Exploration"} confirmed on-chain! +${xpDelta} XP recorded.`
        );
        onRitualCompleted(ritualName, signature);
      } else {
        setSuccessMsg(`Ritual confirmed on Devnet! Refreshing state...`);
        onRitualCompleted(ritualName, signature);
      }
    } catch (err: any) {
      console.error("Ritual transaction error:", err);
      setTxStep("error");
      if (err.message?.includes("User rejected") || err.name === "WalletSignTransactionError") {
        setErrorMsg("Transaction signature was cancelled in wallet.");
      } else {
        setErrorMsg(err.message || "Failed to execute ritual transaction on Devnet.");
      }
    } finally {
      setActiveRitual(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Daily Rituals & On-Chain Progression
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Total Completed: <strong className="text-cyan-300">{creature.ritualCount}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Observe: Free */}
        <button
          onClick={handleObserve}
          disabled={activeRitual !== null}
          className="flex flex-col justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-700/60 hover:border-cyan-500/60 transition-all text-left group disabled:opacity-50 shadow-md backdrop-blur-sm"
        >
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Eye className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                Observe
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-400 font-mono font-semibold border border-cyan-800/50">
                Free
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Quietly attune to your companion and generate fresh thoughts without a transaction.
            </p>
          </div>
          <div className="text-[10px] font-mono text-cyan-400/80 pt-2 border-t border-slate-800/80">
            Generates thoughts & insights
          </div>
        </button>

        {/* Bond: On-chain */}
        <button
          onClick={() => handleOnChainRitual(RITUAL_IDS.BOND, "bond")}
          disabled={activeRitual !== null}
          className="flex flex-col justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 border border-rose-900/40 hover:border-rose-500/60 transition-all text-left group disabled:opacity-50 shadow-md backdrop-blur-sm"
        >
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                {activeRitual === RITUAL_IDS.BOND ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                ) : (
                  <Heart className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
                )}
                Bond
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/90 text-rose-300 font-mono font-bold border border-rose-700/50">
                +30 XP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Channel connection into your companion. Recorded permanently on Solana Devnet.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-rose-300/90 pt-2 border-t border-slate-800/80">
            <span>+2 Curiosity</span>
            <span>•</span>
            <span>+3 Empathy</span>
          </div>
        </button>

        {/* Explore: On-chain */}
        <button
          onClick={() => handleOnChainRitual(RITUAL_IDS.EXPLORE, "explore")}
          disabled={activeRitual !== null}
          className="flex flex-col justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 border border-amber-900/40 hover:border-amber-500/60 transition-all text-left group disabled:opacity-50 shadow-md backdrop-blur-sm"
        >
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                {activeRitual === RITUAL_IDS.EXPLORE ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Compass className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                )}
                Explore
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 font-mono font-bold border border-amber-700/50">
                +40 XP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Scout Devnet validator blocks. Fortifies courage and unlocks technical ingenuity.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-amber-300/90 pt-2 border-t border-slate-800/80">
            <span>+3 Courage</span>
            <span>•</span>
            <span>+2 Ingenuity</span>
          </div>
        </button>
      </div>

      {/* Signing / Confirming / Success / Error status banners */}
      {txStep === "signing" && (
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-cyan-950/70 border border-cyan-800/80 text-xs text-cyan-200">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
          <span>Awaiting transaction signature in wallet...</span>
        </div>
      )}

      {txStep === "confirming" && txSignature && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/90 border border-cyan-700/60 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            <span>Confirming ritual on Solana Devnet...</span>
          </div>
          <a
            href={getExplorerUrl(txSignature)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {txStep === "success" && txSignature && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg || "Ritual confirmed on Solana Devnet!"}</span>
          </div>
          <a
            href={getExplorerUrl(txSignature)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-300 hover:text-emerald-200 font-mono text-[11px] underline"
          >
            <span>Tx Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-950/60 border border-red-800/70 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && txStep !== "success" && !errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 text-xs text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
