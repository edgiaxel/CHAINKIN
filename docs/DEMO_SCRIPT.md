# Chainkin — Hackathon Evaluator End-to-End Demo Script

> **Solana Hackathon MVP Demonstration Guide**  
> **Network:** Solana Devnet (`api.devnet.solana.com`)  
> **Smart Contract (Anchor Program ID):** `DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB`  
> **Application Target:** Living AI-Powered On-Chain Companion

---

## 1. Executive Summary for Evaluators

**Chainkin** is an on-chain digital companion living directly on Solana Devnet. Unlike traditional web3 games or NFT collections that treat metadata as static JSON on IPFS or centralize gameplay logic on off-chain servers:
1. **Blockchain State is Authoritative:** Every creature's identity, level, XP, personality traits, and evolution stage are computed and stored directly on a deterministic Program Derived Address (PDA) on Solana Devnet.
2. **True Wallet-Adapter Security:** Zero private keys or seed phrases are handled by the application. Every state transition is signed securely by the user's browser wallet (Phantom, Solflare, or Backpack).
3. **Responsive Off-Chain AI Consciousness:** An intelligent narrative engine (Liquid LFM3 1.7B via OpenRouter) reads on-chain state, species cadence, and keeper interactions to synthesize unique dialogue, inner thoughts, and keeper perceptions.
4. **Resilient Autonomous Meditation Fallback:** If the AI provider is rate-limited (HTTP 429), times out, or runs offline, a deterministic species-aware and trait-aware fallback matrix ensures zero immersion breaks.
5. **No Forced Tokenomics:** No speculative tokens, no staking, no marketplace, no breeding traps. Focused purely on authentic human-companion emotional resonance.

---

## 2. Prerequisites & Environment Setup

Before starting the evaluation, prepare the following:

