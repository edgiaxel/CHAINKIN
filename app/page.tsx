"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/wallet/WalletButton";
import { CreatureCard } from "@/components/creature/CreatureCard";
import { DialogueBox } from "@/components/creature/DialogueBox";
import { RitualPanel } from "@/components/creature/RitualPanel";
import { HatchModal } from "@/components/creature/HatchModal";
import { EvolutionModal } from "@/components/creature/EvolutionModal";
import { CreatureAvatar } from "@/components/creature/CreatureAvatar";
import { CreatureState, SPECIES_CATALOG, EVOLUTION_CATALOG } from "@/lib/creature/types";
import { fetchCreatureAccount } from "@/lib/solana/transactions";
import { fetchCreatureDialogue } from "@/lib/ai/client";
import { DialogueResponse } from "@/lib/ai/types";
import { Sparkles, Shield, Cpu, Heart, Loader2, Radio } from "lucide-react";

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [creature, setCreature] = useState<CreatureState | null>(null);
  const [loadingCreature, setLoadingCreature] = useState<boolean>(false);
  const [dialogue, setDialogue] = useState<DialogueResponse | null>(null);
  const [loadingDialogue, setLoadingDialogue] = useState<boolean>(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState<boolean>(false);

  // Helper to load creature state from Solana Devnet PDA
  const loadCreature = useCallback(async () => {
    if (!wallet.publicKey) {
      setCreature(null);
      setDialogue(null);
      return;
    }

    try {
      setLoadingCreature(true);
      const { creature: onChainCreature } = await fetchCreatureAccount(
        wallet.publicKey,
        connection
      );
      setCreature(onChainCreature);

      if (onChainCreature) {
        // Load initial greeting/personality
        loadDialogue(onChainCreature, "none");
      }
    } catch (err) {
      console.error("Failed to load creature PDA:", err);
    } finally {
      setLoadingCreature(false);
    }
  }, [wallet.publicKey, connection]);

  // Helper to load AI or deterministic dialogue
  const loadDialogue = async (
    targetCreature: CreatureState,
    ritual: "none" | "observe" | "bond" | "explore"
  ) => {
    try {
      setLoadingDialogue(true);
      const meta = SPECIES_CATALOG[targetCreature.species];
      let evolutionName: string | undefined = undefined;

      if (targetCreature.evolutionStage > 0 && targetCreature.evolutionChoice > 0) {
        const choice = EVOLUTION_CATALOG[targetCreature.species]?.find(
          (c) => c.id === targetCreature.evolutionChoice
        );
        evolutionName = choice?.name;
      }

      const payload: any = {
        species: targetCreature.species,
        speciesName: meta.name,
        name: targetCreature.name,
        level: targetCreature.level,
        xp: targetCreature.xp,
        evolutionStage: targetCreature.evolutionStage,
        evolutionName,
        recentRitual: ritual,
        traits: targetCreature.traits,
        ritualCount: targetCreature.ritualCount,
        walletAddress: targetCreature.owner,
      };

      const res = await fetchCreatureDialogue(payload);
      setDialogue(res);
    } catch (err) {
      console.error("Failed to load dialogue:", err);
    } finally {
      setLoadingDialogue(false);
    }
  };

  const handleCompanionInteract = (action: "talk" | "comfort" | "ponder") => {
    if (!creature) return;
    if (action === "comfort") {
      loadDialogue(creature, "bond");
    } else if (action === "ponder") {
      loadDialogue(creature, "explore");
    } else {
      loadDialogue(creature, "observe");
    }
  };

  useEffect(() => {
    loadCreature();
  }, [loadCreature]);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-4 py-6 sm:px-6 md:px-8 max-w-5xl mx-auto w-full gap-8">
      {/* Navbar Header */}
      <header className="w-full flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-white tracking-tight">CHAINKIN</span>
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider -mt-1">
              On-Chain Companion
            </span>
          </div>
        </div>

        <WalletButton />
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center">
        {/* State 1: Wallet Disconnected */}
        {!wallet.connected && (
          <div className="w-full flex flex-col items-center text-center gap-8 py-8 sm:py-12 max-w-2xl animate-in fade-in duration-500">
            {/* Trio Avatar Showcase */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 float-animation">
              <CreatureAvatar species={0} className="w-20 h-20 sm:w-28 sm:h-28" />
              <CreatureAvatar species={1} className="w-24 h-24 sm:w-32 sm:h-32 -mt-2" />
              <CreatureAvatar species={2} className="w-20 h-20 sm:w-28 sm:h-28" />
            </div>

            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-mono self-center">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Solana Devnet Living Companion</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Something alive lives on your chain.
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
                Chainkin bonds one unique creature to your Solana wallet. Deterministic progression, on-chain rituals, and evolving AI personality.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <WalletButton />
              <span className="text-xs text-slate-500 font-mono">
                Connect on Solana Devnet to awaken your creature.
              </span>
            </div>

            {/* Feature highlights */}
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

        {/* State 2: Wallet Connected & Checking PDA */}
        {wallet.connected && loadingCreature && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold text-slate-200">
                Scanning Solana Devnet...
              </span>
              <span className="text-xs font-mono text-slate-500">
                Checking deterministic creature PDA
              </span>
            </div>
          </div>
        )}

        {/* State 3: Wallet Connected & No Creature -> Hatch Flow */}
        {wallet.connected && !loadingCreature && !creature && (
          <HatchModal
            onHatched={(newCreature) => {
              setCreature(newCreature);
              loadDialogue(newCreature, "none");
            }}
          />
        )}

        {/* State 4: Creature Exists -> Companion Dashboard */}
        {wallet.connected && !loadingCreature && creature && (
          <div className="w-full flex flex-col gap-6 max-w-3xl animate-in fade-in duration-500">
            {/* Creature Stage Card */}
            <CreatureCard
              creature={creature}
              mood={dialogue?.mood}
              onOpenEvolution={() => setShowEvolutionModal(true)}
            />

            {/* AI / Fallback Interactive Dialogue Card */}
            <DialogueBox
              dialogue={dialogue}
              loading={loadingDialogue}
              onRefresh={() => loadDialogue(creature, "observe")}
              onInteract={handleCompanionInteract}
              creature={creature}
            />

            {/* Rituals Panel */}
            <RitualPanel
              creature={creature}
              onStateUpdated={(updated) => setCreature(updated)}
              onObserve={() => loadDialogue(creature, "observe")}
              onRitualCompleted={(ritualName) => loadDialogue(creature, ritualName)}
            />

            {/* Evolution Modal */}
            <EvolutionModal
              creature={creature}
              isOpen={showEvolutionModal}
              onClose={() => setShowEvolutionModal(false)}
              onEvolved={(updated) => {
                setCreature(updated);
                loadDialogue(updated, "none");
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Chainkin • Solana Devnet Hackathon MVP</span>
        <span className="font-mono text-[11px]">
          Authoritative on-chain state • Off-chain narrative AI
        </span>
      </footer>
    </div>
  );
}
