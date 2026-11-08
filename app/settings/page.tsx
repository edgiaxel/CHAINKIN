"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAddressExplorerUrl } from "@/lib/solana/connection";
import {
  Settings,
  Shield,
  Cpu,
  Trash2,
  ExternalLink,
  Check,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

interface SystemStatus {
  ai: {
    provider: string;
    model: string;
    hasKey: boolean;
    dailyBudget: {
      limit: number;
      used: number;
      remaining: number;
    };
    requestsPerMinuteLimit: number;
  };
  solana: {
    cluster: string;
    programId: string;
  };
}

export default function SettingsPage() {
  const wallet = useWallet();

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [historyCleared, setHistoryCleared] = useState<boolean>(false);

  // Load reduced motion preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chainkin_reduced_motion");
      if (stored === "true") {
        setReducedMotion(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    try {
      localStorage.setItem("chainkin_reduced_motion", String(next));
      if (next) {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }
    } catch {
      // ignore
    }
  };

  // Fetch server status (AI daily quota, Solana config, zero secrets exposed)
  useEffect(() => {
    async function loadStatus() {
      try {
        setLoadingStatus(true);
        const res = await fetch("/api/creature/status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch system status:", err);
      } finally {
        setLoadingStatus(false);
      }
    }
    loadStatus();
  }, []);

  const handleClearHistory = () => {
    try {
      // Clear activities in localStorage for all creatures
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("chainkin_activities_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      setHistoryCleared(true);
      setTimeout(() => setHistoryCleared(false), 3000);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-4rem)] px-4 py-8 max-w-4xl mx-auto w-full gap-8">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Settings className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Settings &amp; System Telemetry
            </h1>
            <span className="text-xs text-slate-400">
              Devnet network status, AI quota monitoring, and accessibility preferences.
            </span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Solana Devnet Status */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Solana Devnet Architecture</span>
          </div>

          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">Target Cluster:</span>
              <strong className="text-emerald-400 font-bold uppercase">
                {status?.solana.cluster || "Solana Devnet"}
              </strong>
            </div>

            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Program ID:</span>
                <a
                  href={`https://explorer.solana.com/address/${status?.solana.programId || "DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB"}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 underline"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <span className="text-[11px] text-slate-200 break-all select-all">
                {status?.solana.programId || "DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">Active Wallet:</span>
              <span className="text-slate-200">
                {wallet.publicKey ? (
                  <span className="text-emerald-300 font-bold">
                    {wallet.publicKey.toBase58().slice(0, 6)}...{wallet.publicKey.toBase58().slice(-6)}
                  </span>
                ) : (
                  <span className="text-slate-500">Not connected</span>
                )}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800/80">
            Chainkin only connects to Solana Devnet. Private keys and seed phrases are never accessed or stored.
          </div>
        </div>

        {/* Card 2: AI Provider & Daily Budget Status */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>AI Provider &amp; Daily Budget</span>
            </div>
            {status?.ai.hasKey ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold">
                Live Engine Active
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                Deterministic Fallback
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">Engine / Provider:</span>
              <span className="text-cyan-300 font-bold">{status?.ai.provider || "OpenRouter"}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">Configured Model:</span>
              <span className="text-slate-200">{status?.ai.model || "liquid/lfm-3-1.7b:free"}</span>
            </div>

            <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Daily Safety Budget:</span>
                <span className="text-slate-200 font-bold">
                  {status?.ai.dailyBudget.used ?? 0} / {status?.ai.dailyBudget.limit ?? 35} calls
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((status?.ai.dailyBudget.used ?? 0) /
                          Math.max(1, status?.ai.dailyBudget.limit ?? 35)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400">
                {status?.ai.dailyBudget.remaining ?? 35} calls remaining today (15 calls held in reserve).
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800/80">
            Per-minute rate limit: {status?.ai.requestsPerMinuteLimit ?? 10} requests/minute. Secrets remain strictly server-side.
          </div>
        </div>

        {/* Card 3: Accessibility & Preferences */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Experience &amp; Accessibility</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Reduced Motion</span>
              <span className="text-[11px] text-slate-400">
                Minimize ambient avatar float and transition animations
              </span>
            </div>
            <button
              type="button"
              onClick={toggleReducedMotion}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                reducedMotion ? "bg-cyan-600" : "bg-slate-800"
              }`}
              aria-label="Toggle reduced motion"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  reducedMotion ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed">
            Respects system <code>prefers-reduced-motion</code> media query by default.
          </div>
        </div>

        {/* Card 4: Local Storage & Data Hygiene */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Local Storage Hygiene</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Chainkin stores off-chain narrative dialogue reflections and watched wallet addresses in your browser&apos;s local storage.
          </p>

          <button
            type="button"
            onClick={handleClearHistory}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-rose-950/50 border border-slate-700/80 hover:border-rose-700 text-xs font-semibold text-slate-200 hover:text-rose-200 transition flex items-center justify-center gap-2"
          >
            {historyCleared ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Local Activity History Cleared</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Clear Local Activity History</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* About Footer Section */}
      <div className="w-full p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <strong className="text-slate-200 font-semibold">Chainkin v0.2 MVP</strong>
          <span>Built for the Solana Hackathon. Open-source under MIT License.</span>
        </div>
        <a
          href="https://github.com/edgiaxel/CHAINKIN"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
        >
          <span>GitHub Repository</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
