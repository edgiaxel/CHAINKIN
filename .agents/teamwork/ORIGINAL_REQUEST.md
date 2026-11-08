# Original User Request

## Initial Request — 2026-11-07T18:22:12Z

Use a maximum of 4 specialist agents plus the main orchestrator to turn the existing Chainkin prototype into a coherent, polished, demonstrable AI-powered Solana companion application for the final submission of a Solana hackathon.

Working directory: /home/axel/Development/CHAINKIN
Integrity mode: demo
The team must NOT: copy code from existing open-source projects for core logic, run external scripts or delegate execution to other tools

## Requirements

### R1. AI Companion Engineering
Implement relevant, context-aware creature dialogue for Talk, Ponder, Comfort, and Observe interactions, as well as distinct reactions following rituals and evolution. Dialogue must reflect species, personality traits, mood, progression level, and evolution stage without species sounding identical. Validate Liquid LFM3 1.7B output via structured output validation with safe fallbacks, avoiding silent API consumption, with all API keys kept strictly server-side.

### R2. Product Experience and Frontend User Journey
Transform the creature view into a complete user journey: Welcome/Home explaining the concept and wallet link, onboarding to awaken or load a companion, a visually focused companion dashboard displaying authoritative on-chain state and traits, distinct interaction cards with clear loading/error states, transparent progression/evolution requirements and transaction approval, and a simple activity history distinguishing blockchain transactions from narrative events.

### R3. Solana and Application Integrity
Preserve existing working Solana Devnet implementation (wallet connection, PDA derivation, creature awakening, ritual transactions, XP/trait progression, and evolution transactions). Enforce server-side rate-limiting and validation on public AI endpoints. Keep blockchain state authoritative, operate solely on Solana Devnet, use wallet-adapter signing without touching private keys, and introduce no tokenomics, trading, staking, or marketplace features.

### R4. QA, Integration, and Demo Readiness
Coordinate verification across the 4 specialist workstreams and create a test plan covering first-time users, returning users, transaction rejections/failures, AI fallbacks, and progression flows. Run existing test suites (`cargo test`, `vitest`) and provide a manual end-to-end demo script, final deliverables list, and verification of working features without regressions.

## Acceptance Criteria

### User Onboarding & Experience
- [ ] Welcome/Home screen clearly introduces Chainkin, explains wallet linkage, and guides first-time users to awaken a creature.
- [ ] Returning wallets load their existing companion directly with authoritative on-chain state (species, level, stage, XP, traits, mood).
- [ ] UI provides responsive, polished layouts with clear loading, error, pending, and confirmed transaction states.

### AI Companion Dialogue
- [ ] Talk, Ponder, Comfort, and Observe actions return contextually relevant responses reflecting species, traits, mood, and stage.
- [ ] Ritual completion and evolution trigger distinct acknowledgments reflecting state changes.
- [ ] AI endpoints enforce server-side rate limits and validation; structured output parsing handles malformed responses gracefully with safe fallbacks.
- [ ] No API keys are exposed to client-side code or committed.

### Solana Integrity & Progression
- [ ] Existing Devnet wallet connection, creature awakening, ritual transactions, and evolution transactions function without regression.
- [ ] Authority and progression logic remain strictly on-chain; client cannot fabricate XP, traits, or evolution.
- [ ] No private keys or seed phrases are handled by the application; no trading, staking, or tokenomics mechanics are added.

### Integration & Verification
- [ ] All existing automated tests (`cargo test`, `vitest`), TypeScript checks, and linters pass cleanly.
- [ ] A verified manual end-to-end demo script and final implementation report detailing working features and demo steps are produced.
