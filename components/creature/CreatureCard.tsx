"use client";

import React, { FC } from "react";
import {
  CreatureState,
  SPECIES_CATALOG,
  EVOLUTION_CATALOG,
  isEvolutionEligible,
  calculateLevel,
} from "@/lib/creature/types";
import { CreatureAvatar } from "./CreatureAvatar";
import { TraitBar } from "./TraitBar";
import { getAddressExplorerUrl } from "@/lib/solana/connection";
import { Sparkles, ExternalLink, ShieldCheck, ArrowUpRight } from "lucide-react";

interface CreatureCardProps {
  creature: CreatureState;
  onOpenEvolution?: () => void;
}

export const CreatureCard: FC<CreatureCardProps> = ({ creature, onOpenEvolution }) => {
  const speciesMeta = SPECIES_CATALOG[creature.species];
  const isEvolved = creature.evolutionStage > 0;
  const eligible = isEvolutionEligible(creature);

  let evolvedTitle = "";
  if (isEvolved && creature.evolutionChoice > 0) {
    const choiceList = EVOLUTION_CATALOG[creature.species];
    const match = choiceList?.find((c) => c.id === creature.evolutionChoice);
    if (match) {
      evolvedTitle = match.name;
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
  const neededForLevel = nextLevelXp - prevLevelXp;
  const xpPercent = Math.min(100, Math.round((currentLevelProgress / neededForLevel) * 100));

  return (
    <div className="w-full rounded-3xl bg-slate-900/80 border border-cyan-800/40 p-6 sm:p-8 flex flex-col gap-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background glow circle */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: speciesMeta.color }}
      />

      {/* Header Info: Name, Species & On-Chain Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {creature.name}
            </h1>
            {isEvolved && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-600/50 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                {evolvedTitle || "Evolved"}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {speciesMeta.name} • {speciesMeta.tagline}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
            Level {creature.level}
          </span>
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {creature.xp} XP
          </span>
        </div>
      </div>

      {/* Main Creature Showcase */}
      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        <div className="relative group creature-glow">
          <CreatureAvatar
            species={creature.species}
            evolutionStage={creature.evolutionStage}
            evolutionChoice={creature.evolutionChoice}
            className="w-44 h-44 sm:w-52 sm:h-52"
          />
        </div>

        {/* Progression & Stats */}
        <div className="flex-1 flex flex-col gap-4 w-full">
          {/* XP Progress Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-medium">XP Progression to Level {creature.level + 1}</span>
              <span className="font-mono text-slate-300">
                {creature.xp} / {nextLevelXp} XP
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Traits Section */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Core Trait Matrix
            </span>
            <TraitBar traits={creature.traits} />
          </div>

          {/* Evolution eligible prompt */}
          {eligible && !isEvolved && onOpenEvolution && (
            <button
              onClick={onOpenEvolution}
              className="mt-1 w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 flex items-center justify-between shadow-lg shadow-purple-900/30 transition animate-pulse"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-200" />
                Evolution Milestone Ready!
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] underline">
                Transcend <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Info: On-Chain Provenance */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PDA:</span>
          <span className="font-mono text-slate-300">
            {creature.creatureId ? `${creature.creatureId.slice(0, 8)}...${creature.creatureId.slice(-6)}` : "Verified"}
          </span>
          <a
            href={getAddressExplorerUrl(creature.owner)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center ml-1"
            title="View owner account on Solana Explorer"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-3">
          <span>Rituals: {creature.ritualCount}</span>
          <span>Slot: {creature.lastActionSlot}</span>
        </div>
      </div>
    </div>
  );
};
