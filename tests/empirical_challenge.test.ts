import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  checkRequestRateLimit,
  createRateLimitResponse,
  getClientIp,
  _resetRateLimits,
} from "@/lib/ai/rateLimit";
import {
  buildCreatureDialoguePrompt,
  extractJsonFromMarkdown,
  callOpenRouter,
} from "@/lib/ai/openrouter";
import {
  DialogueContext,
  DialogueContextSchema,
  DialogueResponseSchema,
  EvolutionNarrativeResponseSchema,
} from "@/lib/ai/types";
import { SPECIES_CATALOG, SPECIES_IDS } from "@/lib/creature/types";
import { POST as dialoguePost } from "@/app/api/creature/dialogue/route";
import { POST as evolutionPost } from "@/app/api/creature/evolution/route";
import { fetchCreatureDialogue, fetchEvolutionNarrative } from "@/lib/ai/client";
import { NextRequest } from "next/server";

describe("Empirical Challenge: Rate Limiter Stress Harness", () => {
  beforeEach(() => {
    _resetRateLimits();
  });

  it("burst test: allows exactly N requests and rejects subsequent with 429", () => {
    const identifier = "ip:192.168.1.100";
    const limit = 10;
    const totalRequests = 100;
    const results = [];

    for (let i = 0; i < totalRequests; i++) {
      results.push(checkRateLimit(identifier, limit));
    }

    const successes = results.filter((r) => r.success);
    const rejections = results.filter((r) => !r.success);

    expect(successes).toHaveLength(limit);
    expect(rejections).toHaveLength(totalRequests - limit);

    // Verify remaining decrements from 9 down to 0
    successes.forEach((r, idx) => {
      expect(r.remaining).toBe(limit - 1 - idx);
      expect(r.limit).toBe(limit);
    });

    // Verify rejections have remaining = 0 and resetMs > 0
    rejections.forEach((r) => {
      expect(r.remaining).toBe(0);
      expect(r.resetMs).toBeGreaterThan(0);
    });

    // Test createRateLimitResponse on a rejected result
    const rejectedRes = createRateLimitResponse(rejections[0]);
    expect(rejectedRes.status).toBe(429);
    expect(rejectedRes.headers.get("Content-Type")).toBe("application/json");
    expect(rejectedRes.headers.get("Retry-After")).toBeDefined();
    const retryAfter = Number(rejectedRes.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(rejectedRes.headers.get("X-RateLimit-Limit")).toBe(String(limit));
    expect(rejectedRes.headers.get("X-RateLimit-Remaining")).toBe("0");
    const resetTime = Number(rejectedRes.headers.get("X-RateLimit-Reset"));
    expect(resetTime).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("burst test: concurrent async requests uphold exact limit invariants", async () => {
    const identifier = "wallet:DevnetTestWalletBurst111111111111111";
    const limit = 7;
    const concurrency = 50;

    const promises = Array.from({ length: concurrency }).map(() =>
      Promise.resolve().then(() => checkRateLimit(identifier, limit))
    );

    const results = await Promise.all(promises);
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    expect(successCount).toBe(limit);
    expect(failureCount).toBe(concurrency - limit);
  });

  it("tracks IP and wallet address independently and enforces composite limits", () => {
    const ip1 = "203.0.113.1";
    const ip2 = "203.0.113.2";
    const walletA = "WalletAAA1111111111111111111111111111111";
    const walletB = "WalletBBB2222222222222222222222222222222";
    const limit = 2;

    const makeReq = (ip: string) =>
      new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": ip },
      });

    // IP1 with WalletA: 2 requests pass
    const r1 = checkRequestRateLimit(makeReq(ip1), walletA, limit);
    const r2 = checkRequestRateLimit(makeReq(ip1), walletA, limit);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    // IP1 with WalletA: 3rd request fails (both IP1 and WalletA exhausted)
    const r3 = checkRequestRateLimit(makeReq(ip1), walletA, limit);
    expect(r3.success).toBe(false);

    // IP1 with a DIFFERENT wallet (WalletB) must FAIL because IP1 is exhausted
    const r4 = checkRequestRateLimit(makeReq(ip1), walletB, limit);
    expect(r4.success).toBe(false);

    // IP2 with the EXHAUSTED wallet (WalletA) must FAIL because WalletA is exhausted
    const r5 = checkRequestRateLimit(makeReq(ip2), walletA, limit);
    expect(r5.success).toBe(false);

    // IP2 with WalletB: r5 used 1 slot on IP2, so r6 uses the 2nd and final slot on IP2
    const r6 = checkRequestRateLimit(makeReq(ip2), walletB, limit);
    expect(r6.success).toBe(true);
    expect(r6.remaining).toBe(0);

    // IP2 is now exhausted as well: 3rd request from IP2 fails
    const r7 = checkRequestRateLimit(makeReq(ip2), walletB, limit);
    expect(r7.success).toBe(false);
  });

  it("robust client IP parsing handles multiple proxies and edge whitespace", () => {
    const multiProxyReq = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "  198.51.100.25 , 10.0.0.1, 172.16.0.1" },
    });
    expect(getClientIp(multiProxyReq)).toBe("198.51.100.25");

    const realIpReq = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "  203.0.113.99  " },
    });
    expect(getClientIp(realIpReq)).toBe("203.0.113.99");

    const noHeaderReq = new Request("http://localhost/api/test");
    expect(getClientIp(noHeaderReq)).toBe("127.0.0.1");
  });

  it("sliding window accurately releases quota as time elapses", () => {
    vi.useFakeTimers();
    const id = "ip:sliding-window-test";
    const limit = 2;
    const windowMs = 60_000;

    // Use 2 slots at t=0
    expect(checkRateLimit(id, limit, windowMs).success).toBe(true);
    expect(checkRateLimit(id, limit, windowMs).success).toBe(true);

    // 3rd attempt at t=0 must fail
    expect(checkRateLimit(id, limit, windowMs).success).toBe(false);

    // Advance time by 30s: still within window, must fail
    vi.advanceTimersByTime(30_000);
    expect(checkRateLimit(id, limit, windowMs).success).toBe(false);

    // Advance time past 60s total: window cleared, request must succeed
    vi.advanceTimersByTime(30_001);
    const afterExpiry = checkRateLimit(id, limit, windowMs);
    expect(afterExpiry.success).toBe(true);
    expect(afterExpiry.remaining).toBe(1);

    vi.useRealTimers();
  });

  it("safely handles invalid or negative AI_RATE_LIMIT_PER_MINUTE env vars", () => {
    const origEnv = process.env.AI_RATE_LIMIT_PER_MINUTE;

    process.env.AI_RATE_LIMIT_PER_MINUTE = "-10";
    expect(checkRateLimit("ip:env-neg").limit).toBe(10);

    process.env.AI_RATE_LIMIT_PER_MINUTE = "garbage_string";
    expect(checkRateLimit("ip:env-nan").limit).toBe(10);

    process.env.AI_RATE_LIMIT_PER_MINUTE = "25";
    expect(checkRateLimit("ip:env-custom").limit).toBe(25);

    if (origEnv !== undefined) {
      process.env.AI_RATE_LIMIT_PER_MINUTE = origEnv;
    } else {
      delete process.env.AI_RATE_LIMIT_PER_MINUTE;
    }
  });
});

