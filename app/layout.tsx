import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { NetworkBanner } from "@/components/wallet/NetworkBanner";
import { FloatingNav } from "@/components/layout/FloatingNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chainkin: Wallet-Linked Digital Companion",
  description: "Something alive lives on your chain. Persistent on-chain companion on Solana Devnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
            <NetworkBanner />
            <FloatingNav />
            <main className="flex-1 flex flex-col">{children}</main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
