# Chainkin

**Something alive lives on your chain.**

Chainkin is a wallet-linked digital creature companion. Users hatch a creature, discover its personality, interact with it, complete optional on-chain rituals, and unlock an evolution. AI provides personality and narrative; Solana provides verifiable ownership and progression.

This repository starter contains the product specification and autonomous development instructions. It is intentionally designed for a small, demonstrable Solana Devnet MVP.

## Start here

1. Read `AGENTS.md`.
2. Read `docs/PROJECT_SPEC.md` and `docs/TECHNICAL_ARCHITECTURE.md`.
3. Read `docs/ACCEPTANCE_CRITERIA.md`.
4. Follow `docs/ANTIGRAVITY_RUNBOOK.md` to start the autonomous build.
5. Track work in `.agent-work/TASKS.md` and `.agent-work/PROGRESS.md`.

## Product boundary

The MVP is **one creature per wallet**, a small set of deterministic interactions, an AI personality layer, and one verifiable evolution path. It is not an NFT marketplace, multiplayer game, token, DeFi product, or autonomous wallet agent.

## Network and security

- Solana **Devnet only**.
- No mainnet deployment or mainnet transactions.
- Never request, read, log, transmit, or store a wallet seed phrase/private key.
- Wallet actions must be explicitly signed by the user through their wallet.
- AI must never construct an instruction that bypasses program validation or sign transactions.
- Do not commit `.env` files, secrets, keypairs, or wallet material.

## Naming

`Chainkin` is a working name. Keep branding centralized so it can be renamed without invasive code changes.
