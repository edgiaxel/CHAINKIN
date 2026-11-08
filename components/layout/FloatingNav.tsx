"use client";

import React, { FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/wallet/WalletButton";
import { Sparkles, Home, Heart, Layers, CreditCard, Settings } from "lucide-react";

export const FloatingNav: FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Companion", href: "/creature", icon: Heart },
    { label: "Collection", href: "/collection", icon: Layers },
    { label: "Stat Card", href: "/card", icon: CreditCard },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-4 z-40 w-full px-4 max-w-5xl mx-auto flex items-center justify-between pointer-events-none print:hidden">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-full bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl text-xs font-medium text-slate-300"
      >
        <Link
          href="/"
          className="flex items-center gap-2 pr-2 sm:pr-3 mr-1 border-r border-slate-800 hover:text-white transition"
          aria-label="Chainkin Home"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-black text-sm tracking-tight text-white hidden sm:inline">
            CHAINKIN
          </span>
        </Link>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-colors ${
                isActive
                  ? "bg-slate-800 text-cyan-300 font-semibold shadow-inner border border-cyan-800/40"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pointer-events-auto shrink-0">
        <WalletButton />
      </div>
    </header>
  );
};
