# Project: Chainkin Living AI Companion MVP v0.2

## Architecture
Chainkin is a living AI creature companion built on Solana Devnet.
- **Authoritative On-Chain State (Solana Anchor Program)**:
  - Account: `Creature` (115 bytes) at PDA `[b"creature", owner.key().as_ref()]`.
  - Instructions: `initialize_creature`, `perform_ritual`, `evolve`.
  - Invariants: Single creature per wallet; strictly signer-authorized (`has_one = owner`); arithmetic overflow safe (`saturating_add`); Devnet only; zero private keys; zero tokenomics/marketplace/breeding.
- **Server-Side AI Dialogue Engine (Next.js API Routes)**:
  - Client calls `/api/creature/dialogue` and `/api/creature/evolution`.
  - OpenRouter API client connects to model `liquid/lfm-3-1.7b` server-side using `OPENROUTER_API_KEY` from `env.local`.
  - Prompts dynamically incorporate on-chain creature state: species, stage, traits (curiosity, courage, empathy, ingenuity), and ritual history.
  - In-memory rate limiting by IP / wallet address with HTTP 429 responses.
  - Robust Zod validation and markdown code fence stripping with deterministic fallback on timeouts or upstream rate limits.
  - Deterministic automated tests using Vitest mocks.
- **Creature Presentation & UX (React / Tailwind Frontend)**:
  - Responsive companion dashboard on mobile, tablet, and desktop viewports.
  - Trait-aware personality UI reflecting dominant traits, emotional resonance, and creature mood.
  - Interactive creature dialogue box with user conversational actions and responsive thoughts.
  - Evolution presentation with visual flair, choice selection, and celebration.
  - Preserves all wallet-adapter signing flows, hatch modal, and ritual transactions without regression.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Workstream Architecture & Boundaries | Repository inspection, explicit file ownership, shared interfaces | M0 | R1 |
| 2 | Solana Anchor Program Security Review | Read-only security audit of Anchor program, PDA seeds, owner authority, progression, Devnet invariants | M1 (Agent C) | R4 |
| 3 | OpenRouter Model Client (`liquid/lfm-3-1.7b`) | Server-side provider-independent client reading `OPENROUTER_API_KEY` from `env.local` | M2 (Agent A) | R2 |
| 4 | In-Memory Server-Side Rate Limiter | IP and wallet-based rate limiting returning standard HTTP 429 status when limit exceeded | M2 (Agent A) | R2 |
| 5 | Trait-Aware Dialogue Prompt Construction | Dynamic prompts incorporating creature stage, level, XP, traits, and ritual history | M2 (Agent A) | R2 |
| 6 | Structured Output Validation & Fallback | Zod validation of AI response with deterministic fallback on upstream error/timeout | M2 (Agent A) | R2 |
| 7 | AI Dialogue Deterministic Mock Tests | Vitest test suite testing prompts, rate limiting, and fallbacks with deterministic mocks | M2 (Agent A) | R2 |
| 8 | Creature Presentation & Personality UI | Visual personality display reflecting traits, emotional resonance, and creature stage | M3 (Agent B) | R3 |
| 9 | Interactive Creature Dialogue Experience | Upgraded dialogue box with conversational interactions and dynamic thought presentation | M3 (Agent B) | R3 |
| 10 | Evolution Presentation & Milestone UX | Enhanced evolutionary path selection, visual celebration, and stage transformation | M3 (Agent B) | R3 |
| 11 | Responsive Frontend Layout Enhancements | Cross-viewport polish (mobile, tablet, desktop) preserving wallet & ritual transactions | M3 (Agent B) | R3 |
| 12 | End-to-End System Verification & Audit | All unit/integration tests pass (`cargo test`, `vitest`), clean lint/typecheck, forensic integrity audit | M4 (Integration & Review) | R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Survey & Architecture Setup | Map repo, verify baselines, define file ownership and interfaces | none | DONE |
| M1 | Solana Security Audit (Agent C) | Read-only audit report verifying PDA seeds, authority checks, cooldowns, Devnet invariants | M0 | DONE |
| M2 | AI Engineering & Dialogue (Agent A) | OpenRouter client, rate limiting, trait-aware prompts, structured output, mock tests | M0 | DONE |
| M3 | Creature Experience UX (Agent B) | Personality UI, interactive dialogue, evolution presentation, responsive enhancements | M0 | DONE |
| M4 | Final Integration, Review & Forensic Audit | Verification across all suites (`cargo test`, `vitest`, `typecheck`, `build`), dual review, forensic audit | M1, M2, M3 | DONE |

