"use client";

import React, { FC, useMemo } from "react";
import {
  CreatureState,
  SPECIES_CATALOG,
  EVOLUTION_CATALOG,
  isEvolutionEligible,
} from "@/lib/creature/types";
import { CreatureAvatar } from "./CreatureAvatar";
import { TraitBar } from "./TraitBar";
import { getAddressExplorerUrl } from "@/lib/solana/connection";
import {
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
  Zap,
  Activity,
  Layers,
} from "lucide-react";

export interface CreatureCardProps {
  creature: CreatureState;
  mood?: string;
  onOpenEvolution?: () => void;
}

export const CreatureCard: FC<CreatureCardProps> = ({
  creature,
  mood,
  onOpenEvolution,
}) => {
  const speciesMeta = SPECIES_CATALOG[creature.species];
  const isEvolved = creature.evolutionStage > 0;
  const eligible = isEvolutionEligible(creature);

  let evolvedTitle = "";
  let evolvedSubtitle = "";
  if (isEvolved && creature.evolutionChoice > 0) {
    const choiceList = EVOLUTION_CATALOG[creature.species];
    const match = choiceList?.find((c) => c.id === creature.evolutionChoice);
    if (match) {
      evolvedTitle = match.name;
      evolvedSubtitle = match.title;
    }
  }

  // Level thresholds: L1 (0-39), L2 (40-99), L3 (100-199), L4 (200+)
  let nextLevelXp = 40;
  let prevLevelXp = 0;
  if (creature.level === 2) {
    prevLevelXp = 40;
    nextLevelXp = 100;
  } else if (creature.level === 3) {
    prevLevelXp = 100;
    nextLevelXp = 200;
  } else if (creature.level >= 4) {
    prevLevelXp = 200;
    nextLevelXp = 300;
  }

  const currentLevelProgress = Math.max(0, creature.xp - prevLevelXp);
  const neededForLevel = Math.max(1, nextLevelXp - prevLevelXp);
  const xpPercent = Math.min(100, Math.round((currentLevelProgress / neededForLevel) * 100));

  return (
    <div className="w-full rounded-3xl bg-slate-900/85 border border-cyan-800/40 p-5 sm:p-8 flex flex-col gap-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: speciesMeta.color }}
      />

      {/* Header Info: Name, Stage, Species & Level/XP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {creature.name}
            </h1>

            {isEvolved ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950/90 text-purple-200 border border-purple-500/60 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Stage 1: {evolvedTitle || "Evolved"}</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                Stage 0 (Awakening)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{speciesMeta.name}</span>
            <span>•</span>
            <span>{isEvolved && evolvedSubtitle ? evolvedSubtitle : speciesMeta.tagline}</span>
          </div>
        </div>

        {/* Level & XP Badges */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 shadow-sm flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Level {creature.level}
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-950 text-slate-200 border border-slate-700/80 shadow-sm">
            {creature.xp} XP
          </span>
        </div>
      </div>

      {/* Main Showcase: Avatar + Progression & Traits */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Avatar Presentation Column */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 relative group">
          <div className="creature-glow">
            <CreatureAvatar
              species={creature.species}
              evolutionStage={creature.evolutionStage}
              evolutionChoice={creature.evolutionChoice}
              mood={mood}
              className="w-44 h-44 sm:w-52 sm:h-52"
              interactive={true}
            />
          </div>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Harmonized with Devnet</span>
          </div>
        </div>

        {/* Stats & Progression Column */}
        <div className="md:col-span-7 flex flex-col gap-4 w-full">
          {/* XP Progress Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">
                Level {creature.level} Progression
              </span>
              <span className="font-mono text-slate-400">
                {creature.xp} / {nextLevelXp} XP ({xpPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-700"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Personality Traits Showcase */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                Personality Matrix
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Authoritative On-Chain</span>
            </div>
            <TraitBar traits={creature.traits} showDominant={true} />
          </div>

          {/* Evolution eligible prompt */}
          {eligible && !isEvolved && onOpenEvolution && (
            <button
              onClick={onOpenEvolution}
              className="mt-1 w-full py-3 px-4 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 flex items-center justify-between shadow-xl shadow-purple-950/50 transition-all duration-300 animate-pulse border border-purple-400/30"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Evolution Milestone Ready!</span>
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] underline">
                Transcend Form <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Info: On-Chain Provenance & Slot Tracking */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium text-slate-400">Account PDA:</span>
          <span className="font-mono text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {creature.creatureId
              ? `${creature.creatureId.slice(0, 6)}...${creature.creatureId.slice(-6)}`
              : "Verified"}
          </span>
          <a
            href={getAddressExplorerUrl(creature.owner)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition ml-1"
            title="View owner account on Solana Explorer"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-4 text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Rituals: <strong className="text-slate-200">{creature.ritualCount}</strong>
          </span>
          <span>
            Slot: <strong className="text-slate-200">{creature.lastActionSlot}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
