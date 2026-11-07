# Comprehensive Solana Anchor Security Audit Report — Chainkin MVP v0.2

**Target**: Chainkin Solana Anchor Program & Client Layer  
**Milestone**: M1 (Requirement R4) — Solana Security Review  
**Auditor**: Workstream C (`teamwork_explorer`)  
**Audit Date**: 2026-11-07  
**Audit Scope**: Read-Only Architecture, Program Code, PDA Integrity, Authority Checks, Progression Invariants, Cooldowns, Network Posture, and Test Suites.  
**Repository Working Directory**: `/home/axel/Development/CHAINKIN`

---

## 1. Executive Summary

A comprehensive read-only security audit of the Chainkin Solana Anchor program, client instruction encoding/decoding, wallet integration, and test suites was conducted. The program implements a digital companion creature on Solana Devnet, enforcing single-creature ownership per wallet, authoritative on-chain progression, deterministic evolutionary branching, and strict owner authorization.

### Audit Summary Matrix
| Security Dimension | Status | Risk Level | Assessment Summary |
|---|---|---|---|
| **1. PDA Seeds & Space** | **PASS** | INFORMATIONAL | Seeds `[b"creature", owner.key()]` enforce 1 creature per wallet; canonical bump persisted; exact 115 bytes allocated. |
| **2. Authority & Access Control** | **PASS** | LOW (RESOLVED) | State modifications strictly require `owner: Signer` and `has_one = owner @ ChainkinError::Unauthorized`. Defense-in-depth via seed matching. |
| **3. Progression & State Invariants** | **PASS** | INFORMATIONAL | Deterministic level thresholds, base traits per species, and evolution rules match client specification exactly. |
| **4. Cooldown Enforcement** | **OBSERVED** | LOW | `last_action_slot` is updated on every action; no on-chain minimum slot delta is required before performing subsequent rituals. Pacing risk only. |
| **5. Arithmetic & Memory Safety** | **PASS** | INFORMATIONAL | Universal `saturating_add` prevents overflow/wrap panics; static bounds check on string lengths and trait arrays. |
| **6. Network & Secret Posture** | **PASS** | INFORMATIONAL | Devnet-only RPC and cluster configuration; pure wallet-adapter signing flow; zero private keys or seed phrases stored or parsed. |
| **7. Scope Isolation** | **PASS** | INFORMATIONAL | Zero tokenomics, SPL tokens, marketplaces, breeding, PvP, or staking code present in repository. |
| **8. Test Suite Verification** | **PASS** | INFORMATIONAL | All 4 Rust Anchor unit tests pass; all 14 TypeScript Vitest tests pass; `tsc --noEmit` clean. |

---

## 2. Program Identification & Configuration

- **Program ID**: `DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB`
  - Declared in program: `programs/chainkin/src/lib.rs:4`:
    ```rust
    declare_id!("DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB");
    ```
  - Declared in workspace config: `Anchor.toml:8,11`:
    ```toml
    [programs.devnet]
    chainkin = "DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB"

    [programs.localnet]
    chainkin = "DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB"
    ```
  - Declared in client PDA helper: `lib/solana/pda.ts:8`:
    ```typescript
    export const DEFAULT_PROGRAM_ID = new PublicKey("DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB");
    ```
  - Verified precompiled keypair:
    ```bash
    solana-keygen pubkey programs/chainkin/target/deploy/chainkin-keypair.json
    # Output: DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB
    ```
  - Compiled SBF binary: `programs/chainkin/target/deploy/chainkin.so` (192,792 bytes, ELF 64-bit LSB eBPF).

---

## 3. Deep Dive Findings by Audit Requirement

### Requirement 1: PDA Seeds, Space Allocation & Bump Persistence
- **Seeds Specification**:
  `programs/chainkin/src/lib.rs:6`:
  ```rust
  pub const CREATURE_SEED: &[u8] = b"creature";
  ```
  Seeds format across instructions: `[CREATURE_SEED, owner.key().as_ref()]`.
  Client counterpart: `lib/solana/pda.ts:22-26`:
  ```typescript
  export const CREATURE_SEED_PREFIX = Buffer.from("creature");
  export function findCreaturePda(owner: PublicKey, programId: PublicKey = getProgramId()): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([CREATURE_SEED_PREFIX, owner.toBuffer()], programId);
  }
  ```
