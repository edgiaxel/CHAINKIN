# Blockers and Human Actions

Record blockers with:
- ID
- Date
- Exact issue
- Evidence/log
- Human action required
- Work that can continue independently

## Open blockers

### B001 — Solana Devnet Public Faucet Rate Limit
- **Date:** 2026-11-07
- **Exact issue:** Public CLI faucet endpoint (`api.devnet.solana.com`) returned rate limit error when requesting automated 1 SOL airdrop.
- **Evidence/log:** `Error: airdrop request failed. This can happen when the rate limit is reached.`
- **Human action required:** Request Devnet SOL via browser at https://faucet.solana.com or web wallet faucet, then run `solana program deploy programs/chainkin/target/deploy/chainkin.so --program-id programs/chainkin/target/deploy/chainkin-keypair.json -u devnet` when deploying live to Devnet.
- **Work that can continue independently:** All frontend, Anchor program compilation, unit tests, integration tests, and production build succeeded independently.

## Human-only actions likely required

- Connect/configure a Devnet wallet in the browser.
- Obtain Devnet SOL from an official faucet (e.g. https://faucet.solana.com).
- Provide an AI provider API key locally if live AI generation is desired (deterministic fallback works fully without it).
- Approve wallet signatures for real Devnet transactions in the browser.
