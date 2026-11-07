import { Connection, clusterApiUrl } from "@solana/web3.js";
import { DEVNET_RPC_URL } from "./pda";

let cachedConnection: Connection | null = null;

export function getSolanaConnection(): Connection {
  if (!cachedConnection) {
    const endpoint = DEVNET_RPC_URL || clusterApiUrl("devnet");
    cachedConnection = new Connection(endpoint, "confirmed");
  }
  return cachedConnection;
}

export function getExplorerUrl(signature: string, cluster: string = "devnet"): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

export function getAddressExplorerUrl(address: string, cluster: string = "devnet"): string {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}
