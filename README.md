# Chainkin

> **Something alive lives on your chain.**

Chainkin is a living AI creature companion bound to cryptographic identity on Solana Devnet. Each wallet awakens a single, persistent companion stored inside an authoritative Program Derived Address (PDA).

AI provides conversational intelligence and responsive dialogue; the Solana Anchor program guarantees verifiable ownership, deterministic trait progression, and multi-tier evolution milestones.

---

## Live Links & Demo

- **Live Application:** [https://chainkin.vercel.app](https://chainkin.vercel.app)
- **Solana Devnet Program:** [`DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB`](https://explorer.solana.com/address/DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB?cluster=devnet)
- **Product Demo Video:** `video/out/chainkin-demo.mp4` (Full 90s walkthrough with voiceover, real Devnet footage, and custom score)
- **Demo Thumbnail:** `video/out/thumbnail.png`

---

## The Story: The Blockchain Is Not a Ledger, It Is a Habitat

Web3 gaming and crypto collectibles often treat wallets as cold financial inventories: tokens are bought, flipped, or forgotten in static tables.

Chainkin reverses this relationship:
1. **The Wallet as a Lifeline:** Your wallet key is not just an account number; it seeds the life of an autonomous digital entity. One wallet, one companion.
2. **Deterministic Soul, Fluid Voice:** The creature's core identity—its archetype, level, experience points, four-dimensional trait matrix, and evolution tier—lives immutably on-chain. Meanwhile, an AI engine grants it conversational memory, moods, and contextual thoughts shaped directly by its on-chain stats.
3. **True Permanence:** No off-chain databases store creature progression. If the AI service or frontend disappears tomorrow, your Chainkin still exists intact on the Solana ledger.

---

## Core Experience & User Journey

```
+-------------------+      +--------------------+      +----------------------+
|  1. Awakening     | ---> |  2. Communion      | ---> |  3. On-Chain Rituals |
|  Species Choice   |      |  Dialogue &        |      |  Bond (+30 XP)       |
|  Name & PDA Init  |      |  Observation       |      |  Explore (+40 XP)    |
+-------------------+      +--------------------+      +----------------------+
                                                                  |
                                                                  v
+-------------------+      +--------------------+      +----------------------+
|  5. Stat Card     | <--- |  4. Evolution      | <--- |  XP Threshold Met    |
|  Shareable Canvas |      |  Branching Path    |      |  Level 3 / 100 XP    |
|  PNG Export       |      |  Tier 2 Awakening  |      |  Unlock Ready        |
+-------------------+      +--------------------+      +----------------------+
```

### 1. Awakening (Species Archetypes)
Connect any Solana Devnet wallet (Phantom, Solflare, Backpack). If no creature exists, choose your companion:
- **Cinder Wisp (Id: 0):** A warm flame spirit brimming with fiery enthusiasm and spontaneous curiosity.
- **Circuit Bytebeast (Id: 1):** A machine-code companion driven by logic, precision, and relentless ingenuity.
- **Verdant Mossling (Id: 2):** A tranquil botanical being grounded in empathy, quiet reflection, and patience.

Signing `initialize_creature` seeds a PDA unique to your public key.

### 2. Live Dialogue & Communion
Talk directly to your creature in an interactive modal. The creature responds with custom dialogue generated server-side via OpenRouter AI (or a built-in deterministic fallback engine if offline).
- Creature traits (Empathy, Curiosity, Courage, Ingenuity) and level are injected into the prompt.
- Server-side rate limiter enforces a 35-request daily safety budget to prevent abuse and protect API resources.
- Responses reflect species voice, current mood, and recent ritual history.

### 3. On-Chain Rituals & Progression
- **Observe (Free / Off-chain):** Read your creature's passive thoughts without spending gas.
- **Bond (On-chain Transaction):** Deepen your connection. Awards +30 XP, boosts Empathy and Curiosity, and increments ritual count.
- **Explore (On-chain Transaction):** Send your creature scouting the Devnet wilderness. Awards +40 XP and boosts Courage and Ingenuity.

### 4. Branching Multi-Tier Evolution
When your companion reaches **Level 3 (100 XP)**, the evolution gate unlocks:
- Each species branches into two distinct specialized forms (e.g., Bytebeast -> *Gear Warden* vs. *Synapse Stalker*).
- Evolution requires an explicit on-chain signature verifying level criteria and choice validity.
- Evolution awards +20 bonus to dominant traits and upgrades the creature's visual tier.

### 5. Verified Stat Card
Inspect the full cryptographic provenance of your companion at `/companion/card`. Export a crisp 1200x630 shareable canvas card showing wallet address, PDA, level, species, trait meters, and verified Devnet timestamp.

---

## Technical Architecture

```
                  +----------------------------------------------+
                  |               User Browser                   |
                  |  Next.js 16 App Router + Tailwind CSS        |
                  |  Solana Wallet Adapter (Phantom, Solflare)   |
                  +----------------------------------------------+
                           |                            |
       Devnet Transactions |                            | Server Actions / JSON
       (Signed by Wallet)  |                            | (Protected Routes)
                           v                            v
+------------------------------------+      +-----------------------------------+
|      Solana Devnet Blockchain      |      |        Next.js Route Handlers     |
|                                    |      |                                   |
|  Anchor Program:                   |      |  /api/creature/dialogue           |
|  DzykRWVFpJGr9fuHo...              |      |  /api/creature/status             |
|                                    |      +-----------------------------------+
|  PDA Account:                      |                      |
|  seeds = [b"creature", owner_pubkey|                      | Server-Side Only
|                                    |                      v
|  - species: u8                     |      +-----------------------------------+
|  - level: u8                       |      |     OpenRouter AI Gateway         |
|  - xp: u32                         |      |  (gemini-2.0-flash / fallback)    |
|  - traits: [u8; 4]                 |      |  - Daily Budget Guard (35 req/day)|
|  - evolution_tier: u8              |      |  - Zod Runtime Validation         |
|  - ritual_count: u32               |      +-----------------------------------+
+------------------------------------+
```

### Engineering Invariants
1. **Chain State Authoritative:** Level calculation (`floor(XP / 50) + 1`), trait bounds (`0..=100`), and evolution eligibility are evaluated exclusively by the Anchor Rust program.
2. **Zero Key Exposure:** The application never generates, stores, or handles private keys. All transactions use standard wallet adapters.
3. **AI with Boundaries:** AI generates narrative flavor only. It cannot alter on-chain stats, forge transactions, or bypass cooldowns.
4. **Deterministic Fallbacks:** If external AI APIs fail or budget limits are reached, Chainkin immediately falls back to local procedural dialogue generation without crashing.

---

## Solana Program Specification

- **Program ID:** `DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB`
- **Network:** Solana Devnet
- **PDA Derivation:** `Pubkey::find_program_address(&[b"creature", owner.as_ref()], &program_id)`

### On-Chain Account State
```rust
pub struct CreatureAccount {
    pub owner: Pubkey,          // 32 bytes
    pub species: u8,            // 1 byte (0: Wisp, 1: Bytebeast, 2: Mossling)
    pub name: String,           // 4 + 32 bytes (max 32 chars)
    pub level: u8,              // 1 byte
    pub xp: u32,                // 4 bytes
    pub empathy: u8,            // 1 byte (0-100)
    pub curiosity: u8,          // 1 byte (0-100)
    pub courage: u8,            // 1 byte (0-100)
    pub ingenuity: u8,          // 1 byte (0-100)
    pub evolution_tier: u8,     // 1 byte (0: Base, 1: Tier 1, 2: Tier 2)
    pub evolution_choice: u8,   // 1 byte (Branch choice ID)
    pub ritual_count: u32,      // 4 bytes
    pub created_at: i64,        // 8 bytes (Unix timestamp)
    pub last_interaction: i64,  // 8 bytes (Unix timestamp)
}
```

### Instructions
| Instruction | Parameters | Behavior |
|:---|:---|:---|
| `initialize_creature` | `species: u8`, `name: String` | Validates name length (1-32 chars) and species (0-2). Initializes PDA with base traits. |
| `perform_ritual` | `ritual_id: u8` | 1 = Bond (+30 XP, +empathy, +curiosity). 2 = Explore (+40 XP, +courage, +ingenuity). Recalculates level. |
| `evolve` | `evolution_choice: u8` | Requires level >= 3. Validates species-specific branch path. Grants +20 trait bonuses and sets evolution tier. |

---

## Quality Verification & Test Suite

The repository contains end-to-end verification covering smart contract unit tests, frontend integration tests, daily AI budget limits, and Playwright browser journeys.

### 1. Anchor Program Tests (Rust)
```bash
cargo test --manifest-path programs/chainkin/Cargo.toml
```
*Result: 7/7 tests pass (PDA validation, trait saturating math, evolution criteria, authorization checks).*

### 2. Frontend Unit & Integration Tests (Vitest)
```bash
npm test
```
*Result: 94 passed, 1 skipped across 12 test suites (PDA coder, AI gateway, route handlers, budget limiter).*

### 3. Type Checking & Linter
```bash
npm run typecheck
npm run lint
```
*Result: Zero TypeScript errors in strict mode; clean ESLint.*

### 4. End-to-End Browser Journeys (Playwright)
```bash
npx playwright test
```
*Result: 12/12 passed (Hatching flow, ritual execution, dialogue modal, evolution gating, stat card rendering).*

### 5. Production Build
```bash
npm run build
```
*Result: Optimized Next.js production build ready for deployment.*

---

## Quick Start (Local Setup)

### Prerequisites
- Node.js >= 20.x
- Solana CLI & Anchor 0.30+ (optional, for program re-compilation)
- A Devnet wallet with test SOL (via `solana airdrop 2`)

### 1. Clone & Install
```bash
git clone git@github.com-personal:edgiaxel/CHAINKIN.git
cd CHAINKIN
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB

# Optional AI Provider (defaults to procedural fallback if unset)
AI_PROVIDER=openrouter
AI_API_KEY=your_openrouter_api_key
AI_MODEL=google/gemini-2.0-flash-001
```

### 3. Run Locally
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

---

## Production Deployment

Chainkin is configured for continuous zero-downtime deployment on Vercel:
```bash
npx vercel --prod --yes
```
Build output artifacts are governed by `.vercelignore` to optimize upload size and exclude heavy video rendering dependencies.
