# Empirical Challenge Report & Handoff: AI Rate Limiting, Prompt Generation & Fallback Resilience

**Verdict**: **APPROVE**
**Risk Assessment**: **LOW**

---

## 1. Observation

### 1.1 Files Inspected and Challenged
- `lib/ai/rateLimit.ts`:
  - Lines 12-56: `checkRateLimit` sliding-window in-memory limiter with `Map<string, number[]>`.
  - Lines 76-89: `getClientIp` reading `x-forwarded-for` (first comma-separated entry), `x-real-ip`, fallback `"127.0.0.1"`.
  - Lines 95-116: `checkRequestRateLimit` dual composite check on `ip:${ip}` and `wallet:${walletAddress.trim()}`.
  - Lines 121-142: `createRateLimitResponse` returning HTTP 429 with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
- `lib/ai/openrouter.ts`:
  - Lines 45-105: `buildCreatureDialoguePrompt` constructing prompt with species, level, XP, all 4 traits, dominant trait calculation, recent ritual, ritual count, and base vs evolved forms.
  - Lines 110-127: `extractJsonFromMarkdown` stripping ```` ```(?:json)?\s*([\s\S]*?)\s*``` ```` or substring between first `{` and last `}`.
- `app/api/creature/dialogue/route.ts` & `app/api/creature/evolution/route.ts`:
  - Enforce `checkRequestRateLimit`, catch upstream errors and JSON parse failures, returning deterministic fallbacks.
- `lib/ai/client.ts`:
  - Gracefully handles HTTP 429 and network errors by returning deterministic fallbacks without unhandled promise rejections.

### 1.2 Empirical Test Execution
Created empirical challenge harness at `tests/empirical_challenge.test.ts` (15 test suites).

1. **Test Suite Execution (`npm test`)**:
   ```
   RUN  v2.1.9 /home/axel/Development/CHAINKIN

   ✓ tests/domain.test.ts (6)
   ✓ tests/coder.test.ts (5)
   ✓ tests/integration.test.ts (3)
   ✓ tests/ai.test.ts (30)
   ✓ tests/empirical_challenge.test.ts (15)

   Test Files  5 passed (5)
        Tests  58 passed | 1 skipped (59)
     Duration  1.07s
   ```

2. **TypeScript Compilation (`npm run typecheck`)**:
   ```
   > chainkin@0.1.0 typecheck
   > tsc --noEmit
   (0 errors)
   ```

3. **ESLint (`npm run lint`)**:
   ```
   > chainkin@0.1.0 lint
   > next lint

   ✔ No ESLint warnings or errors
   ```

4. **Production Build (`npm run build`)**:
   ```
   ✓ Compiled successfully
   ✓ Linting and checking validity of types
   ✓ Collecting page data
   ✓ Generating static pages (4/4)
   Route (app)                              Size     First Load JS
   ┌ ○ /                                    160 kB          333 kB
   ├ ○ /_not-found                          875 B          88.7 kB
   ├ ƒ /api/creature/dialogue               0 B                0 B
   └ ƒ /api/creature/evolution              0 B                0 B
   ```

5. **Anchor Program Tests (`cargo test`)**:
   ```
   test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
   ```

---

## 2. Logic Chain

1. **Rapid Burst Rate Limiting**:
   - *Observation*: In `tests/empirical_challenge.test.ts` line 34, a burst of 100 requests was sent with `limit = 10`.
   - *Result*: Exactly 10 requests returned `success: true` with sequential remaining counts (9 down to 0). All 90 subsequent requests returned `success: false`, `remaining: 0`, and `resetMs > 0`.
   - *Concurrency*: A concurrent burst of 50 asynchronous promises via `Promise.all` with `limit = 7` yielded exactly 7 successes and 43 rejections.
   - *Deduction*: Sliding window maintains state under synchronous and concurrent bursts.

2. **HTTP 429 Header Compliance**:
   - *Observation*: Inspected headers on `createRateLimitResponse(rejected)` in `tests/empirical_challenge.test.ts` line 57.
   - *Result*: Status was 429; `Retry-After` was integer seconds >= 1; `X-RateLimit-Limit` was "10"; `X-RateLimit-Remaining` was "0"; `X-RateLimit-Reset` was future epoch seconds.
   - *Deduction*: Complies with RFC 6585 and rate limiting standards.

3. **Independent IP and Wallet Address Tracking**:
   - *Observation*: Tested combinations in `tests/empirical_challenge.test.ts` lines 86-127.
   - *Result*:
     - When IP1 is exhausted, requests from IP2 with fresh WalletB succeed (`success: true`).
     - When WalletA is exhausted, requests from fresh IP2 using WalletA fail (`success: false`).
     - When IP1 is exhausted, requests from IP1 using fresh WalletB fail (`success: false`).
     - Composite check `checkRequestRateLimit` returns the lower remaining quota when both are valid.
   - *Deduction*: IP and wallet rate limits operate independently and composite checks prevent wallet hopping on a single IP as well as IP proxy rotation with the same wallet.

