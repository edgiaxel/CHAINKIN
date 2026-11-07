# Empirical Challenger Report & Handoff — Solana Program Invariants & State Progression

**Challenger**: `challenger_2` (`teamwork_challenger`)  
**Target**: Solana Anchor Program Invariants, PDA Derivation, Sighash Encoding & State Progression  
**Verdict**: **APPROVE**  
**Overall Risk Assessment**: **LOW** (Zero Critical, Zero High, Zero Medium)

---

## 1. Observation

Direct empirical observations gathered via actual test execution:

### Observation 1: Anchor Sighashes & Discriminators in `lib/solana/coder.ts`
- File: `lib/solana/coder.ts`, lines 5-13:
  ```typescript
  export function anchorSighash(namespace: string, name: string): Buffer {
    const preimage = `${namespace}:${name}`;
    return createHash("sha256").update(preimage).digest().subarray(0, 8);
  }
  export const CREATURE_ACCOUNT_DISCRIMINATOR = anchorSighash("account", "Creature");
  export const INITIALIZE_CREATURE_IX_DISCRIMINATOR = anchorSighash("global", "initialize_creature");
  export const PERFORM_RITUAL_IX_DISCRIMINATOR = anchorSighash("global", "perform_ritual");
  export const EVOLVE_IX_DISCRIMINATOR = anchorSighash("global", "evolve");
  ```
- Evaluated against standard Node `crypto.createHash("sha256")`:
  - `sha256("global:initialize_creature")[..8]` -> `3abcfcb6b43ff520` (Matches `INITIALIZE_CREATURE_IX_DISCRIMINATOR`)
  - `sha256("global:perform_ritual")[..8]` -> `307f65c260f84df8` (Matches `PERFORM_RITUAL_IX_DISCRIMINATOR`)
  - `sha256("global:evolve")[..8]` -> `8b8ba062fce26a51` (Matches `EVOLVE_IX_DISCRIMINATOR`)
  - `sha256("account:Creature")[..8]` -> `bea54659422e88dd` (Matches `CREATURE_ACCOUNT_DISCRIMINATOR`)
- Collision count across all discriminators: `0` (4 unique 8-byte preimages).

### Observation 2: PDA Derivation in `lib/solana/pda.ts`
- File: `lib/solana/pda.ts`, lines 22-26:
  ```typescript
  export const CREATURE_SEED_PREFIX = Buffer.from("creature");
  export function findCreaturePda(owner: PublicKey, programId: PublicKey = getProgramId()): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([CREATURE_SEED_PREFIX, owner.toBuffer()], programId);
  }
  ```
- Seed prefix `CREATURE_SEED_PREFIX` evaluated to `[99, 114, 101, 97, 116, 117, 114, 101]`, matching Anchor Rust constant `pub const CREATURE_SEED: &[u8] = b"creature";` in `programs/chainkin/src/lib.rs:6`.
- 500 distinct random keypairs tested:
  - 3 independent calls per keypair -> 100% identical PDA and bump.
  - 500 unique PDAs in `Set<string>` -> 0 collisions.
  - `PublicKey.isOnCurve(pda.toBytes())` evaluated to `false` for 500/500 PDAs.
  - Canonical bump reconstruction using `PublicKey.createProgramAddressSync` succeeded for 500/500 PDAs.

### Observation 3: Arithmetic & Boundary Resilience
- File: `programs/chainkin/src/lib.rs:70-85, 231-241` & `lib/creature/types.ts`:
  - XP boundary progression: `calculateLevel` returns 1 for XP in [0..39], 2 for [40..99], 3 for [100..199], 4 for [200..4,294,967,295 (max u32)].
  - `saturating_add` near `0xFFFFFFFF`: XP of `0xFFFFFFFF - 10` + 30 / 40 saturates cleanly at `0xFFFFFFFF` without integer wrapping to small values.
  - Trait saturation at 255: trait values of 254 + 2 and 250 + 9 saturate at 255 without wrapping to 0 or 3.
  - Ritual count saturation at 65,535: saturates without wrapping.
  - Full 115-byte boundary account with max name length (32 bytes), max u32 XP (`0xFFFFFFFF`), max traits (`[255, 255, 255, 255]`), max ritual count (`65535`), and max slot (`18446744073709551615`) deserializes cleanly in `decodeCreatureAccount`.
  - Malformed inputs (< 61 bytes or invalid discriminators) throw explicit errors: `Creature account data too short` and `Invalid Creature account discriminator`.

### Observation 4: Test Suite & Build Verification
- Command: `cargo test --manifest-path programs/chainkin/Cargo.toml`
  - Output: `test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s`
