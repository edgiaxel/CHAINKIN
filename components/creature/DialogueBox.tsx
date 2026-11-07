"use client";

import React, { FC } from "react";
import { DialogueResponse } from "@/lib/ai/types";
import { MessageSquare, Brain, Compass, Sparkles, RefreshCw } from "lucide-react";

interface DialogueBoxProps {
  dialogue: DialogueResponse | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const DialogueBox: FC<DialogueBoxProps> = ({ dialogue, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="w-full rounded-2xl bg-slate-900/80 border border-cyan-900/40 p-4 sm:p-5 flex items-center justify-center min-h-[140px] text-slate-400 gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
        <span className="text-sm">Listening to creature resonance...</span>
      </div>
    );
  }

  if (!dialogue) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-cyan-800/40 p-4 sm:p-5 flex flex-col gap-3 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Header bar with Mood and Narrative Badge */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Mood:</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
            {dialogue.mood}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
              dialogue.isFallback
                ? "bg-slate-800 text-slate-400"
                : "bg-indigo-950 text-indigo-300 border border-indigo-700/40"
            }`}
            title={dialogue.isFallback ? "Deterministic narrative fallback" : "Live AI generated narrative"}
          >
            {dialogue.isFallback ? "Deterministic Narrative" : "AI Narrative"}
          </span>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              title="Refresh thoughts"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Creature Direct Speech */}
      <div className="flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
        <p className="text-base text-slate-100 font-medium leading-relaxed italic">
          &ldquo;{dialogue.speech}&rdquo;
        </p>
      </div>

      {/* Internal Thought */}
      <div className="flex items-start gap-3 text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
        <Brain className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
        <span className="leading-snug">
          <strong className="text-slate-300 font-medium">Internal feeling:</strong> {dialogue.thought}
        </span>
      </div>

      {/* Narrative insight */}
      {dialogue.narrativeInsight && (
        <div className="flex items-start gap-2.5 text-xs text-cyan-300/90 italic">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>{dialogue.narrativeInsight}</span>
        </div>
      )}
    </div>
  );
};
