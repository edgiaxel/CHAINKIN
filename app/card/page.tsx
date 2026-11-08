"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  CreatureState,
  SPECIES_CATALOG,
  EVOLUTION_CATALOG,
} from "@/lib/creature/types";
import { fetchCreatureAccount } from "@/lib/solana/transactions";
import { CreatureAvatar } from "@/components/creature/CreatureAvatar";
import { TraitBar } from "@/components/creature/TraitBar";
import { getAddressExplorerUrl } from "@/lib/solana/connection";
import {
  Printer,
  Share2,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowLeft,
  ExternalLink,
  Layers,
  Radio,
  Check,
} from "lucide-react";

function StatCardContent() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const searchParams = useSearchParams();

  const [creature, setCreature] = useState<CreatureState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Target wallet: URL param ?wallet=... or active connected wallet
  const targetWalletAddress = searchParams.get("wallet") || wallet.publicKey?.toBase58();

  const loadCreature = useCallback(async () => {
    if (!targetWalletAddress) {
      setCreature(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const pubkey = new PublicKey(targetWalletAddress);
      const { creature: onChain } = await fetchCreatureAccount(pubkey, connection);
      setCreature(onChain);
    } catch (err) {
      console.error("Failed to load stat card creature:", err);
      setCreature(null);
    } finally {
      setLoading(false);
    }
  }, [targetWalletAddress, connection]);

  useEffect(() => {
    loadCreature();
  }, [loadCreature]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!targetWalletAddress) return;
    const shareUrl = `${window.location.origin}/card?wallet=${targetWalletAddress}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const speciesMeta = creature ? SPECIES_CATALOG[creature.species] : null;
  const isEvolved = creature ? creature.evolutionStage > 0 : false;
  let evolvedTitle = "";
  if (creature && isEvolved && creature.evolutionChoice > 0) {
    const choiceList = EVOLUTION_CATALOG[creature.species];
    const match = choiceList?.find((c) => c.id === creature.evolutionChoice);
    if (match) {
      evolvedTitle = match.name;
    }
  }

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-4rem)] px-4 py-8 max-w-4xl mx-auto w-full gap-6">
      {/* Action Header bar: Hidden in Print Mode */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80 pb-3 print:hidden">
        <Link
          href="/creature"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Companion</span>
        </Link>

        {creature && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 transition font-medium shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Share URL</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition font-semibold shadow-md shadow-cyan-950/40"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card / PDF</span>
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <span className="text-xs font-mono">Generating Collectible Stat Card...</span>
        </div>
      )}

      {!loading && !creature && (
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center flex flex-col items-center gap-4 shadow-xl">
          <Sparkles className="w-8 h-8 text-slate-500" />
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-white">No Companion Card Found</h2>
            <p className="text-xs text-slate-400">
              Connect your wallet or awaken a companion to view its collectible proof ticket.
            </p>
          </div>
          <Link
            href="/creature"
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition"
          >
            Go to Awakening
          </Link>
        </div>
      )}

      {/* The Printable Card Canvas */}
      {!loading && creature && speciesMeta && (
        <div
          id="creature-stat-card"
          className="w-full max-w-md rounded-3xl bg-slate-950 border-2 border-cyan-600/50 p-6 sm:p-8 flex flex-col gap-5 shadow-2xl relative overflow-hidden print:border-black print:text-black print:bg-white print:max-w-none print:shadow-none print:m-0"
        >
          {/* Subtle Corner Hologram Emblem */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/20 to-transparent pointer-events-none rounded-bl-full print:hidden" />

          {/* Card Header: Brand & Network Badge */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:border-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                CK
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xs tracking-wider text-white print:text-black uppercase">
                  CHAINKIN PASSPORT
                </span>
                <span className="text-[9px] text-slate-400 print:text-slate-600 font-mono">
                  Solana Devnet Living Companion
                </span>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 flex items-center gap-1 print:bg-slate-100 print:text-slate-800 print:border-slate-300">
              <Radio className="w-3 h-3 text-cyan-400 print:text-slate-700" />
              <span>DEVNET VERIFIED</span>
            </div>
          </div>

          {/* Creature Visual Showcase */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative print:bg-slate-50 print:border-slate-200">
            <CreatureAvatar
              species={creature.species}
              evolutionStage={creature.evolutionStage}
              evolutionChoice={creature.evolutionChoice}
              className="w-36 h-36 sm:w-44 sm:h-44"
            />
            <span className="mt-2 text-[10px] text-slate-400 print:text-slate-600 font-mono">
              {speciesMeta.tagline}
            </span>
          </div>

          {/* Creature Identity Title Block */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white print:text-black tracking-tight">
                {creature.name}
              </h1>
              <span className="text-xs text-cyan-400 print:text-cyan-700 font-semibold">
                {speciesMeta.name} {isEvolved && evolvedTitle ? `• ${evolvedTitle}` : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono font-bold text-xs flex items-center gap-1 print:bg-slate-100 print:text-black">
                <Zap className="w-3.5 h-3.5" />
                <span>Lvl {creature.level}</span>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 font-mono text-xs print:bg-slate-100 print:text-black">
                {creature.xp} XP
              </div>
            </div>
          </div>

          {/* Personality Matrix Traits */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 print:text-slate-600">
              <span>On-Chain Personality Matrix</span>
              <span>Authoritative</span>
            </div>
            <TraitBar traits={creature.traits} showDominant={true} />
          </div>

          {/* Progression Summary Data Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800/80 print:border-slate-300">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70 flex flex-col print:bg-slate-50 print:border-slate-200">
              <span className="text-[10px] text-slate-500 print:text-slate-600 uppercase">Evolution Stage</span>
              <strong className="text-white print:text-black text-xs font-semibold">
                {isEvolved ? `Stage 1: ${evolvedTitle}` : "Stage 0 (Base Form)"}
              </strong>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70 flex flex-col print:bg-slate-50 print:border-slate-200">
              <span className="text-[10px] text-slate-500 print:text-slate-600 uppercase">Total Rituals</span>
              <strong className="text-white print:text-black text-xs font-semibold">
                {creature.ritualCount} Confirmed
              </strong>
            </div>
          </div>

          {/* Provenance Block: Owner Wallet & Account PDA */}
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 print:border-slate-300 print:text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Owner:</span>
              </span>
              <span className="text-slate-200 print:text-black font-semibold">
                {creature.owner.slice(0, 8)}...{creature.owner.slice(-8)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>PDA Address:</span>
              <span className="text-slate-200 print:text-black font-semibold">
                {creature.creatureId
                  ? `${creature.creatureId.slice(0, 8)}...${creature.creatureId.slice(-8)}`
                  : "Verified"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Last Action Slot:</span>
              <span className="text-slate-200 print:text-black font-semibold">
                Slot #{creature.lastActionSlot}
              </span>
            </div>
          </div>

          {/* Footer Card Verification Mark */}
          <div className="pt-2 border-t border-slate-800/60 text-center text-[9px] text-slate-500 print:text-slate-600 font-mono print:border-slate-300">
            Chainkin Protocol • Cryptographically Authoritative on Solana Devnet
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatCardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 text-xs font-mono">
          Loading stat card...
        </div>
      }
    >
      <StatCardContent />
    </Suspense>
  );
}