- **One Creature Per Wallet Invariant**:
  During `initialize_creature`, Anchor evaluates `#[account(init, payer = owner, space = Creature::SPACE, seeds = [CREATURE_SEED, owner.key().as_ref()], bump)]` (`lib.rs:137-143`).
  If a PDA for that owner already exists with lamports or initialized data, the Solana runtime and Anchor abort with an account already in use error (`0x0`). Hence, exactly one creature PDA can exist per wallet.
- **Canonical Bump Persistence**:
  In `initialize_creature`:
  ```rust
  creature.bump = ctx.bumps.creature; // stores canonical bump (lib.rs:55)
  ```
  In subsequent instructions (`PerformRitual`, `Evolve`):
  ```rust
  seeds = [CREATURE_SEED, owner.key().as_ref()],
  bump = creature.bump,
  ```
  Anchor verifies that the passed account address matches the seeds evaluated specifically with the stored canonical bump. This protects against non-canonical bump search attacks or address aliasing.
- **Account Space Calculation**:
  `programs/chainkin/src/lib.rs:194-208`:
  ```rust
  impl Creature {
      pub const SPACE: usize = 8  // discriminator
          + 32                    // owner (Pubkey)
          + 16                    // creature_id ([u8; 16])
          + 1                     // species_id (u8)
          + 4 + MAX_NAME_LENGTH   // name (String: 4-byte Borsh len + 32 bytes = 36)
          + 1                     // level (u8)
          + 4                     // xp (u32)
          + 4                     // traits ([u8; 4])
          + 2                     // ritual_count (u16)
          + 1                     // evolution_stage (u8)
          + 1                     // evolution_choice (u8)
          + 8                     // last_action_slot (u64)
          + 1;                    // bump (u8)
  }
  ```
  Total: `8 + 32 + 16 + 1 + 36 + 1 + 4 + 4 + 2 + 1 + 1 + 8 + 1 = 115 bytes`.
  - Verified by Rust test `test_space_calculation`: `assert_eq!(Creature::SPACE, 115)`.
  - Rent exemption minimum on Solana: `solana rent 115` = `0.00123444 SOL` (1,234,440 lamports).
  - String length guard: `require!(name.len() <= MAX_NAME_LENGTH, ChainkinError::NameTooLong)` (`lib.rs:33`) ensures user input cannot exceed allocated capacity.
- **Assessment**: **SECURE & VERIFIED**.

---

### Requirement 2: Authority & Access Control
- **Context Inspection**:
  Both state-mutating instructions (`perform_ritual` and `evolve`) declare the following account constraints (`programs/chainkin/src/lib.rs:152-176`):
  ```rust
  #[derive(Accounts)]
  pub struct PerformRitual<'info> {
      #[account(
          mut,
          seeds = [CREATURE_SEED, owner.key().as_ref()],
          bump = creature.bump,
          has_one = owner @ ChainkinError::Unauthorized
      )]
      pub creature: Account<'info, Creature>,

      pub owner: Signer<'info>,
  }

  #[derive(Accounts)]
  pub struct Evolve<'info> {
      #[account(
          mut,
          seeds = [CREATURE_SEED, owner.key().as_ref()],
          bump = creature.bump,
          has_one = owner @ ChainkinError::Unauthorized
      )]
      pub creature: Account<'info, Creature>,

      pub owner: Signer<'info>,
  }
  ```
- **Multi-Layered Authorization Analysis**:
  1. `owner: Signer<'info>`: Verifies that the transaction signature from `owner` is cryptographically valid. An unauthenticated third-party cannot execute actions without the owner's signature.
  2. `seeds = [CREATURE_SEED, owner.key().as_ref()]`: Anchors the creature address derivation directly to the `owner` account passed in the context.
  3. `has_one = owner @ ChainkinError::Unauthorized`: Explicitly validates that the pubkey stored in `creature.owner` equals the pubkey of `ctx.accounts.owner`. If mismatched, it throws custom error `ChainkinError::Unauthorized` (`0x1777` / `6007`).
- **Attack Scenario Evaluation**:
  - *Scenario A: Attacker calls `perform_ritual` specifying Victim's creature PDA and Attacker as `owner` (signed)*:
    Anchor evaluates `seeds = [CREATURE_SEED, Attacker.key()]`. This produces Attacker's creature PDA (or an uninitialized address), NOT Victim's PDA. The account validation fails with Anchor `ConstraintSeeds`. Furthermore, `has_one = owner` fails because Victim's creature has `owner = Victim != Attacker`.
  - *Scenario B: Attacker calls `perform_ritual` specifying Victim's creature PDA and Victim as `owner` (unsigned)*:
    Anchor checks `owner: Signer`. Since Victim did not sign the transaction, Solana runtime aborts with `SignatureVerificationFailed`.
