"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { CreatureCard } from "@/components/creature/CreatureCard";
import { DialogueBox, DialogueActionType } from "@/components/creature/DialogueBox";
import { RitualPanel } from "@/components/creature/RitualPanel";
import { HatchModal } from "@/components/creature/HatchModal";
import { EvolutionModal } from "@/components/creature/EvolutionModal";
import {
  ActivityHistory,
  ActivityItem,
  loadActivitiesFromStorage,
  saveActivityToStorage,
} from "@/components/creature/ActivityHistory";
import {
  CreatureState,
  SPECIES_CATALOG,
  EVOLUTION_CATALOG,
} from "@/lib/creature/types";
import { fetchCreatureAccount } from "@/lib/solana/transactions";
import { fetchCreatureDialogue } from "@/lib/ai/client";
import { DialogueResponse, DialogueAction } from "@/lib/ai/types";
import {
  Sparkles,
  Radio,
  AlertCircle,
  RefreshCw,
  Layers,
  CreditCard,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export default function CreaturePage() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [creature, setCreature] = useState<CreatureState | null>(null);
  const [loadingCreature, setLoadingCreature] = useState<boolean>(true);
  const [creatureLoadError, setCreatureLoadError] = useState<string | null>(null);

  const [dialogue, setDialogue] = useState<DialogueResponse | null>(null);
  const [loadingDialogue, setLoadingDialogue] = useState<boolean>(false);
  const [dialogueError, setDialogueError] = useState<string | null>(null);

  const [showEvolutionModal, setShowEvolutionModal] = useState<boolean>(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Storage key derived from creature PDA or wallet address
  const storageKey = useMemo(() => {
    if (creature?.creatureId) return creature.creatureId;
    if (wallet.publicKey) return wallet.publicKey.toBase58();
    return "guest";
  }, [creature?.creatureId, wallet.publicKey]);

  // Load activities whenever creature changes
  useEffect(() => {
    if (storageKey && storageKey !== "guest") {
      const stored = loadActivitiesFromStorage(storageKey);
      setActivities(stored);
    }
  }, [storageKey]);

  // Record an activity event
  const logActivity = useCallback(
    (item: ActivityItem) => {
      setActivities((prev) => {
        const filtered = prev.filter((a) => a.id !== item.id);
        const next = [item, ...filtered].slice(0, 50);
        if (storageKey && storageKey !== "guest") {
          saveActivityToStorage(storageKey, item);
        }
        return next;
      });
    },
    [storageKey]
  );

  // Helper to load AI or deterministic dialogue (only on explicit user action)
  const loadDialogue = useCallback(
    async (
      targetCreature: CreatureState,
      ritual: "none" | "observe" | "bond" | "explore",
      action: DialogueAction = "talk",
      overrideMood?: string
    ) => {
      try {
        setLoadingDialogue(true);
        setDialogueError(null);
        const meta = SPECIES_CATALOG[targetCreature.species];
        let evolutionName: string | undefined = undefined;

        if (targetCreature.evolutionStage > 0 && targetCreature.evolutionChoice > 0) {
          const choice = EVOLUTION_CATALOG[targetCreature.species]?.find(
            (c) => c.id === targetCreature.evolutionChoice
          );
          evolutionName = choice?.name;
        }

        const payload = {
          species: targetCreature.species,
          speciesName: meta.name,
          name: targetCreature.name,
          level: targetCreature.level,
          xp: targetCreature.xp,
          evolutionStage: targetCreature.evolutionStage,
          evolutionName,
          action,
          currentMood: overrideMood,
          recentRitual: ritual,
          traits: targetCreature.traits,
          ritualCount: targetCreature.ritualCount,
          walletAddress: targetCreature.owner,
        };

        const res = await fetchCreatureDialogue(payload);
        setDialogue(res);

        // Record narrative interaction in activity log
        if (ritual !== "none" || action !== "talk") {
          const actionLabels: Record<DialogueAction, string> = {
            talk: "Communion with Companion",
            ponder: "Philosophical Pondering",
            comfort: "Emotional Reassurance",
            observe: "Observational Study",
          };

          logActivity({
            id: `narrative-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: "narrative",
            action,
            title: actionLabels[action] || "Dialogue Reflection",
            description: res.narrativeInsight || `${targetCreature.name} attuned its thoughts.`,
            timestamp: Date.now(),
            details: {
              speech: res.speech,
              thought: res.thought,
              mood: res.mood,
            },
          });
        }
      } catch (err: any) {
        console.error("Failed to load dialogue:", err);
        setDialogueError("Could not attune to creature thoughts. Please try again.");
      } finally {
        setLoadingDialogue(false);
      }
    },
    [logActivity]
  );

  // Helper to load creature state from Solana Devnet PDA
  // NOTE: Per spec section 5.2, do NOT call AI model on page load/wallet connect
  const loadCreature = useCallback(async () => {
    if (!wallet.publicKey) {
      setCreature(null);
      setDialogue(null);
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

      // Provide default static initial dialogue state so UI is ready without burning budget
      if (onChainCreature && !dialogue) {
        setDialogue({
          mood: "Observant",
          speech: `*Attuned to your wallet* Ready to commune. Select Talk, Ponder, Comfort, or Observe whenever you wish.`,
          thought: `Resting peacefully within Solana Devnet slot state.`,
          narrativeInsight: `${onChainCreature.name} rests serenely, awaiting your direction.`,
          isFallback: true,
        });
      }
    } catch (err: any) {
      console.error("Failed to load creature PDA:", err);
      setCreatureLoadError(
        err.message || "Failed to scan creature account on Solana Devnet. Please check network connection."
      );
    } finally {
      setLoadingCreature(false);
    }
  }, [wallet.publicKey, connection, dialogue]);

  // Companion interaction trigger: supports talk, ponder, comfort, observe
  const handleCompanionInteract = (action: DialogueActionType) => {
    if (!creature) return;
    if (action === "comfort") {
      loadDialogue(creature, "bond", "comfort");
    } else if (action === "ponder") {
      loadDialogue(creature, "explore", "ponder");
    } else if (action === "observe") {
      loadDialogue(creature, "observe", "observe");
    } else {
      loadDialogue(creature, "none", "talk");
    }
  };

  // On-chain ritual completion callback
  const handleRitualFinished = (ritualName: "bond" | "explore", txSignature?: string) => {
    if (!creature) return;
    const xpReward = ritualName === "bond" ? 30 : 40;
    const ritualTitle = ritualName === "bond" ? "Bond Ritual Completed" : "Explore Ritual Completed";
    const ritualDesc =
      ritualName === "bond"
        ? `Channeled connection into ${creature.name}. +30 XP, +2 Curiosity, +3 Empathy recorded on Devnet.`
        : `Sent ${creature.name} scouting Devnet validator blocks. +40 XP, +3 Courage, +2 Ingenuity recorded on Devnet.`;

    logActivity({
      id: `ritual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "onchain",
      action: "ritual",
      title: ritualTitle,
      description: ritualDesc,
      timestamp: Date.now(),
      txSignature,
      details: {
        xpGained: xpReward,
      },
    });

    loadDialogue(creature, ritualName, ritualName === "bond" ? "comfort" : "ponder");
  };

  // Awakening (Hatch) completion callback
  const handleAwakened = (newCreature: CreatureState, signature?: string) => {
    setCreature(newCreature);

    logActivity({
      id: `awaken-${Date.now()}`,
      type: "onchain",
      action: "awaken",
      title: `Awakened ${newCreature.name}`,
      description: `Bonded a permanent ${SPECIES_CATALOG[newCreature.species].name} companion PDA to wallet on Solana Devnet.`,
      timestamp: Date.now(),
      txSignature: signature,
    });

    loadDialogue(newCreature, "none", "talk");
  };

  // Evolution completion callback
  const handleEvolutionCompleted = (
    updated: CreatureState,
    signature?: string,
    choiceName?: string
  ) => {
    setCreature(updated);

    logActivity({
      id: `evolution-${Date.now()}`,
      type: "onchain",
      action: "evolution",
      title: `Ascended to Stage 1: ${choiceName || "Transcendence"}`,
      description: `${updated.name} completed permanent on-chain evolution milestone on Solana Devnet.`,
      timestamp: Date.now(),
      txSignature: signature,
      details: {
        choiceName,
      },
    });

    loadDialogue(updated, "none", "talk");
  };

  useEffect(() => {
    loadCreature();
  }, [loadCreature]);

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 md:px-8 max-w-5xl mx-auto w-full gap-8">
      {/* Top Breadcrumb & Action bar */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>

        {creature && (
          <div className="flex items-center gap-2">
            <Link
              href="/card"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print Stat Card</span>
            </Link>
            <Link
              href="/collection"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 transition"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Collection</span>
            </Link>
          </div>
        )}
      </div>

      <main className="w-full flex-1 flex flex-col items-center justify-center">
        {/* Wallet Disconnected Prompt */}
        {!wallet.connected && (
          <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-white">Connect Solana Wallet</h2>
              <p className="text-xs text-slate-400">
                Connect your Phantom or Solflare wallet set to Solana Devnet to access your living companion.
              </p>
            </div>
          </div>
        )}

        {/* Loading PDA */}
        {wallet.connected && loadingCreature && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-400 animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Radio className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-base font-bold text-slate-100">
                Scanning Solana Devnet...
              </span>
              <span className="text-xs font-mono text-slate-400">
                Checking creature PDA for {wallet.publicKey?.toBase58().slice(0, 6)}...
              </span>
            </div>
          </div>
        )}

        {/* Error Scanning */}
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

        {/* Not Hatched Yet: Hatch Modal */}
        {wallet.connected && !loadingCreature && !creature && !creatureLoadError && (
          <HatchModal onHatched={handleAwakened} />
        )}

        {/* Active Creature Companion Dashboard */}
        {wallet.connected && !loadingCreature && creature && (
          <div className="w-full flex flex-col gap-6 max-w-4xl animate-in fade-in duration-500">
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
              error={dialogueError}
              onRefresh={() => loadDialogue(creature, "observe", "observe")}
              onInteract={handleCompanionInteract}
              creature={creature}
            />

            {/* Daily Rituals Panel */}
            <RitualPanel
              creature={creature}
              onStateUpdated={(updated) => setCreature(updated)}
              onObserve={() => handleCompanionInteract("observe")}
              onRitualCompleted={handleRitualFinished}
            />

            {/* Activity History Component */}
            <ActivityHistory
              activities={activities}
              creatureName={creature.name}
            />

            {/* Evolution Modal */}
            <EvolutionModal
              creature={creature}
              isOpen={showEvolutionModal}
              onClose={() => setShowEvolutionModal(false)}
              onEvolved={handleEvolutionCompleted}
            />
          </div>
        )}
      </main>

      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Chainkin • Solana Devnet Living Companion</span>
        <span className="font-mono text-[11px]">
          Authoritative on-chain state • Off-chain narrative AI
        </span>
      </footer>
    </div>
  );
}
