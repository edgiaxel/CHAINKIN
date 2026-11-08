"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  CreatureState,
  SPECIES_CATALOG,
  EVOLUTION_CATALOG,
} from "@/lib/creature/types";
import { fetchCreatureAccount } from "@/lib/solana/transactions";
import { CreatureAvatar } from "@/components/creature/CreatureAvatar";
import { isValidSolanaAddress } from "@/lib/ai/rateLimit";
import {
  Layers,
  Sparkles,
  Shield,
  Eye,
  Plus,
  Trash2,
  ExternalLink,
  Zap,
  ArrowRight,
  AlertCircle,
  CreditCard,
  Heart,
  Info,
} from "lucide-react";

interface WatchedCreatureEntry {
  address: string;
  label?: string;
  creature: CreatureState | null;
  loading: boolean;
  error?: string;
}

const STORAGE_KEY_WATCHED_WALLETS = "chainkin_watched_wallets";

export default function CollectionPage() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [activeCreature, setActiveCreature] = useState<CreatureState | null>(null);
  const [loadingActive, setLoadingActive] = useState<boolean>(true);
  const [activeError, setActiveError] = useState<string | null>(null);

  const [watchedWallets, setWatchedWallets] = useState<string[]>([]);
  const [watchedEntries, setWatchedEntries] = useState<WatchedCreatureEntry[]>([]);

  const [newWalletInput, setNewWalletInput] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Load saved watch-only wallets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WATCHED_WALLETS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWatchedWallets(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save watch-only wallets to localStorage
  const saveWatchedWallets = (wallets: string[]) => {
    setWatchedWallets(wallets);
    try {
      localStorage.setItem(STORAGE_KEY_WATCHED_WALLETS, JSON.stringify(wallets));
    } catch {
      // ignore
    }
  };

  // Load active wallet's creature
  const loadActiveCreature = useCallback(async () => {
    if (!wallet.publicKey) {
      setActiveCreature(null);
      setLoadingActive(false);
      return;
    }

    try {
      setLoadingActive(true);
      setActiveError(null);
      const { creature } = await fetchCreatureAccount(wallet.publicKey, connection);
      setActiveCreature(creature);
    } catch (err: any) {
      console.error("Failed to load active creature in collection:", err);
      setActiveError("Could not query creature PDA for active wallet.");
    } finally {
      setLoadingActive(false);
    }
  }, [wallet.publicKey, connection]);

  useEffect(() => {
    loadActiveCreature();
  }, [loadActiveCreature]);

  // Load watched wallets' creatures
  const loadWatchedCreatures = useCallback(async () => {
    if (watchedWallets.length === 0) {
      setWatchedEntries([]);
      return;
    }

    const initial: WatchedCreatureEntry[] = watchedWallets.map((addr) => ({
      address: addr,
      creature: null,
      loading: true,
    }));
    setWatchedEntries(initial);

    const updated = await Promise.all(
      watchedWallets.map(async (addr) => {
        try {
          const pubkey = new PublicKey(addr);
          const { creature } = await fetchCreatureAccount(pubkey, connection);
          return {
            address: addr,
            creature,
            loading: false,
          };
        } catch (err: any) {
          return {
            address: addr,
            creature: null,
            loading: false,
            error: "Failed to read PDA from Devnet",
          };
        }
      })
    );

    setWatchedEntries(updated);
  }, [watchedWallets, connection]);

  useEffect(() => {
    loadWatchedCreatures();
  }, [loadWatchedCreatures]);

  const handleAddWatchedWallet = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);
    const trimmed = newWalletInput.trim();
    if (!trimmed) return;

    if (!isValidSolanaAddress(trimmed)) {
      setInputError("Invalid Solana base58 address. Expected 32-44 characters.");
      return;
    }

    if (wallet.publicKey && trimmed === wallet.publicKey.toBase58()) {
      setInputError("This is already your active signing wallet.");
      return;
    }

    if (watchedWallets.includes(trimmed)) {
      setInputError("This wallet address is already in your watch list.");
      return;
    }

    const next = [...watchedWallets, trimmed];
    saveWatchedWallets(next);
    setNewWalletInput("");
  };

  const handleRemoveWatchedWallet = (addrToRemove: string) => {
    const next = watchedWallets.filter((addr) => addr !== addrToRemove);
    saveWatchedWallets(next);
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-4rem)] px-4 py-8 max-w-5xl mx-auto w-full gap-8">
      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-300">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Companion Collection
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Manage your active Solana companion and watch creatures across multiple wallets on Devnet.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            Total Discovered: <strong>{(activeCreature ? 1 : 0) + watchedEntries.filter(e => e.creature).length}</strong>
          </span>
        </div>
      </div>

      {/* Honest Architecture Notice */}
      <div className="w-full p-4 rounded-2xl bg-slate-900/60 border border-cyan-900/40 text-xs text-slate-300 flex items-start gap-3 shadow-md">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 leading-relaxed">
          <strong className="text-slate-100 font-semibold">
            Solana Architecture Notice: One Creature PDA Per Wallet
          </strong>
          <span className="text-slate-400">
            In Chainkin, each companion is bound to a deterministic Program Derived Address (PDA) derived from{" "}
            <code className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono text-[11px]">
              [b&quot;creature&quot;, owner_pubkey]
            </code>
            . This guarantees strict on-chain single-custody ownership. You can switch between active Solana wallets or add watch-only addresses below to inspect multiple companions.
          </span>
        </div>
      </div>

      {/* Section 1: Active Connected Wallet Creature */}
      <section className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Active Signer Wallet
            </h2>
          </div>
          {wallet.publicKey && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
              {wallet.publicKey.toBase58().slice(0, 6)}...{wallet.publicKey.toBase58().slice(-6)} (Can Sign)
            </span>
          )}
        </div>

        {!wallet.connected && (
          <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 text-center flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">No Active Wallet Connected</span>
            <p className="text-xs text-slate-400 max-w-md">
              Connect your Phantom or Solflare wallet to access and manage your active on-chain companion.
            </p>
          </div>
        )}

        {wallet.connected && loadingActive && (
          <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 text-center flex items-center justify-center gap-3 text-slate-400 text-xs font-mono">
            <div className="w-5 h-5 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <span>Scanning Devnet PDA for active wallet...</span>
          </div>
        )}

        {wallet.connected && !loadingActive && activeError && (
          <div className="p-6 rounded-2xl bg-red-950/50 border border-red-800/60 text-xs text-red-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{activeError}</span>
          </div>
        )}

        {wallet.connected && !loadingActive && !activeCreature && !activeError && (
          <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 text-center flex flex-col items-center gap-3 shadow-lg">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-white">No Companion Awakened Yet</span>
              <p className="text-xs text-slate-400 max-w-sm">
                Your connected wallet does not currently own a Chainkin companion PDA on Solana Devnet.
              </p>
            </div>
            <Link
              href="/creature"
              className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              <span>Awaken Your Companion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {wallet.connected && !loadingActive && activeCreature && (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-cyan-800/50 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-2xl bg-slate-950/80 border border-slate-800">
                <CreatureAvatar
                  species={activeCreature.species}
                  evolutionStage={activeCreature.evolutionStage}
                  evolutionChoice={activeCreature.evolutionChoice}
                  className="w-20 h-20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{activeCreature.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                    Active Signer
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {SPECIES_CATALOG[activeCreature.species].name} •{" "}
                  {activeCreature.evolutionStage > 0 ? "Stage 1 Evolved" : "Stage 0 (Base)"}
                </span>
                <div className="flex items-center gap-2 text-xs font-mono pt-1">
                  <span className="text-cyan-300 font-bold">Lvl {activeCreature.level}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">{activeCreature.xp} XP</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{activeCreature.ritualCount} Rituals</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link
                href="/card"
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Stat Card</span>
              </Link>
              <Link
                href="/creature"
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/40"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Open Companion</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Section 2: Watched / Saved Wallets */}
      <section className="w-full flex flex-col gap-4 pt-4 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Watched Wallets (Read-Only)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            View companions across friends or secondary addresses
          </span>
        </div>

        {/* Add Wallet Form */}
        <form onSubmit={handleAddWatchedWallet} className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            value={newWalletInput}
            onChange={(e) => setNewWalletInput(e.target.value)}
            placeholder="Add Solana wallet address (e.g. 7xK...9qL) to watch"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-xs text-white placeholder-slate-500 outline-none transition font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-700/60 text-xs font-bold text-purple-200 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Watched Wallet</span>
          </button>
        </form>

        {inputError && (
          <span className="text-xs text-red-400 flex items-center gap-1 font-mono">
            <AlertCircle className="w-3.5 h-3.5" />
            {inputError}
          </span>
        )}

        {/* Watched Wallets List */}
        {watchedEntries.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-500">
            No watch-only wallets saved. Enter any Solana Devnet address above to view their companion.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {watchedEntries.map((entry) => (
              <div
                key={entry.address}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col gap-3 shadow-md"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-purple-300">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{entry.address.slice(0, 6)}...{entry.address.slice(-6)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveWatchedWallet(entry.address)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                    title="Remove watched wallet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {entry.loading && (
                  <div className="py-4 text-center text-xs text-slate-500 font-mono">
                    Scanning PDA...
                  </div>
                )}

                {!entry.loading && !entry.creature && (
                  <div className="py-3 text-center text-xs text-slate-500 italic">
                    No companion account found for this wallet on Devnet.
                  </div>
                )}

                {!entry.loading && entry.creature && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CreatureAvatar
                        species={entry.creature.species}
                        evolutionStage={entry.creature.evolutionStage}
                        evolutionChoice={entry.creature.evolutionChoice}
                        className="w-14 h-14"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          {entry.creature.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {SPECIES_CATALOG[entry.creature.species].name} • Lvl {entry.creature.level}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {entry.creature.xp} XP • {entry.creature.ritualCount} Rituals
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/card?wallet=${entry.address}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition flex items-center gap-1"
                    >
                      <CreditCard className="w-3 h-3 text-cyan-400" />
                      <span>Card</span>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