describe("Empirical Challenge: Trait-Aware Prompt Generator Matrix", () => {
  const speciesList = [
    { id: SPECIES_IDS.WISP, name: SPECIES_CATALOG[SPECIES_IDS.WISP].name },
    { id: SPECIES_IDS.BYTEBEAST, name: SPECIES_CATALOG[SPECIES_IDS.BYTEBEAST].name },
    { id: SPECIES_IDS.MOSSLING, name: SPECIES_CATALOG[SPECIES_IDS.MOSSLING].name },
  ];

  it("correctly generates prompts across all 3 species with level, XP, and trait permutations", () => {
    for (const species of speciesList) {
      const traitCases: Array<{
        traits: [number, number, number, number];
        expectedDominant: string;
      }> = [
        { traits: [50, 10, 10, 10], expectedDominant: "Curiosity (50)" },
        { traits: [10, 60, 10, 10], expectedDominant: "Courage (60)" },
        { traits: [10, 10, 70, 10], expectedDominant: "Empathy (70)" },
        { traits: [10, 10, 10, 80], expectedDominant: "Ingenuity (80)" },
      ];

      for (const tCase of traitCases) {
        const ctx: DialogueContext = {
          species: species.id,
          speciesName: species.name,
          name: `Kin-${species.name}`,
          level: 3,
          xp: 145,
          evolutionStage: 0,
          recentRitual: "explore",
          traits: tCase.traits,
          ritualCount: 12,
          walletAddress: "SolanaAddress11111111111111111111111111111",
        };

        const prompt = buildCreatureDialoguePrompt(ctx);

        expect(prompt).toContain(`You are "Kin-${species.name}"`);
        expect(prompt).toContain(`species "${species.name}"`);
        expect(prompt).toContain("Level 3");
        expect(prompt).toContain("XP 145");
        expect(prompt).toContain(`Curiosity: ${tCase.traits[0]}`);
        expect(prompt).toContain(`Courage: ${tCase.traits[1]}`);
        expect(prompt).toContain(`Empathy: ${tCase.traits[2]}`);
        expect(prompt).toContain(`Ingenuity: ${tCase.traits[3]}`);
        expect(prompt).toContain(`Dominant Trait: ${tCase.expectedDominant}`);
        expect(prompt).toContain('Recent ritual with owner: "explore"');
        expect(prompt).toContain("Total rituals on-chain: 12");
        expect(prompt).toContain("Evolution: Base Form");
      }
    }
  });

  it("handles ritual history variants (none, observe, bond, explore, count 0)", () => {
    const rituals: Array<DialogueContext["recentRitual"]> = ["none", "observe", "bond", "explore"];

    for (const r of rituals) {
      const ctx: DialogueContext = {
        species: 0,
        speciesName: "Wisp",
        name: "Lumi",
        level: 1,
        xp: 0,
        evolutionStage: 0,
        recentRitual: r,
        traits: [10, 10, 10, 10],
        ritualCount: r === "none" ? 0 : 3,
      };

      const prompt = buildCreatureDialoguePrompt(ctx);
      if (r === "none") {
        expect(prompt).toContain("No recent ritual performed. Total rituals on-chain: 0.");
      } else {
        expect(prompt).toContain(`Recent ritual with owner: "${r}". Total rituals on-chain: 3.`);
      }
    }
  });

  it("handles evolved stage with custom evolutionName", () => {
    const ctx: DialogueContext = {
      species: 1,
      speciesName: "Bytebeast",
      name: "Bolt",
      level: 4,
      xp: 220,
      evolutionStage: 1,
      evolutionName: "Cyber Warden",
      recentRitual: "bond",
      traits: [15, 25, 12, 20],
      ritualCount: 15,
    };

    const prompt = buildCreatureDialoguePrompt(ctx);
    expect(prompt).toContain('Evolution: Evolved Form "Cyber Warden" (Stage 1, Level 4, XP 220)');
    expect(prompt).toContain("Speak with elevated dignity, deep wisdom, and transcendent resonance.");
  });

  it("handles edge cases: missing traits and undefined ritual count", () => {
    const ctx: DialogueContext = {
      species: 2,
      speciesName: "Mossling",
      name: "Sprout",
      level: 1,
      xp: 5,
      evolutionStage: 0,
      recentRitual: "none",
    };

    const prompt = buildCreatureDialoguePrompt(ctx);
    expect(prompt).toContain('You are "Sprout"');
    expect(prompt).toContain("No recent ritual performed. Total rituals on-chain: 0.");
    expect(prompt).not.toContain("Dominant Trait:");
  });
});

