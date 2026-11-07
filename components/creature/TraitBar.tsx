"use client";

import React, { FC, useMemo } from "react";
import { Sparkles, Shield, Heart, Cpu, Crown, Zap } from "lucide-react";

export interface TraitBarProps {
  traits: [number, number, number, number]; // [curiosity, courage, empathy, ingenuity]
  showDominant?: boolean;
  compact?: boolean;
}

interface TraitMeta {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  border: string;
  borderActive: string;
  text: string;
  bgActive: string;
  source: string;
  tagline: string;
}

const TRAIT_CONFIG: TraitMeta[] = [
  {
    name: "Curiosity",
    icon: Sparkles,
    color: "bg-sky-400",
    gradient: "from-sky-500 to-cyan-400",
    border: "border-sky-500/20",
    borderActive: "border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]",
    text: "text-sky-300",
    bgActive: "bg-sky-950/40",
    source: "Boosted by Bond (+2)",
    tagline: "Drive to uncover hidden patterns and anomaly logs",
  },
  {
    name: "Courage",
    icon: Shield,
    color: "bg-amber-400",
    gradient: "from-amber-500 to-yellow-400",
    border: "border-amber-500/20",
    borderActive: "border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
    text: "text-amber-300",
    bgActive: "bg-amber-950/40",
    source: "Boosted by Explore (+3)",
    tagline: "Fortitude when navigating turbulent validator slots",
  },
  {
    name: "Empathy",
    icon: Heart,
    color: "bg-rose-400",
    gradient: "from-rose-500 to-pink-400",
    border: "border-rose-500/20",
    borderActive: "border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]",
    text: "text-rose-300",
    bgActive: "bg-rose-950/40",
    source: "Boosted by Bond (+3)",
    tagline: "Resonance with the keeper's intent and harmony",
  },
  {
    name: "Ingenuity",
    icon: Cpu,
    color: "bg-emerald-400",
    gradient: "from-emerald-500 to-teal-400",
    border: "border-emerald-500/20",
    borderActive: "border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
    text: "text-emerald-300",
    bgActive: "bg-emerald-950/40",
    source: "Boosted by Explore (+2)",
    tagline: "Capacity to synthesize new cryptographic concepts",
  },
];

const AFFINITY_TITLES: Record<number, { title: string; subtitle: string }> = {
  0: { title: "Inquisitive Seeker", subtitle: "Ledger-wide curiosity dominates its consciousness" },
  1: { title: "Unyielding Vanguard", subtitle: "Undaunted by chaotic forks and validator turbulence" },
  2: { title: "Harmonic Resonator", subtitle: "Deep empathetic bond channels keeper intent" },
  3: { title: "Master Artificer", subtitle: "Sharp architectural intellect unravels raw compute" },
};

export const TraitBar: FC<TraitBarProps> = ({ traits, showDominant = true, compact = false }) => {
  // Determine dominant trait index
  const { dominantIndex, isBalanced } = useMemo(() => {
    let maxVal = -1;
    let maxIdx = 0;
    let equalCount = 0;

    traits.forEach((val, idx) => {
      if (val > maxVal) {
        maxVal = val;
        maxIdx = idx;
        equalCount = 1;
      } else if (val === maxVal) {
        equalCount++;
      }
    });

    return {
      dominantIndex: maxIdx,
      isBalanced: equalCount === 4,
    };
  }, [traits]);

  const dominantMeta = TRAIT_CONFIG[dominantIndex];
  const affinity = AFFINITY_TITLES[dominantIndex];

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {showDominant && !compact && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">Personality Affinity:</span>
            <span className={`font-bold ${isBalanced ? "text-cyan-300" : dominantMeta.text}`}>
              {isBalanced ? "Balanced Harmony" : affinity.title}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            {isBalanced ? "All traits in equilibrium" : affinity.subtitle}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full">
        {TRAIT_CONFIG.map((config, index) => {
          const val = traits[index] || 0;
          const Icon = config.icon;
          const isDominant = !isBalanced && index === dominantIndex;
          // Percentage against a soft cap target of 40 for visual scaling
          const pct = Math.min(100, Math.round((val / 40) * 100));

          return (
            <div
              key={config.name}
              className={`relative flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                isDominant
                  ? `${config.bgActive} ${config.borderActive}`
                  : `bg-slate-900/60 ${config.border} hover:border-slate-700`
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`flex items-center gap-1.5 font-semibold ${config.text}`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="tracking-tight">{config.name}</span>
                  {isDominant && (
                    <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-slate-900/90 text-amber-300 border border-amber-400/40 font-mono uppercase">
                      <Zap className="w-2.5 h-2.5" />
                      Affinity
                    </span>
                  )}
                </span>
                <span className="font-mono font-bold text-slate-100 text-sm">{val}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden p-[1px]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Source hint */}
              {!compact && (
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                  <span className="truncate">{config.source}</span>
                  <span>{pct}% cap</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
