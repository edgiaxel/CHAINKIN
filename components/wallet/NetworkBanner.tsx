"use client";

import React, { FC } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { CLUSTER_NAME } from "@/lib/solana/pda";
import { AlertCircle, ExternalLink, Zap } from "lucide-react";

export const NetworkBanner: FC = () => {
  const { connected } = useWallet();

  return (
    <div className="w-full bg-slate-900/90 border-b border-cyan-900/40 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-slate-200 uppercase tracking-wider">
          Network: {CLUSTER_NAME}
        </span>
        <span className="text-slate-400 hidden sm:inline">
          • Real Devnet transactions only. No mainnet funds used.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://faucet.solana.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Get Devnet SOL</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
      </div>
    </div>
  );
};