describe("Empirical Challenge: Markdown Stripping and Zod Adversarial Stress", () => {
  it("strips complex markdown code fences and preamble/trailing chatter", () => {
    const validJsonString = JSON.stringify({
      mood: "Curious and contemplative",
      speech: "The blocks sing a harmony of transactions.",
      thought: "I wonder what the next slot brings?",
      narrativeInsight: "A luminous pulse ripples across its core.",
    });

    const adversarialPayloads = [
      // Standard fence
      `\`\`\`json\n${validJsonString}\n\`\`\``,
      // Generic fence without language tag
      `\`\`\`\n${validJsonString}\n\`\`\``,
      // Uppercase fence with extra whitespace
      `\`\`\`JSON  \n${validJsonString}\n  \`\`\``,
      // Conversational preamble and postamble
      `Hello summoner! Here is the output you requested:\n\n\`\`\`json\n${validJsonString}\n\`\`\`\n\nI hope this satisfies the ritual!`,
      // Conversational with NO fences (raw JSON embedded in text)
      `Certainly! The creature says: ${validJsonString} That concludes the dialogue.`,
      // JSON with internal braces in values
      `\`\`\`json\n${JSON.stringify({
        mood: "Testing {curly} braces",
        speech: "My {code} has {nested} braces",
        thought: "Braces {here} and {there}",
        narrativeInsight: "Insight with {brackets}",
      })}\n\`\`\``,
    ];

    for (const raw of adversarialPayloads) {
      const extracted = extractJsonFromMarkdown(raw);
      expect(() => JSON.parse(extracted)).not.toThrow();
      const parsed = JSON.parse(extracted);
      const validated = DialogueResponseSchema.safeParse(parsed);
      expect(validated.success).toBe(true);
    }
  });

  it("handles malformed JSON without throwing unhandled exceptions in route", async () => {
    _resetRateLimits();
    const originalApiKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-mock-key";

    // Mock fetch to simulate OpenRouter returning malformed non-JSON text
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "I am a creature and I refuse to speak in JSON! Here: { broken json",
            },
          },
        ],
      }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/creature/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        species: 0,
        speciesName: "Wisp",
        name: "Lumi",
        level: 1,
        xp: 10,
        evolutionStage: 0,
        recentRitual: "none",
      }),
    });

    const response = await dialoguePost(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    // Must gracefully fall back to deterministic fallback
    expect(body.isFallback).toBe(true);
    expect(body.mood).toBeDefined();
    expect(body.speech).toBeDefined();

    fetchSpy.mockRestore();
    if (originalApiKey) process.env.OPENROUTER_API_KEY = originalApiKey;
    else delete process.env.OPENROUTER_API_KEY;
  });

  it("client fetcher gracefully recovers from HTTP 429 using fallback", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      status: 429,
      ok: false,
    } as unknown as Response);

    const result = await fetchCreatureDialogue({
      species: 0,
      speciesName: "Wisp",
      name: "Lumi",
      level: 1,
      xp: 0,
      evolutionStage: 0,
      recentRitual: "none",
    });

    expect(result.isFallback).toBe(true);
    expect(result.speech.length).toBeGreaterThan(0);
    fetchSpy.mockRestore();
  });

  it("evolution route properly enforces rate limit and returns 429", async () => {
    _resetRateLimits();
    const reqData = {
      species: 1,
      name: "Bytebeast",
      level: 3,
      choiceId: 1,
      choiceName: "Cyber Warden",
      walletAddress: "WalletRateLimitTest11111111111111111111",
    };

    const makeReq = () =>
      new NextRequest("http://localhost:3000/api/creature/evolution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": "198.51.100.77",
        },
        body: JSON.stringify(reqData),
      });

    // Exhaust limit (default 10)
    for (let i = 0; i < 10; i++) {
      const res = await evolutionPost(makeReq());
      expect(res.status).toBe(200);
    }

    // 11th request must receive 429
    const blockedRes = await evolutionPost(makeReq());
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("Retry-After")).toBeDefined();
    const json = await blockedRes.json();
    expect(json.error).toBe("Too Many Requests");
  });

  it("handles tied traits and extreme values deterministically without crashing", () => {
    const tiedCtx: DialogueContext = {
      species: 0,
      speciesName: "Wisp",
      name: "Equalizer",
      level: 2,
      xp: 50,
      evolutionStage: 0,
      recentRitual: "observe",
      traits: [25, 25, 25, 25],
      ritualCount: 4,
    };

    const promptTied = buildCreatureDialoguePrompt(tiedCtx);
    expect(promptTied).toContain("Dominant Trait:");
    expect(promptTied).toContain("Curiosity: 25");
    expect(promptTied).toContain("Courage: 25");

    const extremeCtx: DialogueContext = {
      species: 2,
      speciesName: "Mossling",
      name: "Maximus",
      level: 4,
      xp: 9999,
      evolutionStage: 1,
      evolutionName: "Bloom Weaver",
      recentRitual: "explore",
      traits: [255, 0, 0, 0],
      ritualCount: 999,
    };

    const promptExtreme = buildCreatureDialoguePrompt(extremeCtx);
    expect(promptExtreme).toContain("Dominant Trait: Curiosity (255)");
    expect(promptExtreme).toContain("Total rituals on-chain: 999");
    expect(promptExtreme).toContain('Evolution: Evolved Form "Bloom Weaver"');
  });
});
