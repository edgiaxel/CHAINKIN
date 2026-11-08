"use client";

import React, { FC, useState, useMemo } from "react";
import { getExplorerUrl } from "@/lib/solana/connection";
import {
  Activity,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Zap,
  Shield,
  Heart,
  Brain,
  Eye,
  Layers,
  Crown,
  Clock,
  Filter,
  CheckCircle2,
} from "lucide-react";

export type ActivityType = "onchain" | "narrative";
export type OnChainAction = "awaken" | "ritual" | "evolution";
export type NarrativeAction = "talk" | "ponder" | "comfort" | "observe";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  action: OnChainAction | NarrativeAction;
  title: string;
  description: string;
  timestamp: number;
  txSignature?: string;
  details?: {
    xpGained?: number;
    traitsDelta?: [number, number, number, number];
    speech?: string;
    thought?: string;
    mood?: string;
    choiceName?: string;
  };
}

const STORAGE_PREFIX = "chainkin_activity_";

export function loadActivitiesFromStorage(key: string): ActivityItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load activity history from storage:", err);
    return [];
  }
}

export function saveActivityToStorage(key: string, item: ActivityItem): ActivityItem[] {
  if (typeof window === "undefined") return [item];
  try {
    const current = loadActivitiesFromStorage(key);
    // Avoid exact duplicate items with same id
    const filtered = current.filter((c) => c.id !== item.id);
    const updated = [item, ...filtered].slice(0, 50); // Keep last 50 activities
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Failed to save activity history to storage:", err);
    return [];
  }
}

export interface ActivityHistoryProps {
  activities: ActivityItem[];
  creatureName?: string;
  className?: string;
}

export const ActivityHistory: FC<ActivityHistoryProps> = ({
  activities,
  creatureName = "Companion",
  className = "",
}) => {
  const [filter, setFilter] = useState<"all" | "onchain" | "narrative">("all");

  const filteredActivities = useMemo(() => {
    if (filter === "onchain") return activities.filter((a) => a.type === "onchain");
    if (filter === "narrative") return activities.filter((a) => a.type === "narrative");
    return activities;
  }, [activities, filter]);

  const onChainCount = useMemo(
    () => activities.filter((a) => a.type === "onchain").length,
    [activities]
  );
  const narrativeCount = useMemo(
    () => activities.filter((a) => a.type === "narrative").length,
    [activities]
  );

  const formatTimestamp = (ts: number): string => {
    const now = Date.now();
    const diffSec = Math.floor((now - ts) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getActionIcon = (item: ActivityItem) => {
    if (item.type === "onchain") {
      switch (item.action) {
        case "awaken":
          return <Sparkles className="w-4 h-4 text-cyan-400" />;
        case "evolution":
          return <Crown className="w-4 h-4 text-purple-400" />;
        case "ritual":
        default:
          return <Zap className="w-4 h-4 text-amber-400" />;
      }
    } else {
      switch (item.action) {
        case "talk":
          return <MessageSquare className="w-4 h-4 text-cyan-400" />;
        case "ponder":
          return <Brain className="w-4 h-4 text-purple-400" />;
        case "comfort":
          return <Heart className="w-4 h-4 text-rose-400" />;
        case "observe":
        default:
          return <Eye className="w-4 h-4 text-emerald-400" />;
      }
    }
  };

  return (
    <div
      className={`w-full rounded-3xl bg-slate-900/85 border border-cyan-800/40 p-5 sm:p-6 flex flex-col gap-4 shadow-2xl backdrop-blur-xl relative overflow-hidden ${className}`}
    >
      {/* Background ambient gradient glow */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Journey & Activity Log
          </h3>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
            {activities.length} Events
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filter === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({activities.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("onchain")}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
              filter === "onchain"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>On-Chain ({onChainCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("narrative")}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
              filter === "narrative"
                ? "bg-purple-950 text-purple-300 border border-purple-700/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Brain className="w-3 h-3 text-purple-400" />
            <span>Narrative ({narrativeCount})</span>
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2 text-slate-500">
            <Clock className="w-8 h-8 opacity-40 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400">
              No {filter !== "all" ? `${filter} ` : ""}activities recorded yet
            </span>
            <span className="text-[11px] max-w-xs text-slate-500">
              Engage with {creatureName} or complete on-chain rituals to document its evolving journey.
            </span>
          </div>
        ) : (
          filteredActivities.map((item) => {
            const isOnChain = item.type === "onchain";

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl flex flex-col gap-2 transition-all border ${
                  isOnChain
                    ? "bg-slate-950/70 border-emerald-900/30 hover:border-emerald-700/50"
                    : "bg-slate-950/50 border-slate-800/80 hover:border-purple-900/50"
                }`}
              >
                {/* Event Top Bar: Badge, Action, Time, Explorer Link */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                        isOnChain
                          ? "bg-emerald-950/80 border-emerald-600/50"
                          : "bg-purple-950/80 border-purple-600/50"
                      }`}
                    >
                      {getActionIcon(item)}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">
                          {item.title}
                        </span>
                        {isOnChain ? (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                            Solana Devnet
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-medium bg-purple-950 text-purple-300 border border-purple-700/40">
                            AI Narrative
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Devnet explorer link if on-chain */}
                  {isOnChain && item.txSignature && (
                    <a
                      href={getExplorerUrl(item.txSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 transition hover:border-cyan-600"
                      title="Inspect transaction on Solana Devnet Explorer"
                    >
                      <span>Explorer</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                {/* Event Description */}
                <p className="text-xs text-slate-300 leading-relaxed pl-9">
                  {item.description}
                </p>

                {/* Narrative Quote or Trait Deliberation */}
                {item.details && (
                  <div className="ml-9 flex flex-col gap-1.5 text-[11px] pt-1 border-t border-slate-800/60">
                    {item.details.speech && (
                      <p className="text-slate-200 italic font-medium">
                        &ldquo;{item.details.speech}&rdquo;
                      </p>
                    )}
                    {item.details.thought && (
                      <span className="text-slate-400 italic">
                        Thought: {item.details.thought}
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {item.details.mood && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-900 text-cyan-300 border border-cyan-900/60">
                          Mood: {item.details.mood}
                        </span>
                      )}
                      {item.details.xpGained !== undefined && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40">
                          +{item.details.xpGained} XP
                        </span>
                      )}
                      {item.details.choiceName && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40">
                          Form: {item.details.choiceName}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