- Command: `npm test`
  - Output: `Test Files 6 passed (6), Tests 69 passed | 1 skipped (70), Duration 1.38s`
- Command: `npm run typecheck`
  - Output: `tsc --noEmit` exited with code `0`.
- Command: `npm run lint`
  - Output: `✔ No ESLint warnings or errors`
- Command: `npm run build`
  - Output: `✓ Compiled successfully`, `✓ Generating static pages (4/4)`, exit code `0`.

---

## 2. Logic Chain

1. **Sighash Wire Compatibility**:
   - Observation 1 proves that `lib/solana/coder.ts` matches Anchor's standard formula `sha256("global:<name>")[..8]` and `sha256("account:<name>")[..8]` byte-for-byte.
   - Because these discriminators match the SBF binary's instruction dispatcher, instructions serialized by the client layer will route correctly to `initialize_creature`, `perform_ritual`, and `evolve` on Devnet.

2. **PDA Determinism & Space Guarantee**:
   - Observation 2 proves that `findCreaturePda` produces deterministic, collision-free, off-curve addresses across 500 distinct public keys.
   - Because Anchor enforces `seeds = [b"creature", owner.key().as_ref()]`, only the owner wallet can ever initialize or mutate that creature account.

3. **State Mutation Safety**:
   - Observation 3 confirms that progression level thresholds align between Rust and TypeScript.
   - Because all additions use `saturating_add`, high-XP creatures will never experience integer wrap-around or account panics.
   - Corrupted or spoofed account payloads fail decoding immediately due to the 8-byte discriminator check.

4. **Integration Health**:
   - Observation 4 confirms that all local suites (`cargo test`, `vitest`, `typecheck`, `lint`, `build`) pass cleanly without errors or broken dependencies.

---

## 3. Caveats

- **On-chain Cooldown Slot Delta**: As documented in the security audit report (SEC-01), the Solana program records `last_action_slot` but does not enforce a minimum slot delay between consecutive ritual calls. This design property is accepted for hackathon MVP demoability and introduces no economic or state corruption risk.
- **RPC Network Jitter**: Tests were conducted against deterministic local mock harnesses; actual Solana Devnet latency or slot skips depend on public cluster conditions.
- No other caveats.

---

## 4. Conclusion & Verdict

**VERDICT**: **APPROVE**

The Solana program invariants, PDA derivation determinism, sighash binary encoding, and state progression logic are verified and resilient against adversarial boundary inputs, integer wrap-around, and account spoofing.

---

## 5. Verification Method

To independently verify all findings:

1. **Run Solana Anchor Rust unit tests**:
   ```bash
   cargo test --manifest-path programs/chainkin/Cargo.toml
   ```
2. **Run TypeScript unit and stress tests**:
   ```bash
   npm test
   ```
3. **Run TypeScript compiler validation**:
   ```bash
   npm run typecheck
   ```
4. **Run Next.js production build**:
   ```bash
   npm run build
   ```

**Invalidation Conditions**:
- If `INITIALIZE_CREATURE_IX_DISCRIMINATOR.toString('hex') !== '3abcfcb6b43ff520'`.
- If two different public keys produce an identical PDA under `findCreaturePda`.
- If `calculateLevel(0xFFFFFFFF)` does not return 4.
- If any command in steps 1-4 exits with a non-zero exit code.

---

## 6. Adversarial Challenge Matrix

| Challenge | Risk Level | Assumption Tested | Attack Scenario | Blast Radius | Actual Behavior | Result |
|---|---|---|---|---|---|---|
| **CH-01: Sighash Mismatch** | High | Anchor SHA256 formula matches TS coder | Client sends malformed sighash causing instruction failure | Failed transactions on Devnet | 100% byte match against Anchor standard formula | **PASS** |
| **CH-02: PDA Collision** | Critical | `findProgramAddressSync` yields unique address per owner | 2 owners generate colliding PDA address | Account hijacking / overwriting | 500 distinct keys yielded 500 unique off-curve PDAs | **PASS** |
| **CH-03: Integer Wrap** | High | Trait / XP values exceed byte boundaries | Player exceeds 255 trait or max u32 XP causing arithmetic wrap | Resetting creature stats to 0 | Universal `saturating_add` caps at max value cleanly | **PASS** |
| **CH-04: Buffer Underflow** | Medium | Client deserializes corrupted account payload | Malicious RPC returns short or spoofed account buffer | App crash / undefined state | Explicit validation throws descriptive error immediately | **PASS** |
