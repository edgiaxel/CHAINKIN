## 2026-11-07T16:38:41Z

Organize the team into three specialized workstreams (Agent A — AI Engineering, Agent B — Creature Experience, Agent C — Solana Security Review) with a Main Orchestrator to turn Chainkin into a living AI creature companion while preserving the existing working Solana Devnet MVP functionality.

Working directory: /home/axel/Development/CHAINKIN
Integrity mode: demo
The team must NOT: copy code from existing open-source projects for core logic, run external scripts or delegate execution to other tools

## Requirements

### R1. Repository Inspection and Workstream Architecture (Main Orchestrator)
Inspect the entire repository and verify the actual implementation against code and tests rather than trusting documentation or checkboxes. Establish explicit file ownership, shared interfaces, and task boundaries across workstreams before parallel implementation begins. Ensure architecture, integration, conflict resolution, and final verification uphold all project rules.

### R2. Live AI Dialogue and Trait-Aware Personality (Agent A — AI Engineering)
Integrate OpenRouter using model `liquid/lfm-3-1.7b` behind a provider-independent interface, reading the API key from `env.local` server-side without exposing secrets to frontend code. Construct creature dialogue prompts that dynamically reflect on-chain creature state (stage and rituals performed). Implement structured output validation, server-side in-memory rate limiting by IP/wallet to prevent abuse, and automated tests using deterministic mocks to conserve API rate limits.

### R3. Creature Experience and Presentation UX (Agent B — Creature Experience)
Deliver creature presentation improvements, a personality UI reflecting creature state, an interactive dialogue experience, evolution presentation, and responsive frontend enhancements across viewport sizes while preserving all existing wallet and ritual flows.

### R4. Solana Anchor Program Security Review (Agent C — Solana Security Review)
Perform a read-only security audit of the Anchor program, PDA ownership, transaction handling, progression rules, cooldowns, and test coverage, documenting findings and verifying that Devnet constraints and security invariants hold.

### R5. System Constraints and Integration
Preserve all existing working Solana Devnet functionality. The system must operate strictly on Solana Devnet (never Mainnet), use wallet-adapter signing flows (never touch private keys or seed phrases), and contain no marketplace, breeding, multiplayer, or tokenomics mechanics.

## Acceptance Criteria

### Workstream Setup & Integrity
- [ ] Initial repository inspection is documented and explicit file ownership boundaries are established before implementation begins.
- [ ] No code is copied from existing open-source projects for core logic, and no external scripts or tools are delegated execution.

### AI Provider & Dialogue Engine
- [ ] OpenRouter API client connects to model `liquid/lfm-3-1.7b` using `OPENROUTER_API_KEY` from `env.local` server-side.
- [ ] Public AI endpoints enforce server-side in-memory rate limiting by IP/wallet and return standard 429 status when exceeded.
- [ ] AI prompt construction incorporates creature stage and ritual history dynamically from on-chain data.
- [ ] AI responses adhere to structured output validation with deterministic fallback if the upstream model fails or is rate-limited.
- [ ] Automated tests for AI dialogue execute deterministically with mocks, accompanied by at most one controlled live connectivity smoke test.

### Creature UX
- [ ] Creature interface displays personality traits, dialogue interactions, and evolution milestones responsively.
- [ ] Existing wallet connection, creature initialization, and ritual execution work without regression.

### Solana Anchor Security
- [ ] Read-only security audit verifies PDA seeds (`[b"creature", owner]`), authority checks, progression state increments, and cooldown enforcements.
- [ ] Security audit report details findings and confirms zero unaddressed critical vulnerabilities.

### System Verification
- [ ] All existing tests (`cargo test`, `vitest`), type checks, and linters pass cleanly with new tests covering v0.2 functionality.
- [ ] No private keys or seed phrases are accessed or stored.
- [ ] No marketplace, breeding, multiplayer, or tokenomics code exists in the codebase.