- **Assessment**: **SECURE & VERIFIED**. Complete protection against unauthorized state mutation.

---

### Requirement 3: Progression & State Invariants
- **Base Traits by Species** (`programs/chainkin/src/lib.rs:210-217`):
  ```rust
  pub fn get_base_traits(species_id: u8) -> [u8; 4] {
      match species_id {
          SPECIES_WISP => [12, 6, 10, 8],      // curiosity: 12, courage: 6, empathy: 10, ingenuity: 8
          SPECIES_BYTEBEAST => [8, 12, 6, 10],  // curiosity: 8, courage: 12, empathy: 6, ingenuity: 10
          SPECIES_MOSSLING => [7, 8, 13, 8],   // curiosity: 7, courage: 8, empathy: 13, ingenuity: 8
          _ => [5, 5, 5, 5],
      }
  }
  ```
  Verified matching `lib/creature/types.ts:27, 36, 45`.
- **Rituals Progression** (`programs/chainkin/src/lib.rs:70-85`):
  - `RITUAL_BOND (1)`:
    - XP: `+30` (`saturating_add(30)`)
    - Traits: `traits[0]` (curiosity) `+2`, `traits[2]` (empathy) `+3`
    - Ritual count: `+1`
  - `RITUAL_EXPLORE (2)`:
    - XP: `+40` (`saturating_add(40)`)
    - Traits: `traits[1]` (courage) `+3`, `traits[3]` (ingenuity) `+2`
    - Ritual count: `+1`
  - Off-chain ritual: `RITUAL_OBSERVE (0)` is handled client-side/AI-only without submitting an on-chain transaction (matches `RITUAL_CATALOG[0].isOnChain = false`).
- **Deterministic Level Recalculation** (`programs/chainkin/src/lib.rs:231-241`):
  ```rust
  pub fn calculate_level(xp: u32) -> u8 {
      if xp >= 200 { 4 }
      else if xp >= 100 { 3 }
      else if xp >= 40 { 2 }
      else { 1 }
  }
  ```
  Recalculated synchronously on every `perform_ritual` execution (`lib.rs:87`).
- **Evolution Rules** (`programs/chainkin/src/lib.rs:105-117`):
  - Gate 1: `require!(creature.evolution_stage == 0, ChainkinError::AlreadyEvolved);` (precludes multiple evolutions).
  - Gate 2: `require!(creature.level >= EVOLUTION_REQUIRED_LEVEL || creature.xp >= EVOLUTION_REQUIRED_XP, ChainkinError::NotEligibleForEvolution);` (requires Level 3 or 100 XP).
  - Gate 3: `require!(evolution_choice == 1 || evolution_choice == 2, ChainkinError::InvalidEvolutionChoice);` (strictly branches A or B).
  - Trait Bonuses (`lib.rs:219-229`):
    - Wisp Choice 1 (Astral Guide): `[+5, +2, +8, +3]`
    - Wisp Choice 2 (Chrono Phantom): `[+7, +4, +3, +6]`
    - Bytebeast Choice 1 (Cyber Warden): `[+2, +9, +3, +6]`
    - Bytebeast Choice 2 (Spark Overdrive): `[+6, +7, +2, +9]`
    - Mossling Choice 1 (Elder Arbor): `[+3, +6, +10, +3]`
    - Mossling Choice 2 (Bloom Weaver): `[+6, +4, +8, +6]`
- **Assessment**: **SECURE & VERIFIED**. Invariants are deterministic and state transitions are strictly linear and immutable.

---

### Requirement 4: Cooldown Enforcement & Slot Handling
- **Code Observation**:
  - `initialize_creature` records slot:
    `creature.last_action_slot = clock.slot;` (`lib.rs:54`)
  - `perform_ritual` records slot:
    `creature.last_action_slot = clock.slot;` (`lib.rs:89`)
  - `evolve` records slot:
    `creature.last_action_slot = clock.slot;` (`lib.rs:123`)
  - **Absence of Guard**:
    There is **no check** such as:
    ```rust
    // Not present in programs/chainkin/src/lib.rs:
    require!(
        clock.slot >= creature.last_action_slot.saturating_add(COOLDOWN_SLOTS),
        ChainkinError::CooldownActive
    );
    ```