### A. Evaluator Requirements
- **Browser:** Google Chrome, Brave, or Firefox.
- **Solana Wallet Extension:** [Phantom](https://phantom.app/), [Solflare](https://solflare.com/), or [Backpack](https://backpack.app/).
- **Network Setting:** In your wallet extension settings, switch network to **Solana Devnet**.
- **Devnet SOL:** Ensure your wallet has at least `0.05 Devnet SOL` for account rent and transaction fees.
  - *Devnet Faucet:* Request free Devnet SOL at [faucet.solana.com](https://faucet.solana.com) or [solfaucet.com](https://solfaucet.com).

### B. Launching the Application
From the repository root directory (`/home/axel/Development/CHAINKIN`):
```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Run the Next.js development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 3. Step-by-Step Evaluator Walkthrough

### Step 1: Landing Experience & Architecture Walkthrough (Disconnected View)
- **Goal:** Experience the welcome hero, understand the concept, and preview companion archetypes.
- **Action:** Open `http://localhost:3000` with wallet disconnected.
- **Observations:**
  1. **Header Banner:** Confirms Solana Devnet cluster status and clean wallet connection trigger.
  2. **Hero Presentation:** Clear value proposition: *"Something alive lives on your chain."*
  3. **Archetype Explorer Showcase:**
     - Click between the tabs: **Wisp**, **Bytebeast**, and **Mossling**.
     - Notice the custom generative SVG avatars, unique taglines, and distinct base traits:
       - *Wisp:* High Curiosity (12) & Empathy (10). Celestial, intuitive starlight creature.
       - *Bytebeast:* High Courage (12) & Ingenuity (10). Clock-cycle, telemetry-driven construct.
       - *Mossling:* High Empathy (13) & Courage (8). Earthy, ancient symbiotic guardian.
  4. **3-Step Onboarding Guide:** Clear instructions for Devnet wallet linkage, awakening, and progression.
  5. **Direct Faucet Link:** Quick link to `faucet.solana.com` if Devnet SOL is needed.

---

### Step 2: First-Time User Awakening (Hatch Modal)
- **Goal:** Awaken a unique companion PDA deterministically bonded to your Solana wallet.
- **Action:**
  1. Click **"Select Wallet"** in the top navigation bar.
  2. Choose your wallet (e.g. Phantom or Solflare).
  3. The application scans Solana Devnet for your wallet's creature PDA: `seeds = [b"creature", owner.pubkey]`.
  4. Detecting no existing creature, the **First-Time Awakening Modal** opens automatically.
  5. Select an Archetype (e.g., **Wisp** or **Bytebeast**).
  6. Enter a name (e.g., `Lumis` or `Nova`, max 32 characters).
  7. Click **"Awaken [Species Name]"**.
  8. Your wallet extension prompts for a transaction approval:
     - Program: `DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB`
     - Instruction: `initialize_creature`
  9. Click **Approve**.
- **Observations:**
  - UI displays dynamic transaction states: *Signing -> Confirming on Devnet -> Confirmed*.
  - A Solana Devnet Explorer link is generated directly to inspect the confirmed block.

---

### Step 3: Companion Dashboard & Authoritative On-Chain State
- **Goal:** Verify that blockchain state is fully authoritative and accurately displayed.
- **Observations on Dashboard:**
  1. **Creature Card:**
     - Displays Creature Name, Level 1, 0 XP, Stage 0 (Awakening).
     - **Personality Matrix:** Displays 4 core traits (Curiosity, Courage, Empathy, Ingenuity) derived from on-chain account data.
     - **Dominant Trait Resonance:** Visual indicator highlighting the creature's highest trait.
     - **Account PDA Badge:** Shows the truncated PDA address with a direct link to the Solana Devnet Explorer.
     - **Slot Tracker:** Displays the exact Solana slot of the last on-chain action.
  2. **Dialogue Box:**
     - Greeting automatically generates reflecting the creature's fresh awakening, species archetype, and base traits.
     - Mood badge displays current emotional state (e.g., *Inquisitive*, *Calm*, *Alert*).
     - Engine status indicator displays **"Live AI Resonance"** (or **"Autonomous Meditation"** if API keys are unset).

---

### Step 4: AI Companion Interaction Matrix (Talk, Ponder, Comfort, Observe)
- **Goal:** Experience context-aware creature dialogue and distinct interaction modes.
- **Action:** Test all four interaction buttons at the bottom of the Dialogue Box:
  1. **Click "Talk":**
     - Creature engages in companionable conversation reflecting its species cadence and current mood.
     - Displays direct speech in quotes, internal thought, and keeper perception insight.
  2. **Click "Ponder":**
     - Creature enters deep contemplation on the Solana ledger, consensus permanence, and cryptographic time.
  3. **Click "Comfort":**
     - Offers gentle empathy, soothing reassurance, and emotional bonding.
  4. **Click "Observe":**
     - Performs a free environmental observation of validator traffic and ambient energy without requiring an on-chain transaction.
- **Observations:**
  - Notice the loading state with animated mind attunement spinner and action-specific status text.
  - Notice the responses are not generic — Wisp speaks of starlight and celestial frequencies, Bytebeast speaks of bytecode and telemetry, and Mossling speaks of deep root systems.

---

### Step 5: On-Chain Daily Ritual Progression & State Evolution
- **Goal:** Execute on-chain progression rituals, earn XP, and recalculate levels on-chain.
- **Action:**
  1. **Perform "Bond" Ritual:**
     - Click **"Bond (+30 XP)"** in the Daily Rituals panel.
     - Wallet extension prompts for signature (`perform_ritual`, ritual ID: 1).
     - Click **Approve**.
     - UI transitions: *Signing -> Confirming -> Ritual confirmed on-chain!*.
     - **Inspect Changes:**
       - Creature XP increments to `30 / 40 XP`.
       - Traits update on-chain: Curiosity +2, Empathy +3.
       - Dialogue updates immediately with a ritual acknowledgment.
       - Activity log records the on-chain transaction with a Devnet Explorer link.
  2. **Perform "Explore" Ritual:**
     - Click **"Explore (+40 XP)"** in the Daily Rituals panel.
     - Wallet extension prompts for signature (`perform_ritual`, ritual ID: 2).
     - Click **Approve**.
     - **Inspect Changes:**
       - Creature XP increments to `70 XP`.
       - **Level Progression Trigger:** Because `xp >= 40`, creature level automatically advances from **Level 1 to Level 2**!
       - Traits update on-chain: Courage +3, Ingenuity +2.
  3. **Reach Evolution Threshold:**
     - Click **"Explore (+40 XP)"** once more and approve the transaction.
     - **Inspect Changes:**
       - Total XP reaches `110 XP`.
       - Because `xp >= 100`, creature level automatically advances to **Level 3**!
       - The evolution milestone tracker announces: **"Requirements Met!"**.
       - A glowing purple celebration button appears: **"Evolution Milestone Ready! Transcend Form"**.

---

### Step 6: Evolutionary Ascension (Transcendence Modal & Celebration Screen)
- **Goal:** Permanently evolve the creature into a specialized Stage 1 form on Solana Devnet.
- **Action:**
  1. Click **"Transcend Form"** (or **"Evolution Milestone Ready!"**).
  2. The **Transcendence Modal** opens, presenting two evolutionary ascension branches:
     - *For Wisp:* **Astral Guide** (Celestial beacon) vs. **Chrono Phantom** (Time weaver).
     - *For Bytebeast:* **Cyber Warden** (Fortified defense) vs. **Spark Overdrive** (Max telemetry).
     - *For Mossling:* **Elder Arbor** (Ancient canopy) vs. **Bloom Weaver** (Symbiotic flora).
  3. Click between Choice A and Choice B:
     - Notice the animated evolved avatar preview.
     - Review the permanent trait bonuses (e.g., `+5 Cur, +2 Cou, +8 Emp, +3 Ing`).
     - Notice the upfront Solana Devnet transaction explanation.
  4. Select your preferred branch and click **"Ascend as [Choice Name]"**.
  5. Wallet extension prompts for transaction signature (`evolve`, choice ID: 1 or 2).
  6. Click **Approve**.
- **Observations:**
  - Multi-stage progress: *Signing -> Confirming on Devnet -> Celebration View*.
  - **Cosmic Celebration Screen:**
    - Animated evolved avatar bathed in cosmic aura glow.
    - Proclamation speech generated by AI narrative engine.
    - Evolutionary transformation summary.
    - Link to view the evolution transaction on Solana Explorer.
  7. Click **"Return to Companion Dashboard"**:
     - Creature Card now displays **"Stage 1: [Evolved Title]"**.
     - Avatar updates to the evolved visual representation.
     - Trait matrix reflects the permanent evolution bonuses.

---

### Step 7: Activity History & Blockchain Ledger Audit
- **Goal:** Verify clear separation between blockchain transactions and narrative events.
- **Action:** Scroll to the **Journey & Activity Log** at the bottom of the dashboard.
- **Observations:**
  1. **Filter Tabs:**
     - **"All"**: Shows complete chronological history.
     - **"On-Chain"**: Displays only blockchain transactions (Awaken, Bond, Explore, Evolution) with verified Solana Devnet Explorer links, transaction hashes, and XP deltas.
     - **"Narrative"**: Displays AI conversations, philosophical ponderings, and keeper perceptions with speech quotes and thoughts.
  2. **Persistence:** History persists across sessions using localized creature PDA storage.

---

### Step 8: Returning User Flow & Devnet Ledger Authoritativeness
- **Goal:** Verify that returning wallets immediately load their creature without desynchronization.
- **Action:**
  1. Disconnect your wallet (or perform a hard refresh `Ctrl+F5` / `Cmd+R`).
  2. The application returns to the clean Welcome Hero view.
  3. Click **"Select Wallet"** and reconnect the same wallet.
- **Observations:**
  - PDA scanner immediately locates the existing `Creature` account on Devnet.
  - Zero desynchronization: Creature name, species, Stage 1 evolution, Level 3, 110 XP, traits, and last action slot are loaded directly from the Solana Devnet blockchain.
  - Dialogue resumes with a greeting acknowledging the evolved companion form.

---

### Step 9: Edge Cases, Security & Error Handling Verification
- **Goal:** Verify graceful degradation and strict security boundaries.
- **Action & Verifications:**
  1. **Transaction Cancellation:**
     - Trigger any ritual (e.g. Bond) and click **"Reject"** in your wallet extension.
     - Verify UI displays a friendly alert: *"Transaction signature was cancelled in wallet."* No crash occurs.
  2. **Rate Limiting & Offline AI Fallback:**
     - If the OpenRouter API key is unavailable or rate-limited (HTTP 429), dialogue seamlessly uses the built-in deterministic matrix (`lib/ai/fallback.ts`).
     - Badge displays **"Autonomous Meditation"**, preserving companion immersion without error modals.
  3. **Strict Network Isolation:**
     - Inspect all network requests in DevTools: all RPC calls target `https://api.devnet.solana.com`. No mainnet endpoints are queried.
  4. **Private Key Hygiene:**
     - The application never asks for, handles, or stores private keys or seed phrases. All signatures are handled strictly via standard Solana wallet-adapter standards.

---

## 4. Evaluator Quick Reference Card

| Action | On-Chain or Off-Chain | Gas / Cost | Result |
|---|---|---|---|
| **Archetype Preview** | Client Off-Chain | Free | Preview Wisp, Bytebeast, Mossling |
| **Awaken Creature** | On-Chain (Devnet) | ~0.001 Devnet SOL | Initializes deterministic Creature PDA |
| **Talk / Ponder / Comfort** | AI Narrative / Off-Chain | Free | Returns species-cadenced dialogue and thoughts |
| **Observe Ritual** | Off-Chain | Free | Generates ambient environmental insights |
| **Bond Ritual** | On-Chain (Devnet) | ~0.000005 Devnet SOL | +30 XP, +2 Curiosity, +3 Empathy |
| **Explore Ritual** | On-Chain (Devnet) | ~0.000005 Devnet SOL | +40 XP, +3 Courage, +2 Ingenuity |
| **Level Up (L1->L2->L3)** | On-Chain Program Logic | Automatic | Recalculated on XP thresholds (40, 100, 200) |
| **Transcend Form** | On-Chain (Devnet) | ~0.000005 Devnet SOL | Permanently evolves into Stage 1 with trait bonuses |
| **Activity History** | Client / On-Chain Hybrid | Free | Chronological record with Explorer links |

---

## 5. Verification Commands for Technical Judges

If you wish to independently verify tests and code integrity directly from terminal:

```bash
# 1. Run Anchor smart contract Rust unit tests (7 tests)
cargo test --manifest-path programs/chainkin/Cargo.toml

# 2. Run TypeScript Vitest suite (94 tests across 7 test files)
npm test

# 3. Verify TypeScript strict mode (0 errors)
npm run typecheck

# 4. Verify ESLint rules (0 errors, 0 warnings)
npm run lint

# 5. Verify Next.js production build
npm run build

# 6. Verify zero private key exposure in source code
grep -rn "secretKey" lib/ app/ components/ programs/
```
*(All commands exit code 0)*

---
*Created with care by the Chainkin Team for the Solana Hackathon.*
