# Chainkin

**Something alive lives on your chain.**

Chainkin is a wallet-linked digital creature companion on Solana Devnet. Each wallet can awaken one companion stored on a deterministic Program Derived Address (PDA). AI generates narrative flavor, personality, and dialogue; Solana records verifiable ownership, XP progression, deterministic trait progression, and evolution milestones.

---

## Architecture & Principles

1. **Chain is Authoritative:** Identity, species, level, XP, traits, and evolution are strictly recorded in the Anchor on-chain program PDA (`[b"creature", owner_pubkey]`).
2. **AI with Boundaries:** Server-side AI generates personality and flavor text only. AI never controls wallet keys, cannot sign transactions, and cannot fabricate progression.
3. **Deterministic Fallbacks:** The companion functions fully without external AI API keys or network dependencies.
4. **Devnet Only:** Targets Solana Devnet for safe, zero-cost experimentation.

---

## Quick Start

### 1. Prerequisites
- Node.js >= 20
- Rust & Cargo (if modifying/compiling Anchor program)
- Solana CLI (optional, for direct deployment)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Key configuration values:
- `NEXT_PUBLIC_SOLANA_CLUSTER=devnet`
- `NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com`
- `NEXT_PUBLIC_PROGRAM_ID=DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB`
- `AI_PROVIDER=fallback` (or `openai`, `groq`, `openrouter`)
- `AI_API_KEY=` (optional server-only key for live AI generation)

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Quality Verification

### Run Automated Tests
```bash
npm test
```
Executes domain logic, PDA coder, and end-to-end integration test suites via Vitest.

### Run Typecheck & Lint
```bash
npm run typecheck
npm run lint
```

### Run Production Build
```bash
npm run build
```

### Anchor / Rust Program Verification
```bash
cargo test --manifest-path programs/chainkin/Cargo.toml
cargo-build-sbf --manifest-path programs/chainkin/Cargo.toml
```

---

## Solana Program Details

- **Program ID:** `DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB`
- **PDA Seed:** `[b"creature", owner_pubkey]`
- **Instructions:**
  - `initialize_creature(species_id, name)`: Validates species (0: Wisp, 1: Bytebeast, 2: Mossling), sets deterministic base traits, creates PDA.
  - `perform_ritual(ritual_id)`: Applies deterministic XP and trait deltas (1: Bond [+30 XP, +curiosity, +empathy], 2: Explore [+40 XP, +courage, +ingenuity]), increments ritual counter, recalculates level.
  - `evolve(evolution_choice)`: Validates level threshold (Level >= 3 or XP >= 100), validates allowlisted evolution choice for the species, updates evolution stage and grants bonus traits.

### Program Deployment on Devnet
```bash
solana program deploy programs/chainkin/target/deploy/chainkin.so \
  --program-id programs/chainkin/target/deploy/chainkin-keypair.json \
  -u devnet
```

---

## Demo Walkthrough

1. **Connect Devnet Wallet:** Connect Phantom or Solflare set to Devnet.
2. **Hatch Chainkin:** Choose archetype (Wisp, Bytebeast, or Mossling) and enter a name. Sign the Devnet transaction.
3. **Inspect On-Chain State:** See verified PDA, level 1, starting XP, and archetype traits.
4. **Perform Rituals:**
   - **Observe:** Free off-chain reading that generates fresh AI or deterministic thoughts.
   - **Bond:** On-chain transaction awarding +30 XP and empathy/curiosity progression.
   - **Explore:** On-chain transaction awarding +40 XP and courage/ingenuity progression.
5. **Unlock Evolution:** Upon reaching Level 3 / 100 XP, choose between two species-specific evolution paths and sign the evolution transaction.
