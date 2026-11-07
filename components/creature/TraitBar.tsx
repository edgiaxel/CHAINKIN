"use client";

import React, { FC } from "react";
import { Sparkles, Shield, Heart, Cpu } from "lucide-react";

interface TraitBarProps {
  traits: [number, number, number, number];
}

const TRAIT_CONFIG = [
  { name: "Curiosity", icon: Sparkles, color: "bg-sky-400", border: "border-sky-500/30", text: "text-sky-300" },
  { name: "Courage", icon: Shield, color: "bg-amber-400", border: "border-amber-500/30", text: "text-amber-300" },
  { name: "Empathy", icon: Heart, color: "bg-rose-400", border: "border-rose-500/30", text: "text-rose-300" },
  { name: "Ingenuity", icon: Cpu, color: "bg-emerald-400", border: "border-emerald-500/30", text: "text-emerald-300" },
];

export const TraitBar: FC<TraitBarProps> = ({ traits }) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
      {TRAIT_CONFIG.map((config, index) => {
        const val = traits[index] || 0;
        const Icon = config.icon;
        // Visual progress percentage (max reasonable score ~ 50)
        const pct = Math.min(100, Math.round((val / 40) * 100));

        return (
          <div
            key={config.name}
            className={`flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-900/60 border ${config.border} backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={`flex items-center gap-1.5 font-medium ${config.text}`}>
                <Icon className="w-3.5 h-3.5" />
                {config.name}
              </span>
              <span className="font-mono font-bold text-slate-200">{val}</span>
            </div>

            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${config.color} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
