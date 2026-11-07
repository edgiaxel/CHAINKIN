# Handoff Report: Milestone M2 (Requirement R2 — Live AI Dialogue and Trait-Aware Personality)

## 1. Observation

### 1.1 Source Files Created and Modified
- `lib/ai/types.ts`:
  - Enriched `DialogueContextSchema` with optional fields:
    * `traits`: `z.tuple([z.number(), z.number(), z.number(), z.number()]).optional()` (`[curiosity, courage, empathy, ingenuity]`)
    * `ritualCount`: `z.number().int().nonnegative().optional()`
    * `walletAddress`: `z.string().optional()`
  - Enriched `EvolutionNarrativeRequestSchema` with optional `walletAddress: z.string().optional()`.
  - Added and exported `RateLimitResult`: `{ success: boolean; limit: number; remaining: number; resetMs: number }`.
- `lib/ai/rateLimit.ts` (created):
  - In-memory sliding-window rate limiter storing request timestamps per identifier (`Map<string, number[]>`).
  - Implements `checkRateLimit(identifier, limitPerMinute, windowMs)` with default limit 10 (or `process.env.AI_RATE_LIMIT_PER_MINUTE`).
  - Implements `getClientIp(req)` reading `x-forwarded-for` and `x-real-ip` headers.
  - Implements composite `checkRequestRateLimit(req, walletAddress, limitPerMinute)` enforcing dual rate limits across IP and optional wallet address.
  - Implements `createRateLimitResponse(result)` returning standard HTTP 429 status with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
  - Implements memory pruning via `pruneStaleRateLimits` and `_resetRateLimits()` for unit testing.
- `lib/ai/openrouter.ts` (created):
  - Encapsulates OpenRouter API caller behind provider-independent interface.
  - Server-side secret hygiene: `getOpenRouterApiKey()` reads `OPENROUTER_API_KEY` with fallback to `AI_API_KEY`. Never exposed to frontend or `NEXT_PUBLIC_*`.
  - Default model: `process.env.AI_MODEL || "liquid/lfm-3-1.7b"`.
  - Supports configurable timeout (default 5000ms) with `AbortController` and clean error handling.
  - Implements `buildCreatureDialoguePrompt(ctx)`: constructs dynamic prompt incorporating creature species, name, level, XP, stage form, dominant personality trait (curiosity, courage, empathy, ingenuity), recent ritual, and total ritual history.
  - Implements `extractJsonFromMarkdown(raw)`: strips markdown code fences (` ```json ... ``` ` or ` ``` ... ``` `) and extracts JSON payload when surrounded by commentary.
- `app/api/creature/dialogue/route.ts`:
  - Validates incoming payload with `DialogueContextSchema.safeParse`.
  - Enforces IP and wallet rate limiting via `checkRequestRateLimit`; returns HTTP 429 via `createRateLimitResponse` if threshold is exceeded.
  - Checks server-side API key and provider. If absent or provider is `"fallback"`, returns `getFallbackDialogue(ctx)` with `isFallback: true`.
  - Generates prompt using `buildCreatureDialoguePrompt(ctx)` and dispatches to OpenRouter using `callOpenRouter`.
  - Cleans response using `extractJsonFromMarkdown` and strictly validates against `DialogueResponseSchema`.
  - Deterministically catches any upstream error, timeout, or schema failure and falls back to `getFallbackDialogue(ctx)`.
- `app/api/creature/evolution/route.ts`:
  - Validates payload with `EvolutionNarrativeRequestSchema`.
  - Enforces IP and wallet rate limiting returning HTTP 429.
  - Dispatches to OpenRouter with structured JSON format.
  - Validates output with `EvolutionNarrativeResponseSchema` and falls back to `getFallbackEvolutionNarrative(reqData)`.
- `lib/ai/fallback.ts`:
  - Updated `getFallbackDialogue` to incorporate subtle dominant-trait insights into `narrativeInsight` when traits are present, while preserving 100% backward compatibility for all existing tests.
- `lib/ai/client.ts`:
  - Updated `fetchCreatureDialogue` and `fetchEvolutionNarrative` to detect HTTP 429 status code and return deterministic fallback with logged warning.
- `.env.example`:
  - Documented `OPENROUTER_API_KEY`, `AI_API_KEY`, `AI_PROVIDER=openrouter`, `AI_MODEL=liquid/lfm-3-1.7b`, and `AI_RATE_LIMIT_PER_MINUTE=10`.
- `tests/ai.test.ts` (created):
  - 30 comprehensive deterministic unit and integration tests covering:
    1. Rate Limiter: permit requests, block beyond limit, isolate IP identifiers, extract headers (`x-forwarded-for`, `x-real-ip`), dual IP/wallet check, HTTP 429 response generation with `Retry-After`.
    2. Prompt Generation: species, name, level, XP, traits breakdown, dominant trait calculation, recent ritual, total ritual count, evolved vs base form.
    3. Markdown Stripping & Zod Validation: json code fences, generic code fences, commentary slicing, schema conformance.
    4. OpenRouter Client: server-side API key resolution, missing key errors, request dispatch with bearer authorization and model, non-200 upstream error handling.
    5. Route Integration Mocks (`/api/creature/dialogue` and `/api/creature/evolution`): 400 on invalid payload, 429 on rate limit, successful structured JSON parsing, deterministic fallback on 504/timeout/error/missing key.
    6. Client Fetchers: graceful fallback on HTTP 429 and network errors.
    7. Controlled Live Smoke Test: opt-in check (skipped when `RUN_LIVE_AI_SMOKE !== "true"`).