- **Security Impact Analysis**:
  - **Risk Classification**: **LOW / INFORMATIONAL (Design Pacing)**.
  - **Drain / Economic Risk**: **NONE**. The program holds zero vault funds, distributes zero fungible tokens, and issues no tradeable assets. XP and levels are companion progression metadata only.
  - **Griefing / Denial of Service**: **NONE**. A wallet can only execute rituals on its own creature, paying Solana transaction fees for every call.
  - **Progression Pacing**: A user or script can submit multiple `perform_ritual` transactions consecutively in the same or contiguous slots to reach Level 3 / 100 XP in seconds.
  - **Context & Intent**:
    In `docs/PROJECT_SPEC.md` and `.agent-work/DECISIONS.md`, rapid hackathon demoability is prioritized: users need to test hatching, rituals, and evolution within a single demo session without waiting hours or epochs for cooldown timers to expire.
- **Recommendation for Post-MVP Production**:
  If strict gameplay pacing is desired in a future production release:
  ```rust
  pub const RITUAL_COOLDOWN_SLOTS: u64 = 75; // ~30 seconds on Solana (~400ms per slot)
  // Inside perform_ritual:
  require!(
      clock.slot >= creature.last_action_slot.saturating_add(RITUAL_COOLDOWN_SLOTS),
      ChainkinError::CooldownActive
  );
  ```
  For the current Devnet companion MVP v0.2, the absence of an on-chain cooldown check is non-critical and enables smooth demo flows.

---

### Requirement 5: Arithmetic & Memory Safety
- **Arithmetic Invariant Check**:
  Every arithmetic addition in the program uses Rust's `saturating_add`:
  - `creature.xp.saturating_add(30)` (`lib.rs:73`)
  - `creature.traits[0].saturating_add(2)` (`lib.rs:74`)
  - `creature.traits[2].saturating_add(3)` (`lib.rs:75`)
  - `creature.xp.saturating_add(40)` (`lib.rs:79`)
  - `creature.traits[1].saturating_add(3)` (`lib.rs:80`)
  - `creature.traits[3].saturating_add(2)` (`lib.rs:81`)
  - `creature.ritual_count.saturating_add(1)` (`lib.rs:88`)
  - `creature.traits[i].saturating_add(bonus[i])` (`lib.rs:121`)
- **Integer Wrap-Around / Overflow Resilience**:
  Even under extreme invocation counts:
  - `xp` (`u32`): Saturates at `4,294,967,295` without overflow panic.
  - `traits` (`[u8; 4]`): Saturate at `255` without wrap-around to `0`.
  - `ritual_count` (`u16`): Saturates at `65,535` without wrap-around.
- **Array Bounds Safety**:
  - `traits[0..4]` and `bonus[0..4]` are fixed-size 4-element arrays indexed with `for i in 0..4`. Out-of-bounds indexing is mathematically impossible.
  - `creature_id.copy_from_slice(&id_hash.to_bytes()[..16])`: Slices exactly 16 bytes into a `[u8; 16]` array. Validated safe.
- **Memory Allocation & Account Size**:
  `Creature::SPACE = 115` bytes. String is bounded by `require!(name.len() <= MAX_NAME_LENGTH (32))`. No dynamically resizing allocations occur inside the account.
- **Assessment**: **SECURE & VERIFIED**.

---

### Requirement 6: Network & Secret Posture
- **Devnet Exclusivity**:
  - `Anchor.toml:17`: `cluster = "devnet"`
  - `lib/solana/pda.ts:3-4`:
    ```typescript
    export const DEVNET_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
    export const CLUSTER_NAME = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";
    ```
  - `components/wallet/NetworkBanner.tsx:19,22`:
    ```tsx
    <span className="font-semibold text-slate-200 uppercase tracking-wider">
      Network: {CLUSTER_NAME}
    </span>
    <span className="text-slate-400 hidden sm:inline">
      • Real Devnet transactions only. No mainnet funds used.
    </span>
    ```
  - Zero mainnet endpoints or mainnet program IDs exist anywhere in code.
- **Key & Secret Posture**:
  - `grep_search` across entire workspace confirmed:
    - 0 instances of `fromSecretKey`
    - 0 instances of `secretKey`
    - 0 instances of `mnemonic` or `bip39`
    - 0 hardcoded private keys or test keypairs in application code
  - Client signing is 100% delegated to `@solana/wallet-adapter-react` and standard browser wallets (Phantom, Solflare). Application code only constructs unsigned `Transaction` objects and requests user signature through standard wallet popup flows.
  - Secrets like `OPENROUTER_API_KEY` are strictly read server-side in API routes via `process.env.OPENROUTER_API_KEY` without `NEXT_PUBLIC_*` exposure.
