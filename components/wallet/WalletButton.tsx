"use client";

import React, { FC } from "react";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export const WalletButton: FC = () => {
  return (
    <div className="chainkin-wallet-btn">
      <WalletMultiButton className="!bg-gradient-to-r !from-cyan-600 !to-blue-600 hover:!from-cyan-500 hover:!to-blue-500 !text-white !font-medium !rounded-xl !px-4 !py-2 !text-sm !shadow-lg !shadow-cyan-900/30 !transition-all" />
    </div>
  );
};