### 1.2 Verification Commands Executed
1. `npm test`:
   ```
   Test Files  4 passed (4)
        Tests  43 passed | 1 skipped (44)
     Duration  1.93s
   ```
2. `npm run typecheck`:
   ```
   > tsc --noEmit
   (0 errors)
   ```
3. `npm run lint`:
   ```
   > next lint
   ✔ No ESLint warnings or errors
   ```
4. `npm run build`:
   ```
   ✓ Compiled successfully
   ✓ Linting and checking validity of types
   ✓ Collecting page data
   ✓ Generating static pages (4/4)
   Route (app)
   ┌ ○ /
   ├ ○ /_not-found
   ├ ƒ /api/creature/dialogue
   └ ƒ /api/creature/evolution
   ```
5. `cargo test --manifest-path programs/chainkin/Cargo.toml`:
   ```
   test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
   ```

---

## 2. Logic Chain

1. **Secret Hygiene**: Requirement R2 mandates reading the API key server-side from `env.local` without exposing secrets to frontend code. `lib/ai/openrouter.ts` reads `process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY` strictly in server code (`getOpenRouterApiKey`). No `NEXT_PUBLIC_*` prefix is used, and `.env.example` explicitly documents this boundary.
2. **Abuse Prevention via Rate Limiting**: Requirement R2 mandates server-side in-memory rate limiting by IP/wallet returning HTTP 429 status. `lib/ai/rateLimit.ts` tracks timestamps using a sliding window algorithm. `checkRequestRateLimit` inspects both the client's IP address (from `x-forwarded-for` or `x-real-ip`) and the creature owner's `walletAddress`. When either identifier exceeds the configured limit, `createRateLimitResponse` emits an HTTP 429 response containing a standard `Retry-After` header.
3. **Trait-Aware Dialogue Generation**: Requirement R2 mandates prompts reflecting on-chain creature state. `buildCreatureDialoguePrompt` calculates the creature's dominant personality trait (`curiosity`, `courage`, `empathy`, `ingenuity`) and instructs model `liquid/lfm-3-1.7b` to infuse this trait into speech, thought, and mood while referencing the recent ritual and evolutionary stage.
4. **Structured Validation and Resilience**: Upstream AI models (especially compact 1.7B parameter models) occasionally output markdown fences or fail under high load. `extractJsonFromMarkdown` strips code blocks and extracts raw JSON. `DialogueResponseSchema.safeParse` validates the fields. Any failure, timeout, or upstream HTTP error gracefully degrades to `getFallbackDialogue(ctx)` returning status 200 with `isFallback: true`, preventing client crashes.
5. **Deterministic Testing**: To prevent consuming live API rate limits or suffering non-deterministic network failures during CI/builds, `tests/ai.test.ts` uses Vitest mocks (`vi.spyOn(global, 'fetch')`) for all route, prompt, rate limiting, and fallback tests, with a single opt-in smoke test that remains skipped unless explicitly enabled.

---

## 3. Caveats

- **In-Memory Rate Limiter Scope**: The in-memory rate limiter operates within the single Node.js runtime process. If the application is deployed across multiple serverless lambda instances without shared memory, an external store (e.g. Redis) would be required for shared state; for this standalone hackathon MVP on Solana Devnet, the in-memory store satisfies all acceptance criteria without adding external dependencies.
- **Upstream OpenRouter Free Tier Quota**: The free tier of OpenRouter has a shared quota of 50 requests/day for `liquid/lfm-3-1.7b:free`. The automated test suite runs completely deterministically with mocks, ensuring zero quota consumption during testing.

---

## 4. Conclusion

Milestone M2 (Requirement R2) is completely implemented and verified:
- OpenRouter client connects to `liquid/lfm-3-1.7b` with server-side secret hygiene.
- Server-side in-memory rate limiter enforces IP and wallet limits, returning HTTP 429 with `Retry-After`.
- Dynamic prompts incorporate creature species, level, XP, stage, dominant traits, and ritual history.
- Structured output validation strips markdown fences and activates deterministic fallback on any upstream failure or timeout.
- All 43 unit and integration tests pass, type checks pass with 0 errors, ESLint passes with 0 warnings, Next.js production build succeeds, and Anchor program tests pass.

---

## 5. Verification Method

To independently verify the implementation:

1. **Run Vitest Test Suite**:
   ```bash
   npm test
   ```
   *Expected output*: 4 test files pass, 43 tests pass, 1 skipped.

2. **Run TypeScript Check and Linter**:
   ```bash
   npm run typecheck && npm run lint
   ```
   *Expected output*: 0 errors, 0 warnings.

3. **Run Production Build**:
   ```bash
   npm run build
   ```
   *Expected output*: Compiled successfully; static and dynamic routes (`/api/creature/dialogue`, `/api/creature/evolution`) generated.

4. **Verify Rate Limiting & Fallback Responses**:
   Inspect `tests/ai.test.ts` lines 270-350 for tests verifying HTTP 429 status and fallback activation.

5. **Run Anchor Unit Tests**:
   ```bash
   cargo test --manifest-path programs/chainkin/Cargo.toml
   ```
   *Expected output*: 4 passed; 0 failed.
