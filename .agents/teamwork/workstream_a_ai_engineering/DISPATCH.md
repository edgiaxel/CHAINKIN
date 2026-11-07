## 2026-11-07T16:49:47Z
Your identity: teamwork_worker
Your working directory: /home/axel/Development/CHAINKIN/.agents/teamwork/workstream_a_ai_engineering/
Parent conversation ID: 299f76c5-7437-4c90-9377-741e9f6d5b8c

Objective:
Implement Milestone M2 (Requirement R2 — Live AI Dialogue and Trait-Aware Personality) for Chainkin.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mandatory first actions:
1. Read /home/axel/Development/CHAINKIN/.agents/teamwork/ORIGINAL_REQUEST.md.
2. Read /home/axel/Development/CHAINKIN/.agents/teamwork/PROJECT.md for architecture, contracts, and file boundaries.
3. Read /home/axel/Development/CHAINKIN/AGENTS.md.
4. Read /home/axel/Development/CHAINKIN/.agents/teamwork/teamwork_explorer_survey_3/handoff.md for survey insights.

Explicit File Ownership (Agent A):
You exclusively own and may edit or create these files:
- `lib/ai/types.ts`
- `lib/ai/rateLimit.ts` (create)
- `lib/ai/openrouter.ts` (create)
- `app/api/creature/dialogue/route.ts`
- `app/api/creature/evolution/route.ts`
- `lib/ai/fallback.ts`
- `lib/ai/client.ts`
- `tests/ai.test.ts` (create)
- `.env.example`
DO NOT touch any files in `components/creature/`, `app/page.tsx`, `programs/chainkin/`, or `lib/solana/`.

Tasks to Implement:
1. OpenRouter Integration (`lib/ai/openrouter.ts`):
   - Model `liquid/lfm-3-1.7b` behind provider-independent interface.
   - Read `OPENROUTER_API_KEY` (with fallback to `AI_API_KEY`) from environment server-side. Never expose to frontend.
   - Support timeout and clean error handling.
2. Server-Side Rate Limiter (`lib/ai/rateLimit.ts`):
   - In-memory rate limiting by IP (from request headers like `x-forwarded-for`) and by wallet address if provided.
   - Return standard HTTP 429 status with `Retry-After` header when limit exceeded.
   - Allow configurable window (e.g. 10 requests per minute).
3. Dynamic Trait-Aware Prompts (`app/api/creature/dialogue/route.ts`):
   - Incorporate creature stage, level, xp, traits (`curiosity`, `courage`, `empathy`, `ingenuity`), and ritual history from on-chain state into prompt construction.
   - Update `DialogueContextSchema` in `lib/ai/types.ts` and `fetchCreatureDialogue` in `lib/ai/client.ts`.
4. Structured Output Validation & Robust Fallback:
   - Validate upstream AI response using Zod schema.
   - Strip markdown code fences (```json ... ```) if present.
   - Deterministic fallback to `getFallbackDialogue` if model fails, times out, or is rate-limited.
5. Automated Deterministic Tests (`tests/ai.test.ts`):
   - Write comprehensive tests with Vitest mocks (`vi.spyOn(global, 'fetch')`) verifying:
     * Successful structured dialogue response parsing.
     * Trait-aware prompt generation.
     * Rate limiting enforcement returning HTTP 429 when thresholds exceeded.
     * Fallback activation on upstream error, timeout, or 429.
     * At most one controlled live connectivity smoke test (skipped or opt-in if no key/network).
6. Verification:
   - Run `npm test` (all tests in `tests/` must pass, including existing and new).
   - Run `npm run typecheck` and `npm run lint`.
   - Run `npm run build`.
   - Document commands and results in handoff report.
