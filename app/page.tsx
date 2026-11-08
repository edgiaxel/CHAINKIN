"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/wallet/WalletButton";
import { CreatureAvatar } from "@/components/creature/CreatureAvatar";
import { TraitBar } from "@/components/creature/TraitBar";
import {
  CreatureState,
  SPECIES_CATALOG,
  SPECIES_IDS,
  SpeciesId,
  EVOLUTION_CATALOG,
} from "@/lib/creature/types";
import { fetchCreatureAccount } from "@/lib/solana/transactions";
import {
  Sparkles,
  Shield,
  Cpu,
  Heart,
  Radio,
  ExternalLink,
  Zap,
  ArrowRight,
  Layers,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Info,
} from "lucide-react";

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [creature, setCreature] = useState<CreatureState | null>(null);
  const [loadingCreature, setLoadingCreature] = useState<boolean>(true);
  const [creatureLoadError, setCreatureLoadError] = useState<string | null>(null);

  // Archetype preview tab state for welcome hero screen (before connecting)
  const [previewSpecies, setPreviewSpecies] = useState<SpeciesId>(SPECIES_IDS.WISP);

  // Load creature state from Solana Devnet PDA when wallet changes
  // NOTE: Does NOT call AI model on page load per section 5.2
  const loadCreature = useCallback(async () => {
    if (!wallet.publicKey) {
      setCreature(null);
      setCreatureLoadError(null);
      setLoadingCreature(false);
      return;
    }

    try {
      setLoadingCreature(true);
      setCreatureLoadError(null);
      const { creature: onChainCreature } = await fetchCreatureAccount(
        wallet.publicKey,
        connection
      );
      setCreature(onChainCreature);
    } catch (err: any) {
      console.error("Failed to load creature PDA:", err);
      setCreatureLoadError(
        err.message || "Failed to scan creature account on Solana Devnet. Please check network connection."
      );
    } finally {
      setLoadingCreature(false);
    }
  }, [wallet.publicKey, connection]);

  useEffect(() => {
    loadCreature();
  }, [loadCreature]);

  const activePreviewMeta = SPECIES_CATALOG[previewSpecies];

  let evolvedTitle = "";
  if (creature && creature.evolutionStage > 0 && creature.evolutionChoice > 0) {
    const choiceList = EVOLUTION_CATALOG[creature.species];
    const match = choiceList?.find((c) => c.id === creature.evolutionChoice);
    if (match) {
      evolvedTitle = match.name;
    }
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 md:px-8 max-w-5xl mx-auto w-full gap-8">
      <main className="w-full flex-1 flex flex-col items-center justify-center">
        {/* ======================================================== */}
        {/* State 1: Wallet Disconnected -> Welcoming Home Screen   */}
        {/* ======================================================== */}
        {!wallet.connected && (
          <div className="w-full flex flex-col items-center text-center gap-10 py-6 sm:py-10 max-w-3xl animate-in fade-in duration-500">
            {/* Header Badge & Title */}
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-mono">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Solana Devnet Living Companion</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Something alive lives on your chain.
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                Chainkin bonds one unique digital entity to your Solana wallet. Authoritative on-chain state, deterministic daily rituals, and responsive AI narrative consciousness.
              </p>
            </div>

            {/* Interactive Archetype Explorer Showcase */}
            <div className="w-full rounded-3xl bg-slate-900/80 border border-slate-800/90 p-5 sm:p-7 flex flex-col gap-6 shadow-2xl backdrop-blur-xl text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    Companion Archetypes
                  </span>
                  <span className="text-xs text-slate-400">
                    Preview the three companion lineages before awakening yours:
                  </span>
                </div>

                {/* Archetype Toggle Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  {(Object.values(SPECIES_CATALOG) as typeof activePreviewMeta[]).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPreviewSpecies(m.id)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                        previewSpecies === m.id
                          ? "bg-slate-800 text-cyan-300 shadow-sm border border-cyan-800/50"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Archetype Showcase Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative">
                  <CreatureAvatar
                    species={previewSpecies}
                    className="w-36 h-36 sm:w-44 sm:h-44"
                    interactive={true}
                  />
                  <span className="mt-2 text-[10px] text-slate-400 font-mono">
                    {activePreviewMeta.tagline}
                  </span>
                </div>

                <div className="md:col-span-7 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white">{activePreviewMeta.name}</h3>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                      Species ID #{activePreviewMeta.id}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activePreviewMeta.description}
                  </p>

                  {/* Base Traits Mini-Grid */}
                  <div className="flex flex-col gap-1.5 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Inherent Base Traits
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-sky-300">
                        <span className="text-[10px] text-slate-500 block">Curiosity</span>
                        <strong className="text-sm">{activePreviewMeta.baseTraits[0]}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-300">
                        <span className="text-[10px] text-slate-500 block">Courage</span>
                        <strong className="text-sm">{activePreviewMeta.baseTraits[1]}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-rose-300">
                        <span className="text-[10px] text-slate-500 block">Empathy</span>
                        <strong className="text-sm">{activePreviewMeta.baseTraits[2]}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300">
                        <span className="text-[10px] text-slate-500 block">Ingenuity</span>
                        <strong className="text-sm">{activePreviewMeta.baseTraits[3]}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Onboarding Journey */}
            <div className="w-full flex flex-col gap-4 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono text-center">
                Three Steps to Companionship
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-white">Link Devnet Wallet</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Connect your Phantom or Solflare wallet set to Solana Devnet. No real funds needed.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-950 text-purple-300 border border-purple-800 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-white">Awaken Companion PDA</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Select your archetype, name it, and bond it deterministically to your address on-chain.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-950 text-amber-300 border border-amber-800 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-white">Nurture &amp; Transcend</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Commune via Talk, Ponder, Comfort, and complete daily rituals to evolve into specialized forms.
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet Connect CTA */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <WalletButton />
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span>Free on Solana Devnet •</span>
                <a
                  href="https://faucet.solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 underline"
                >
                  <span>Need Devnet SOL faucet?</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-8 border-t border-slate-800/80 text-left">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 flex flex-col gap-1.5 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Verifiable On-Chain
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Identity, level, XP, and traits persist directly on a deterministic Solana PDA.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 flex flex-col gap-1.5 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  AI Narrative
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Off-chain AI provides personality and dialogue. Never controls keys or progression.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 flex flex-col gap-1.5 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                  <Heart className="w-4 h-4 text-rose-400" />
                  No Forced Spending
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Free and negligible Devnet fee interactions. Designed for meaningful companionship.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* State 2: Wallet Connected & Scanning PDA                 */}
        {/* ======================================================== */}
        {wallet.connected && loadingCreature && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-400 animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Radio className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-base font-bold text-slate-100">
                Scanning Solana Devnet...
              </span>
              <span className="text-xs font-mono text-slate-400">
                Checking deterministic creature account PDA for {wallet.publicKey?.toBase58().slice(0, 6)}...
              </span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* State 2B: Creature Scanning Error                        */}
        {/* ======================================================== */}
        {wallet.connected && !loadingCreature && creatureLoadError && (
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900/90 border border-red-800/50 flex flex-col items-center text-center gap-3 shadow-2xl">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-slate-100">Solana Devnet Scan Interrupted</h3>
              <p className="text-xs text-red-300 leading-relaxed">{creatureLoadError}</p>
            </div>
            <button
              type="button"
              onClick={loadCreature}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Scanning PDA</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* State 3: Connected & No Creature -> Awakening Empty State */}
        {/* ======================================================== */}
        {wallet.connected && !loadingCreature && !creature && !creatureLoadError && (
          <div className="w-full max-w-lg p-8 rounded-3xl bg-slate-900/90 border border-cyan-800/40 text-center flex flex-col items-center gap-6 shadow-2xl animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                Wallet Connected: {wallet.publicKey?.toBase58().slice(0, 6)}...{wallet.publicKey?.toBase58().slice(-6)}
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Your Chainkin Awaits
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                No creature is currently bound to this address. Awaken your unique on-chain companion on Solana Devnet to begin your journey.
              </p>
            </div>

            <Link
              href="/creature"
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 shadow-xl shadow-cyan-900/30 flex items-center justify-center gap-2 transition text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Begin Awakening Flow</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* ======================================================== */}
        {/* State 4: Connected & Creature Exists -> Home Summary Card */}
        {/* ======================================================== */}
        {wallet.connected && !loadingCreature && creature && (
          <div className="w-full flex flex-col gap-6 max-w-3xl animate-in fade-in duration-500">
            {/* Status Strip: Active Wallet & Network */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Connected Wallet:</span>
                <span className="text-slate-200 font-bold">
                  {creature.owner.slice(0, 6)}...{creature.owner.slice(-6)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-cyan-400">Solana Devnet</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">1 Discovered Companion</span>
              </div>
            </div>

            {/* Creature Home Hero Showcase */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-800/40 flex flex-col sm:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
                <CreatureAvatar
                  species={creature.species}
                  evolutionStage={creature.evolutionStage}
                  evolutionChoice={creature.evolutionChoice}
                  className="w-36 h-36 sm:w-44 sm:h-44"
                />
              </div>

              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {creature.name}
                    </h2>
                    <span className="text-xs text-cyan-400 font-semibold">
                      {SPECIES_CATALOG[creature.species].name} •{" "}
                      {creature.evolutionStage > 0
                        ? `Stage 1: ${evolvedTitle || "Evolved"}`
                        : "Stage 0 (Base Form)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-xs font-bold">
                      Lvl {creature.level}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 font-mono text-xs font-bold">
                      {creature.xp} XP
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                    Personality Matrix
                  </span>
                  <TraitBar traits={creature.traits} showDominant={true} />
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3">
                  <Link
                    href="/creature"
                    className="flex-1 py-3 px-5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 transition shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 text-xs"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Open Companion Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/card"
                    className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Stat Card</span>
                  </Link>

                  <Link
                    href="/collection"
                    className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Collection</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Chainkin • Solana Devnet Living Companion</span>
        <span className="font-mono text-[11px]">
          Authoritative on-chain state • Off-chain narrative AI
        </span>
      </footer>
    </div>
  );
}
