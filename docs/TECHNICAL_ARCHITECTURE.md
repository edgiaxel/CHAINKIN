# Technical Architecture — Chainkin

## 1. Architecture overview

- Next.js + TypeScript frontend.
- Solana wallet connection and transaction signing in the browser.
- Anchor/Rust program on Solana Devnet.
- PDA account stores authoritative creature identity and progression.
- Server-side AI route generates non-authoritative narrative.
- Optional off-chain persistence only for cacheable narrative/preferences; the app must remain functional without a database.

## 2. Suggested stack

Choose compatible current stable versions during initialization and record exact versions in the lockfile.

- Next.js App Router, React, TypeScript strict mode.
- Tailwind CSS; shadcn/ui only where useful.
- Framer Motion for restrained creature animation.
- Solana wallet adapter compatible with the selected Anchor client.
- Anchor + Rust for the on-chain program.
- Anchor TypeScript client and compatible `@solana/web3.js` v1 if required by the chosen Anchor client. Keep legacy web3.js usage isolated.
- Zod for request/response validation.
- AI provider SDK behind a provider-independent interface.
- Vitest/Jest or the framework's suitable test runner.
- Playwright only for a small number of critical browser flows if time permits.

Do not combine multiple incompatible Solana SDK generations. Verify package compatibility before installing.

## 3. On-chain program responsibilities

The program is authoritative for:
- One creature account per owner wallet.
- Initial creature attributes and identity.
- Valid ritual actions and deterministic reward rules.
- XP/level progression.
- Evolution eligibility.
- Allowed evolution choice and recorded stage.

The program is NOT responsible for:
- AI dialogue or biography.
- Image storage.
- Long-form metadata.
- API keys or provider calls.
- User private keys.

## 4. PDA design

Suggested PDA seeds:

- Creature PDA: `[b"creature", owner_pubkey]`

The owner is a signer for initialization and user actions. Use Anchor account constraints to verify PDA derivation, owner relationship, and signer authority.

Suggested account layout (adapt based on Anchor serialization limits and program design):

- `owner: Pubkey`
- `creature_id: [u8; 16]` or compact deterministic identifier
- `species_id: u8`
- `level: u8`
- `xp: u32`
- `traits: [u8; 4]`
- `ritual_count: u16`
- `evolution_stage: u8`
- `evolution_choice: u8` with a sentinel for unset
- `last_action_slot` or timestamp for cooldown if needed
- `bump: u8`

Keep account size fixed and calculate allocation precisely. Avoid arbitrary user-controlled account growth.

## 5. Suggested instructions

Exact names can be adjusted, but keep the public interface small:

1. `initialize_creature(species_id, name_bytes_or_name_hash)`
   - owner signs.
   - reject if PDA already exists.
   - validate species allowlist.
   - initialize deterministic starting values.

2. `perform_ritual(ritual_id)`
   - owner signs.
   - validate ritual allowlist and eligibility/cooldown.
   - apply fixed XP/trait changes.
   - enforce caps and level calculation on-chain.

3. `evolve(evolution_id)`
   - owner signs.
   - validate level/ritual threshold.
   - validate evolution allowlist for current species/stage.
   - record evolution and update stage.

Do not add an instruction solely to display dialogue. Read-only account fetches do not need a transaction.

## 6. Frontend modules

Suggested boundaries:

- `lib/solana/`: connection, wallet, PDA derivation, account decoding, transaction builders.
- `lib/creature/`: domain types, display mapping, progression calculations for UI only.
- `lib/ai/`: typed client for server route; never expose provider key.
- `app/api/creature/dialogue/`: server-side AI route with input validation, length limits, rate limits where feasible, and fallback behavior.
- `components/creature/`: creature stage, trait panel, dialogue.
- `components/wallet/`: connect, network indicator, transaction status.

The UI may calculate a progress-bar display, but authoritative eligibility and progression must be read from the program account.

## 7. AI contract

Define a provider-independent interface such as:

- `generatePersonality(input) -> Personality`
- `generateDialogue(input) -> Dialogue`
- `generateEvolutionNarrative(input) -> EvolutionNarrative`

Validate all returned fields with Zod. Enforce maximum output lengths. Treat user-supplied names and text as untrusted data. Do not allow prompt content to alter system-level product rules.

AI output must never contain transaction instructions or be interpreted as a program command.

Fallbacks:
- Static archetype personality.
- Template dialogue selected from creature state.
- Static evolution descriptions.

## 8. Events and state synchronization

After a state-changing transaction:
1. Wait for appropriate Devnet confirmation.
2. Fetch the PDA account again.
3. Decode and validate account data.
4. Update UI from the fetched state.
5. Show transaction signature with Solana Explorer Devnet link.

Do not rely on optimistic local XP updates as proof of success.

## 9. Environment variables

Use `.env.example` with placeholders only. Expected values may include:
- `NEXT_PUBLIC_SOLANA_RPC_URL` (Devnet endpoint only)
- `NEXT_PUBLIC_SOLANA_CLUSTER=devnet`
- `AI_PROVIDER`
- `AI_API_KEY` (server-only)
- `AI_MODEL`

Never prefix secrets with `NEXT_PUBLIC_`. Do not commit actual values.

## 10. Testing strategy

- Rust/program unit tests for species validation, ritual rules, XP caps, level progression, evolution requirements, invalid owner, duplicate initialization.
- TypeScript tests for PDA derivation, account decoding, AI schema validation, and fallback behavior.
- Frontend build, lint, and typecheck.
- Devnet integration test: initialize one test creature, perform one ritual, fetch confirmed state, and verify it changed.
- Manual wallet test for rejected signature and wrong network.

## 11. Deployment

- Devnet program deployment only.
- Frontend deployment may use Vercel preview deployment.
- No mainnet deployment.
- Keep program ID and cluster configuration explicit.
- Document any manual deployment or faucet step that cannot be automated safely.