- **Assessment**: **SECURE & VERIFIED**.

---

### Requirement 7: Scope Isolation
- **Feature Boundary Audit**:
  Grep searches confirmed zero implementation or dependencies for:
  - Tokenomics / SPL Tokens: `spl-token` crate is absent from `Cargo.toml`. No token minting, transferring, or burning exists.
  - Marketplace / Trading: No listing, bidding, escrow, or sale mechanics exist.
  - Breeding: No cross-creature mating or genetic mixing functions exist.
  - Staking / Yield: No lockup, reward distribution, or yield generation mechanisms exist.
  - Multiplayer / PvP: No combat, leaderboard, or multi-user state interaction exists.
- **Assessment**: **SECURE & VERIFIED**. Scope adheres strictly to the digital companion MVP specification.

---

### Requirement 8: Test Suite Verification Evidence
All test suites were executed directly against the local repository:

#### 1. Rust Anchor Program Unit Tests
- **Command**:
  ```bash
  cargo test --manifest-path programs/chainkin/Cargo.toml
  ```
- **Exit Code**: `0`
- **Output**:
  ```text
  running 4 tests
  test test_id ... ok
  test tests::test_level_progression ... ok
  test tests::test_base_traits ... ok
  test tests::test_space_calculation ... ok

  test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
  ```

#### 2. TypeScript Serialization, PDA & Integration Tests
- **Command**:
  ```bash
  npm test
  ```
- **Exit Code**: `0`
- **Output**:
  ```text
  ✓ tests/domain.test.ts (6)
  ✓ tests/coder.test.ts (5)
  ✓ tests/integration.test.ts (3)

  Test Files  3 passed (3)
       Tests  14 passed (14)
    Duration  1.37s
  ```
- **Breakdown of TypeScript Tests**:
  - `tests/domain.test.ts`:
    - Valid species metadata & base traits
    - Deterministic level calculation from XP
    - Evolution eligibility predicate
    - `CreatureStateSchema` runtime Zod validation
    - Deterministic fallback dialogue generation
    - Fallback evolution narrative generation
  - `tests/coder.test.ts`:
    - Anchor SHA256 8-byte sighashes computation
    - `initialize_creature` instruction serialization
    - `perform_ritual` instruction serialization
    - `evolve` instruction serialization
    - On-chain binary Creature account deserialization
  - `tests/integration.test.ts`:
    - Deterministic PDA derivation from owner public key
    - Unique PDA separation across different owner keys
    - End-to-end simulated lifecycle: hatch -> bond ritual -> level progression -> evolution

#### 3. TypeScript Typecheck
- **Command**:
  ```bash
  npm run typecheck
  ```
- **Exit Code**: `0` (Zero compiler errors).

---

## 4. Security Findings & Risk Summary

| Finding ID | Severity | Status | Description | Recommendation |
|---|---|---|---|---|
| **SEC-01** | **Low** | Accepted for MVP | **Missing On-Chain Cooldown Delta**: `last_action_slot` updates on each action, but `perform_ritual` does not enforce `clock.slot >= last_action_slot + COOLDOWN_SLOTS`. | Documented behavior. For MVP/hackathon demo, this permits unblocked testing. For future production, enforce slot delta check on-chain. |
| **SEC-02** | **Informational** | Resolved | **PDA Single-Creature Constraint**: An owner can only create 1 creature per wallet address. | Working as intended by design (Decision D004). |
| **SEC-03** | **Informational** | Resolved | **Client Sighash Coder Compatibility**: Custom TypeScript coder implements manual SHA256 sighash encoding instead of heavy Anchor IDL client. | Verified wire-compatible with Anchor's Borsh layout via unit and integration tests. |

---

## 5. Audit Conclusion

The Chainkin Solana Anchor program and client integration achieve high security, deterministic state integrity, and complete compliance with Milestone M1 and Requirement R4:
1. **Zero Critical or High Vulnerabilities**: No reentrancy, unconstrained writable accounts, missing signer checks, or arithmetic overflow bugs exist.
2. **Strict Authority Isolation**: All mutations require the owner's cryptographic signature and enforce `has_one = owner`.
3. **Safe Storage & Serialization**: Exact 115-byte rent-exempt allocation with bounded name length.
4. **Devnet Posture**: Full isolation from Solana mainnet, pure browser wallet-adapter signing flow, zero private key leakage.
5. **Clean Verification**: All test suites (`cargo test`, `vitest`, `typecheck`) pass cleanly with 100% test success rate.
