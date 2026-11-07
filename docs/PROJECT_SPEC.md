# Product Specification — Chainkin

**Status:** MVP specification  
**Working title:** Chainkin  
**Target:** Solana Hackathon MVP  
**Network:** Solana Devnet

## 1. Product vision

Chainkin is a digital creature companion associated with a user's Solana wallet. Each wallet can hatch one creature. The creature has a persistent on-chain identity and progression, while its personality, dialogue, and narrative are generated off-chain by an AI service.

The emotional hook: the creature feels like a little digital companion that grows with its owner. The technical hook: ownership and meaningful progression are verifiable on Solana.

## 2. Product principles

1. **Creature first:** The creature is the home screen and primary product experience.
2. **Blockchain with purpose:** Solana records ownership and validated progression, not arbitrary text.
3. **AI with boundaries:** AI creates personality and narrative, but never controls ownership, balances, XP, or program state.
4. **No forced spending:** Progression must not require purchasing tokens or repeatedly spending SOL.
5. **Demoable:** A judge should understand the product in under one minute.
6. **Small, complete loop:** Prefer one reliable lifecycle over many incomplete features.

## 3. Target user and primary value

A Solana user who wants a playful, collectible digital companion with a persistent identity and an evolving personality.

Primary value: hatch a creature that feels distinct, interact with it, and see a verifiable progression/evolution milestone.

## 4. MVP scope

### Must have

- Connect a Solana wallet using a supported wallet adapter.
- Clearly indicate Devnet and help users switch to it.
- Detect whether the connected wallet already owns a Chainkin.
- Hatch one creature per wallet.
- Assign deterministic initial creature attributes from a server/program-safe seed or deterministic client input; do not let AI dictate authoritative state.
- Persist creature identity and core progression on Solana using a PDA account.
- Display creature species/archetype, name, level, XP, traits, and evolution stage.
- Provide a small set of interactions/rituals with clear effects and cooldown/eligibility rules.
- Allow a wallet activity summary to be used as optional narrative context only if it can be read safely and cheaply. If not, use the user's chosen interaction/personality answers instead.
- Generate personality, dialogue, and evolution flavor text through a provider-independent AI service, with a deterministic fallback.
- Allow evolution when deterministic on-chain requirements are met.
- Record the evolution choice/state on-chain.
- Provide loading, error, empty, transaction-pending, success, and wallet-disconnected states.
- Provide a demo path that works with Devnet and a test wallet.

### Explicitly out of scope

- Mainnet.
- Token issuance, tokenomics, staking, DeFi, swaps, or payments.
- Marketplace, creator storefront, secondary trading, royalties, or licensing.
- Breeding, multiplayer, PvP, combat, guilds, or social feeds.
- Autonomous AI wallet or agent spending.
- Complex wallet-history indexing.
- Uploading private user data or full transaction histories to an AI provider.
- NFT minting unless the core MVP is complete and a simple, safe implementation is clearly feasible. It is not required for acceptance.

## 5. Creature model

Keep the model small and extensible.

Suggested MVP fields:

- `owner`: wallet public key.
- `creature_id`: deterministic identifier or PDA.
- `species`: one of 3 fixed archetypes.
- `name`: user-editable display name with validation; if stored on-chain, enforce a short byte limit.
- `level`: starts at 1.
- `xp`: starts at 0.
- `traits`: fixed-size numeric trait vector, for example curiosity, courage, empathy, and ingenuity.
- `evolution_stage`: starts at 0.
- `evolution_choice`: unset until evolved.
- `created_at` / `last_interaction_at`: timestamps if supported safely by program design.
- `bump`: PDA bump.

Do not store long strings, generated biographies, dialogue, images, or API outputs in the program account.

## 6. Initial archetypes

Use three distinct archetypes with clear visual and narrative differences. Names are provisional:

1. **Wisp** — curious, observant, ethereal.
2. **Bytebeast** — energetic, inventive, mechanical.
3. **Mossling** — calm, resilient, nature-linked.

The hatch selection may be random/deterministic or user-selected. For a hackathon MVP, prefer deterministic selection from a verifiable seed and avoid claiming cryptographic randomness unless a verifiable randomness provider is actually integrated.

## 7. Interactions / rituals

Implement three simple interactions. They must be free or use only negligible Devnet transaction fees.

- **Observe:** Read creature state and generate contextual dialogue. Prefer no transaction if no state changes.
- **Bond:** A user-initiated on-chain interaction that increments a bounded progression counter or awards a fixed XP amount subject to a cooldown/once-per-epoch rule.
- **Explore:** A second on-chain action with a distinct, deterministic reward/trait progression. Do not create a client-controlled arbitrary reward amount.

The exact rewards and cooldowns must be documented and enforced by the program, not only by the UI. Avoid mechanics that incentivize unnecessary transactions.

## 8. Evolution

When deterministic requirements are met (for example, a target level or interaction count), the AI may generate two narrative evolution descriptions. The actual evolution options must come from a fixed allowlist defined by the application/program, not arbitrary AI-generated program instructions.

The user chooses one option. The program validates eligibility and allowed evolution ID. AI can generate the descriptive text and personality response after the confirmed transaction.

## 9. AI behavior

AI is used for:
- Initial personality description.
- Short creature dialogue.
- Narrative interpretation of user-selected interactions.
- Two evolution descriptions based on an allowlisted evolution pair.

AI is not used for:
- Determining wallet ownership.
- Determining or awarding authoritative XP.
- Deciding whether a transaction is valid.
- Signing or submitting transactions.
- Producing executable program instructions.
- Receiving private keys, seed phrases, or unnecessary wallet history.

Use strict structured output validation. If the provider is unavailable, return deterministic template dialogue so the core app remains usable.

## 10. Success criteria

A first-time user can connect a Devnet wallet, hatch a creature, view its state, perform at least one interaction, and reach/preview an evolution path. The app clearly distinguishes confirmed on-chain state from off-chain AI narrative.

The submission demo must show at least one real Devnet transaction and a confirmed state update. Mocked UI-only blockchain behavior is insufficient.
