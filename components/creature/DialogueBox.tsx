"use client";

import React, { FC, useState } from "react";
import { DialogueResponse } from "@/lib/ai/types";
import { CreatureState } from "@/lib/creature/types";
import {
  MessageSquare,
  Brain,
  Sparkles,
  RefreshCw,
  Heart,
  HelpCircle,
  Radio,
  WifiOff,
  Flame,
  Eye,
  AlertCircle,
} from "lucide-react";

export type DialogueActionType = "talk" | "ponder" | "comfort" | "observe";

export interface DialogueBoxProps {
  dialogue: DialogueResponse | null;
  loading?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onInteract?: (action: DialogueActionType) => void;
  creature?: CreatureState;
}

export const DialogueBox: FC<DialogueBoxProps> = ({
  dialogue,
  loading = false,
  isLoading = false,
  error = null,
  onRefresh,
  onInteract,
  creature,
}) => {
  const isBusy = loading || isLoading;
  const [activeAction, setActiveAction] = useState<DialogueActionType | null>(null);

  const handleAction = (action: DialogueActionType) => {
    setActiveAction(action);
    if (onInteract) {
      onInteract(action);
    } else if (onRefresh) {
      onRefresh();
    }
  };

  if (isBusy) {
    return (
      <div className="w-full rounded-3xl bg-slate-900/80 border border-cyan-800/40 p-6 sm:p-8 flex flex-col items-center justify-center min-h-[200px] text-slate-400 gap-3 shadow-xl backdrop-blur-xl animate-pulse">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <Brain className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-sm font-semibold text-slate-200">
            {activeAction === "ponder"
              ? `Attuning to ${creature?.name || "companion"}'s deep reflections...`
              : activeAction === "comfort"
              ? `Channeling warmth to soothe ${creature?.name || "companion"}...`
              : activeAction === "observe"
              ? `Studying ${creature?.name || "companion"}'s ambient posture...`
              : `Listening to ${creature?.name || "companion"}'s consciousness...`}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Synthesizing emotional resonance & narrative dialogue
          </span>
        </div>
      </div>
    );
  }

  if (error && !dialogue) {
    return (
      <div className="w-full rounded-3xl bg-slate-900/85 border border-red-800/50 p-6 flex flex-col items-center justify-center gap-3 shadow-xl text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-200">Dialogue Disrupted</span>
          <span className="text-xs text-red-300 max-w-sm">{error}</span>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reconnect Mind</span>
          </button>
        )}
      </div>
    );
  }

  if (!dialogue) {
    return null;
  }

  const isFallback = dialogue.isFallback;

  return (
    <div className="w-full rounded-3xl bg-slate-900/85 border border-cyan-800/40 p-5 sm:p-6 flex flex-col gap-4 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

      {/* Header Bar: Mood, Mode Indicator, Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        {/* Mood Tag */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Mood:
          </span>
          <span className="text-xs px-3 py-0.5 rounded-full font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            {dialogue.mood}
          </span>
        </div>

        {/* Engine Status & Refresh */}
        <div className="flex items-center gap-2">
          {isFallback ? (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 font-mono"
              title="Creature is communing autonomously via deterministic consensus state while AI engine rests."
            >
              <WifiOff className="w-3 h-3 text-slate-400" />
              Autonomous Meditation
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 font-mono"
              title="Generated live via provider AI engine"
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              Live AI Resonance
            </span>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isBusy}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition disabled:opacity-50 border border-transparent hover:border-slate-700"
              title="Refresh creature thoughts"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Creature Direct Speech */}
      <div className="flex items-start gap-3.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/70">
        <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-600/40 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
            {creature?.name || "Companion"} speaks
          </span>
          <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed italic tracking-normal">
            &ldquo;{dialogue.speech}&rdquo;
          </p>
        </div>
      </div>

      {/* Inner Thought and Narrative Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Internal Thought */}
        <div className="flex items-start gap-3 text-xs text-slate-300 bg-purple-950/30 p-3 rounded-2xl border border-purple-900/40 backdrop-blur-sm">
          <Brain className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 font-mono">
              Inner Mind
            </span>
            <span className="leading-relaxed text-slate-300 italic">{dialogue.thought}</span>
          </div>
        </div>

        {/* Narrative Insight */}
        {dialogue.narrativeInsight ? (
          <div className="flex items-start gap-3 text-xs text-cyan-200/90 bg-cyan-950/30 p-3 rounded-2xl border border-cyan-900/40 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 font-mono">
                Keeper Perception
              </span>
              <span className="leading-relaxed text-slate-300 italic">
                {dialogue.narrativeInsight}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-950/30 p-3 rounded-2xl border border-slate-900">
            <HelpCircle className="w-4 h-4 text-slate-600" />
            <span>Harmonizing with consensus frequency...</span>
          </div>
        )}
      </div>

      {/* Interactive Companion Actions Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 self-start sm:self-center">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Engage Companion:
        </span>

        {/* 4 Interaction Cards: Talk, Ponder, Comfort, Observe */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleAction("talk")}
            disabled={isBusy}
            title="Converse directly with your companion"
            className="py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 bg-slate-950/70 hover:bg-slate-800 text-cyan-300 border-cyan-800/50 hover:border-cyan-500/60 active:scale-95 disabled:opacity-50"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Talk</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("ponder")}
            disabled={isBusy}
            title="Invite deep crypto-philosophical reflection"
            className="py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 bg-slate-950/70 hover:bg-slate-800 text-purple-300 border-purple-900/50 hover:border-purple-500/60 active:scale-95 disabled:opacity-50"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Ponder</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("comfort")}
            disabled={isBusy}
            title="Offer reassurance and empathetic affection"
            className="py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 bg-slate-950/70 hover:bg-slate-800 text-rose-300 border-rose-900/50 hover:border-rose-500/60 active:scale-95 disabled:opacity-50"
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Comfort</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("observe")}
            disabled={isBusy}
            title="Quietly observe creature behavior and demeanor"
            className="py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 bg-slate-950/70 hover:bg-slate-800 text-emerald-300 border-emerald-900/50 hover:border-emerald-500/60 active:scale-95 disabled:opacity-50"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Observe</span>
          </button>
        </div>
      </div>
    </div>
  );
};
