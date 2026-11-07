# Architecture and Product Decisions

Record decisions here with date, rationale, and consequences. Do not silently reverse a decision.

## D001 — Devnet only
**Decision:** All MVP blockchain work targets Solana Devnet.  
**Rationale:** Safe hackathon prototyping.  
**Consequence:** UI must display cluster; no mainnet configuration or deployment.

## D002 — Chain is authoritative
**Decision:** Ownership, creature identity, XP, traits, and evolution state are read from/validated by the Solana program.  
**Rationale:** Prevent UI/AI from fabricating progression.  
**Consequence:** Refresh state after confirmed transactions.

## D003 — AI is narrative only
**Decision:** AI generates personality, dialogue, and descriptions. It cannot award XP, choose authoritative state, sign, or submit transactions.  
**Rationale:** Security, determinism, and clear product boundaries.

## D004 — One creature per wallet
**Decision:** MVP derives one creature PDA from the owner wallet.  
**Rationale:** Simple identity and demo flow.

## D005 — No marketplace in MVP
**Decision:** Ghost Market/CreatorVault ideas are future extensions, not MVP requirements.  
**Rationale:** Protect the 24-hour build window.

## D006 — Optional AI
**Decision:** Deterministic fallback must keep the app usable without an AI provider key.  
**Rationale:** Unattended development and demo reliability.

## D007 — No required paid actions
**Decision:** User progression does not require spending tokens or repeatedly transacting.  
**Rationale:** User-friendly mechanics and avoidance of wasteful transaction incentives.