4. **Dynamic Trait-Aware Prompt Construction Across Species Matrix**:
   - *Observation*: Matrix tested all 3 species (`Wisp`, `Bytebeast`, `Mossling`) across dominant trait permutations (`Curiosity`, `Courage`, `Empathy`, `Ingenuity`), ritual types (`none`, `observe`, `bond`, `explore`), ritual counts (0, 3, 12, 999), and evolution stages (Base Form vs Evolved Form with custom name).
   - *Result*: Every generated prompt incorporated the exact species name, creature name, level, XP, four trait scores, dominant trait calculation, ritual history resonance, and appropriate stage demeanor without exceptions.

5. **Markdown Stripping and Zod Validation Resilience**:
   - *Observation*: Evaluated `extractJsonFromMarkdown` with standard ```` ```json ```` fences, bare ```` ``` ```` fences, uppercase ```` ```JSON ```` fences, conversational preambles/postambles, embedded raw JSON, and internal curly braces within string values.
   - *Result*: All adversarial inputs parsed cleanly and validated against `DialogueResponseSchema`.
   - *Fault Tolerance*: When OpenRouter returns malformed non-JSON or gateway timeouts (504), route handlers safely catch the error and return `isFallback: true` with deterministic dialogue/narrative payloads without server crash or unhandled rejection.

---

## 3. Caveats

- **Process-Memory Scope**: The in-memory rate limiter stores state in the local Node.js process `Map`. In a multi-instance serverless autoscaling cluster, state is not shared across nodes (which is standard for local/hackathon deployments and avoids external Redis dependencies).
- **Consuming Quota on Dual Rejection**: If an IP's request succeeds but the attached wallet address is rate-limited, the IP's quota slot was already consumed before returning 429. This is defensive behavior preventing abusive wallet-spamming loops from that IP, but means bad wallet requests consume IP quota.

---

## 4. Conclusion

**Verdict: APPROVE**

The AI dialogue subsystem, OpenRouter integration, in-memory rate limiter, prompt construction engine, markdown parser, and fallback resilience meet all requirements in `PROJECT_SPEC.md` and `PROJECT.md` under empirical stress testing:
- Rate limits accurately reject traffic exceeding limits with standard HTTP 429 and RFC headers.
- IP and wallet identifiers are isolated and enforced independently.
- Prompt construction is verified across all species, traits, levels, and ritual variations.
- Markdown stripping and schema validation handle messy LLM outputs cleanly with deterministic fallback protection.

---

## 5. Verification Method

To independently verify all findings:

1. **Run Full Test Suite (including empirical challenge harness)**:
   ```bash
   npm test
   ```
   *Expected result*: 5 test files pass (58 tests pass, 1 skipped).

2. **Run TypeScript Check & Linter**:
   ```bash
   npm run typecheck && npm run lint
   ```
   *Expected result*: 0 errors, 0 warnings.

3. **Run Production Build**:
   ```bash
   npm run build
   ```
   *Expected result*: Exit code 0, all routes generated successfully.

4. **Run Anchor Program Tests**:
   ```bash
   cargo test --manifest-path programs/chainkin/Cargo.toml
   ```
   *Expected result*: 4 passed; 0 failed.

---

## Challenge Report

### Overall Risk Assessment: LOW

### Challenges

#### [Low] Challenge 1: IP Quota Decrement on Wallet Rejection
- **Assumption challenged**: IP and wallet checks should rollback if the second check fails.
- **Attack scenario**: A user with an exhausted wallet attempts requests from an IP, exhausting that IP's quota for other wallets.
- **Blast radius**: Low. Standard anti-abuse behavior in edge proxies; prevents abusive requests from consuming server compute.
- **Mitigation**: Current implementation is sound. If multi-user shared NAT proxies (e.g. university Wi-Fi) become a concern in v1.0, a two-phase check can verify both limits before recording timestamps.

#### [Low] Challenge 2: Non-JSON Code Blocks Prior to JSON
- **Assumption challenged**: LLM output contains only a single markdown code fence.
- **Attack scenario**: LLM outputs a python code snippet before the JSON object.
- **Blast radius**: Low. Handled cleanly by route try/catch, safely activating deterministic fallback.
- **Mitigation**: Existing fallback mechanism prevents server-side failure.

### Stress Test Results

- Burst 100 requests (limit 10) → Exactly 10 allowed, 90 rejected with HTTP 429 → PASS
- Concurrent 50 async requests (limit 7) → Exactly 7 allowed, 43 rejected → PASS
- HTTP 429 headers (`Retry-After`, `X-RateLimit-*`) → All present and RFC-compliant → PASS
- Independent IP vs Wallet isolation → Exhausted IP does not leak to fresh IP, exhausted wallet blocks across IPs → PASS
- Sliding window time release (fake timers +60s) → Quota properly restored → PASS
- Invalid / negative `AI_RATE_LIMIT_PER_MINUTE` → Safely falls back to default 10 → PASS
- Prompt generation (3 species x 4 dominant traits x rituals x evolution) → Exact prompt match → PASS
- Adversarial markdown stripping (fences, preamble, postamble, internal braces) → Clean extraction and Zod validation → PASS
- Malformed / truncated LLM text in routes → Deterministic fallback activated (200 with `isFallback: true`) → PASS
- Client fetcher HTTP 429 resilience → Fallback returned without client exception → PASS
- Evolution route rate limiting → Exactly 10 passed, 11th received 429 → PASS

### Unchallenged Areas

- Multi-region distributed Redis caching (out of scope for in-memory hackathon MVP).
