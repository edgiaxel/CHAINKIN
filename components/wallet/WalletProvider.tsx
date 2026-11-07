"use client";

import React, { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { DEVNET_RPC_URL } from "@/lib/solana/pda";

// Import standard wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => DEVNET_RPC_URL, []);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  const CompConnectionProvider = ConnectionProvider as unknown as React.ComponentType<{
    endpoint: string;
    children?: ReactNode;
  }>;
  const CompSolanaWalletProvider = SolanaWalletProvider as unknown as React.ComponentType<{
    wallets: any[];
    autoConnect?: boolean;
    children?: ReactNode;
  }>;
  const CompWalletModalProvider = WalletModalProvider as unknown as React.ComponentType<{
    children?: ReactNode;
  }>;

  return (
    <CompConnectionProvider endpoint={endpoint}>
      <CompSolanaWalletProvider wallets={wallets} autoConnect>
        <CompWalletModalProvider>{children}</CompWalletModalProvider>
      </CompSolanaWalletProvider>
    </CompConnectionProvider>
  );
};