## Code Layout & Explicit File Ownership

### Workstream File Ownership
1. **Agent C (Solana Security Review)**:
   - Scope: Read-only security audit.
   - Output: `.agents/teamwork/solana_security_audit/security_audit_report.md`.
   - Modifies NO application or program source files.

2. **Agent A (AI Engineering)**:
   - Exclusive ownership:
     - `lib/ai/types.ts` (enrich dialogue context with traits & ritual history, rate limit schemas)
     - `lib/ai/rateLimit.ts` (new in-memory IP/wallet rate limiter returning 429)
     - `lib/ai/openrouter.ts` (new OpenRouter client for `liquid/lfm-3-1.7b`)
     - `app/api/creature/dialogue/route.ts` (integrate rate limiter, OpenRouter, trait-aware prompts, Zod validation)
     - `app/api/creature/evolution/route.ts` (integrate rate limiter, OpenRouter, Zod validation)
     - `lib/ai/fallback.ts` (maintain deterministic fallbacks)
     - `lib/ai/client.ts` (client fetchers handling 429 status and passing traits/wallet)
     - `tests/ai.test.ts` (new deterministic mock tests for AI dialogue, rate limiter, and fallbacks)
     - `.env.example` (document `OPENROUTER_API_KEY`)

3. **Agent B (Creature Experience UX)**:
   - Exclusive ownership:
     - `components/creature/CreatureAvatar.tsx` (trait-reactive visual animations and species graphics)
     - `components/creature/TraitBar.tsx` (personality resonance, trait display, and archetype balance)
     - `components/creature/DialogueBox.tsx` (interactive conversational experience, thought display, mood indicators)
     - `components/creature/CreatureCard.tsx` (creature dashboard presentation, personality overview, evolution status)
     - `components/creature/EvolutionModal.tsx` (enhanced evolution celebration and stage presentation)
     - `components/creature/HatchModal.tsx` (hatch experience presentation)
     - `components/creature/RitualPanel.tsx` (ritual visual responsiveness and action status)
     - `app/page.tsx` (dashboard layout, interactive dialogue integration, responsive container)
     - `app/globals.css` (visual animations, glows, and responsive styling)

4. **Shared / Read-Only Interfaces**:
   - `lib/creature/types.ts`: Authoritative domain schemas (`CreatureState`, `SPECIES_CATALOG`, `RITUAL_CATALOG`, `EVOLUTION_CATALOG`). Shared contracts.
   - `programs/chainkin/*`: On-chain Anchor program. Read-only for Agents A & B.
   - `lib/solana/*`: Solana transaction builders and RPC connection. Read-only for Agents A & B.
   - `components/wallet/*`: Devnet wallet adapter and network banner. Read-only for Agents A & B.

## Interface Contracts

### 1. Dialogue Context Contract (`lib/ai/types.ts`)
```typescript
export const DialogueContextSchema = z.object({
  species: z.number().int().min(0).max(2),
  speciesName: z.string().min(1),
  name: z.string().min(1).max(32),
  level: z.number().int().min(1).max(4),
  xp: z.number().int().nonnegative(),
  evolutionStage: z.number().int().min(0).max(1),
  evolutionName: z.string().optional(),
  recentRitual: z.enum(["none", "observe", "bond", "explore"]),
  traits: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(), // [curiosity, courage, empathy, ingenuity]
  ritualCount: z.number().int().nonnegative().optional(),
  walletAddress: z.string().optional(),
});
export type DialogueContext = z.infer<typeof DialogueContextSchema>;
```

### 2. Dialogue Response Contract (`lib/ai/types.ts`)
```typescript
export const DialogueResponseSchema = z.object({
  mood: z.string().max(30),
  speech: z.string().max(200),
  thought: z.string().max(200),
  narrativeInsight: z.string().max(250),
  isFallback: z.boolean().default(false),
});
export type DialogueResponse = z.infer<typeof DialogueResponseSchema>;
```

### 3. Rate Limiting Contract (`lib/ai/rateLimit.ts`)
```typescript
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}
export function checkRateLimit(identifier: string, limitPerMinute?: number): RateLimitResult;
export function createRateLimitResponse(result: RateLimitResult): Response; // Returns HTTP 429 with Retry-After header
```

### 4. Interactive Dialogue Action Contract (`components/creature/DialogueBox.tsx` & `app/page.tsx`)
- Props:
  - `dialogue: DialogueResponse | null`
  - `isLoading: boolean`
  - `onRefresh: () => void`
  - `onInteract?: (action: "talk" | "comfort" | "ponder") => void`
  - `creature: CreatureState`
