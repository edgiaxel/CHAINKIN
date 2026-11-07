import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  DialogueContextSchema,
  DialogueResponseSchema,
  EvolutionNarrativeRequestSchema,
  EvolutionNarrativeResponseSchema,
  DialogueContext,
} from "@/lib/ai/types";
import {
  checkRateLimit,
  checkRequestRateLimit,
  createRateLimitResponse,
  getClientIp,
  _resetRateLimits,
} from "@/lib/ai/rateLimit";
import {
  callOpenRouter,
  extractJsonFromMarkdown,
  buildCreatureDialoguePrompt,
  getOpenRouterApiKey,
  DEFAULT_OPENROUTER_MODEL,
} from "@/lib/ai/openrouter";
import { POST as dialoguePostHandler } from "@/app/api/creature/dialogue/route";
import { POST as evolutionPostHandler } from "@/app/api/creature/evolution/route";
import { fetchCreatureDialogue, fetchEvolutionNarrative } from "@/lib/ai/client";
import { getFallbackDialogue, getFallbackEvolutionNarrative } from "@/lib/ai/fallback";

describe("AI Rate Limiter (lib/ai/rateLimit.ts)", () => {
  beforeEach(() => {
    _resetRateLimits();
  });

  it("permits requests within the window and blocks after exceeding limit", () => {
    const id = "test-ip-127.0.0.1";
    const limit = 3;
    const windowMs = 60_000;

    const r1 = checkRateLimit(id, limit, windowMs);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(id, limit, windowMs);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(id, limit, windowMs);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request exceeds limit
    const r4 = checkRateLimit(id, limit, windowMs);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetMs).toBeGreaterThan(0);
  });

  it("tracks rate limits independently for different identifiers", () => {
    const idA = "ip:10.0.0.1";
    const idB = "ip:10.0.0.2";
    const limit = 1;

    expect(checkRateLimit(idA, limit).success).toBe(true);
    expect(checkRateLimit(idA, limit).success).toBe(false);

    // idB is not affected by idA's limit
    expect(checkRateLimit(idB, limit).success).toBe(true);
  });

  it("extracts client IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.195");
  });

  it("extracts client IP from x-real-ip header if x-forwarded-for is missing", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "198.51.100.42" },
    });
    expect(getClientIp(req)).toBe("198.51.100.42");
  });

  it("enforces dual rate limiting across IP and wallet address", () => {
    const makeReq = () =>
      new Request("http://localhost/api/test", {
        headers: { "x-real-ip": "192.168.1.50" },
      });

    const wallet = "SolanaWalletAddress111111111111111111111111";
    const limit = 2;

    const r1 = checkRequestRateLimit(makeReq(), wallet, limit);
    expect(r1.success).toBe(true);

    const r2 = checkRequestRateLimit(makeReq(), wallet, limit);
    expect(r2.success).toBe(true);

    // 3rd attempt exceeds limit for this IP & wallet
    const r3 = checkRequestRateLimit(makeReq(), wallet, limit);
    expect(r3.success).toBe(false);
  });

  it("creates standard HTTP 429 response with Retry-After header", async () => {
    const failedResult = {
      success: false,
      limit: 10,
      remaining: 0,
      resetMs: 4500,
    };

    const res = createRateLimitResponse(failedResult);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("5");
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");

    const body = await res.json();
    expect(body.error).toBe("Too Many Requests");
    expect(body.retryAfter).toBe(5);
  });
});

describe("Trait-Aware Prompt Construction (lib/ai/openrouter.ts)", () => {
  const baseCtx: DialogueContext = {
    species: 0,
    speciesName: "Wisp",
    name: "Lumi",
    level: 3,
    xp: 120,
    evolutionStage: 0,
    recentRitual: "bond",
    traits: [14, 6, 18, 9], // Dominant is Empathy (18)
    ritualCount: 5,
    walletAddress: "DevnetOwnerAddress1111111111111111111111111",
  };

  it("incorporates on-chain creature traits and identifies dominant trait", () => {
    const prompt = buildCreatureDialoguePrompt(baseCtx);

    expect(prompt).toContain("Lumi");
    expect(prompt).toContain("Wisp");
    expect(prompt).toContain("Curiosity: 14");
    expect(prompt).toContain("Courage: 6");
    expect(prompt).toContain("Empathy: 18");
    expect(prompt).toContain("Ingenuity: 9");
    expect(prompt).toContain("Dominant Trait: Empathy (18)");
  });

  it("incorporates recent ritual and on-chain ritual count", () => {
    const prompt = buildCreatureDialoguePrompt(baseCtx);

    expect(prompt).toContain('Recent ritual with owner: "bond"');
    expect(prompt).toContain("Total rituals on-chain: 5");
  });

  it("adapts prompt for evolved stage forms", () => {
    const evolvedCtx: DialogueContext = {
      ...baseCtx,
      evolutionStage: 1,
      evolutionName: "Astral Guide",
    };

    const prompt = buildCreatureDialoguePrompt(evolvedCtx);
    expect(prompt).toContain('Evolution: Evolved Form "Astral Guide" (Stage 1');
    expect(prompt).toContain("transcendent resonance");
  });

  it("handles base form when not evolved", () => {
    const prompt = buildCreatureDialoguePrompt(baseCtx);
    expect(prompt).toContain("Evolution: Base Form (Stage 0, Level 3, XP 120)");
  });
});

describe("Markdown Stripping & Structured Output Validation", () => {
  it("strips json code fences accurately", () => {
    const raw = "```json\n{\"mood\": \"Joyful\", \"speech\": \"Hello!\"}\n```";
    expect(extractJsonFromMarkdown(raw)).toBe('{"mood": "Joyful", "speech": "Hello!"}');
  });

  it("strips generic code fences accurately", () => {
    const raw = "```\n{\"mood\": \"Pensive\"}\n```";
    expect(extractJsonFromMarkdown(raw)).toBe('{"mood": "Pensive"}');
  });

  it("slices out json when surrounded by commentary", () => {
    const raw = 'Here is your response:\n{"mood": "Curious", "speech": "What is that?"}\nHope you like it!';
    expect(extractJsonFromMarkdown(raw)).toBe('{"mood": "Curious", "speech": "What is that?"}');
  });

  it("validates valid DialogueResponseSchema", () => {
    const parsed = DialogueResponseSchema.safeParse({
      mood: "Excited",
      speech: "Ready for the next slot!",
      thought: "Calculating energy.",
      narrativeInsight: "Sparks jump from antennae.",
      isFallback: false,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid DialogueResponseSchema with missing fields", () => {
    const parsed = DialogueResponseSchema.safeParse({
      mood: "Excited",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("OpenRouter Integration Client (lib/ai/openrouter.ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("reads OPENROUTER_API_KEY with fallback to AI_API_KEY server-side", () => {
    delete process.env.OPENROUTER_API_KEY;
    process.env.AI_API_KEY = "test-ai-key";
    expect(getOpenRouterApiKey()).toBe("test-ai-key");

    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
    expect(getOpenRouterApiKey()).toBe("test-openrouter-key");
  });

  it("throws error when API key is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.AI_API_KEY;

    await expect(
      callOpenRouter({
        messages: [{ role: "user", content: "hello" }],
      })
    ).rejects.toThrow("Missing OpenRouter API key");
  });

  it("dispatches HTTP request with proper headers, model, and payload", async () => {
    process.env.OPENROUTER_API_KEY = "sk-mock-key";
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "gen-123",
          model: DEFAULT_OPENROUTER_MODEL,
          choices: [
            {
              message: {
                role: "assistant",
                content: '{"mood":"Attuned","speech":"Greetings!"}',
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await callOpenRouter({
      messages: [{ role: "user", content: "Ping" }],
      responseFormatJson: true,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, reqInit] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect((reqInit?.headers as Record<string, string>)?.["Authorization"]).toBe("Bearer sk-mock-key");

    const sentBody = JSON.parse(reqInit?.body as string);
    expect(sentBody.model).toBe("liquid/lfm-3-1.7b");
    expect(sentBody.response_format).toEqual({ type: "json_object" });

    expect(result.content).toBe('{"mood":"Attuned","speech":"Greetings!"}');
    expect(result.model).toBe("liquid/lfm-3-1.7b");
  });

  it("throws descriptive error when upstream returns non-200 status", async () => {
    process.env.OPENROUTER_API_KEY = "sk-mock-key";
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Rate limit exceeded", { status: 429, statusText: "Too Many Requests" })
    );

    await expect(
      callOpenRouter({
        messages: [{ role: "user", content: "Ping" }],
      })
    ).rejects.toThrow(/OpenRouter request failed with status 429/);
  });
});

describe("POST /api/creature/dialogue Route End-to-End Mocks", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetRateLimits();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  const validPayload = {
    species: 1,
    speciesName: "Bytebeast",
    name: "Geary",
    level: 2,
    xp: 60,
    evolutionStage: 0,
    recentRitual: "explore",
    traits: [10, 16, 8, 14], // Dominant is Courage (16)
    ritualCount: 3,
    walletAddress: "OwnerWallet1111111111111111111111111111",
  };

  it("returns 400 for invalid payload", async () => {
    const req = new NextRequest("http://localhost/api/creature/dialogue", {
      method: "POST",
      body: JSON.stringify({ species: 99 }), // Invalid species
    });

    const res = await dialoguePostHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid dialogue request payload");
  });

  it("enforces server-side rate limit and returns HTTP 429 when threshold exceeded", async () => {
    process.env.AI_RATE_LIMIT_PER_MINUTE = "2";

    const makeReq = () =>
      new NextRequest("http://localhost/api/creature/dialogue", {
        method: "POST",
        headers: { "x-real-ip": "198.51.100.99" },
        body: JSON.stringify(validPayload),
      });

    const res1 = await dialoguePostHandler(makeReq());
    expect(res1.status).toBe(200);

    const res2 = await dialoguePostHandler(makeReq());
    expect(res2.status).toBe(200);

    // 3rd request should hit HTTP 429
    const res3 = await dialoguePostHandler(makeReq());
    expect(res3.status).toBe(429);
    expect(res3.headers.get("Retry-After")).toBeTruthy();
    const data3 = await res3.json();
    expect(data3.error).toBe("Too Many Requests");
  });

  it("returns parsed structured dialogue response with isFallback: false on AI success", async () => {
    process.env.OPENROUTER_API_KEY = "sk-mock-valid";
    process.env.AI_PROVIDER = "openrouter";

    const mockAiResponse = {
      mood: "Daring & Focused",
      speech: "Pistons calibrated! Charting new mempool terrain with unwavering courage!",
      thought: "Courage index at maximum; no block reorganization shall daunt us.",
      narrativeInsight: "Geary's brass plating gleams with intense resolve as gears whir steadily.",
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `\`\`\`json\n${JSON.stringify(mockAiResponse)}\n\`\`\``,
              },
            },
          ],
        }),
        { status: 200 }
      )
    );

    const req = new NextRequest("http://localhost/api/creature/dialogue", {
      method: "POST",
      headers: { "x-real-ip": "192.168.1.10" },
      body: JSON.stringify(validPayload),
    });

    const res = await dialoguePostHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isFallback).toBe(false);
    expect(data.mood).toBe("Daring & Focused");
    expect(data.speech).toContain("Pistons calibrated!");
    expect(data.thought).toContain("Courage index");
    expect(data.narrativeInsight).toContain("brass plating");
  });

  it("falls back deterministically when OpenRouter returns 504 / timeout", async () => {
    process.env.OPENROUTER_API_KEY = "sk-mock-valid";
    process.env.AI_PROVIDER = "openrouter";

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Gateway Timeout", { status: 504, statusText: "Gateway Timeout" })
    );

    const req = new NextRequest("http://localhost/api/creature/dialogue", {
      method: "POST",
      headers: { "x-real-ip": "192.168.1.11" },
      body: JSON.stringify(validPayload),
    });

    const res = await dialoguePostHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isFallback).toBe(true);
    expect(data.speech).toContain("bytecode fragments"); // Fallback for Bytebeast explore
  });

  it("falls back deterministically when no API key is provided", async () => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.AI_API_KEY;

    const req = new NextRequest("http://localhost/api/creature/dialogue", {
      method: "POST",
      headers: { "x-real-ip": "192.168.1.12" },
      body: JSON.stringify(validPayload),
    });

    const res = await dialoguePostHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isFallback).toBe(true);
  });
});

describe("POST /api/creature/evolution Route End-to-End Mocks", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetRateLimits();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  const evolutionPayload = {
    species: 0,
    name: "Lumi",
    level: 3,
    choiceId: 1,
    choiceName: "Astral Guide",
    walletAddress: "OwnerWallet1111111111111111111111111111",
  };

  it("returns AI generated narrative on success", async () => {
    process.env.OPENROUTER_API_KEY = "sk-mock-valid";
    process.env.AI_PROVIDER = "openrouter";

    const mockAiResponse = {
      title: "Dawn of the Astral Guide",
      proclamation: "The veil of the mempool parts before our starlight!",
      transformationSummary: "Lumi ascended to Astral Guide in radiant glory.",
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(mockAiResponse),
              },
            },
          ],
        }),
        { status: 200 }
      )
    );

    const req = new NextRequest("http://localhost/api/creature/evolution", {
      method: "POST",
      headers: { "x-real-ip": "10.0.0.21" },
      body: JSON.stringify(evolutionPayload),
    });

    const res = await evolutionPostHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isFallback).toBe(false);
    expect(data.title).toBe("Dawn of the Astral Guide");
    expect(data.proclamation).toContain("starlight");
  });

  it("falls back deterministically on upstream error", async () => {
    process.env.OPENROUTER_API_KEY = "sk-mock-valid";
    process.env.AI_PROVIDER = "openrouter";

    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network connection dropped"));

    const req = new NextRequest("http://localhost/api/creature/evolution", {
      method: "POST",
      headers: { "x-real-ip": "10.0.0.22" },
      body: JSON.stringify(evolutionPayload),
    });

    const res = await evolutionPostHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isFallback).toBe(true);
    expect(data.title).toBe("Ascension of the Astral Guide");
  });
});

describe("Client Fetchers (lib/ai/client.ts)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleCtx: DialogueContext = {
    species: 2,
    speciesName: "Mossling",
    name: "Sprout",
    level: 1,
    xp: 0,
    evolutionStage: 0,
    recentRitual: "none",
  };

  it("returns fallback dialogue gracefully when API endpoint returns 429", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
        headers: { "Retry-After": "10" },
      })
    );

    const dialogue = await fetchCreatureDialogue(sampleCtx);
    expect(dialogue.isFallback).toBe(true);
    expect(dialogue.speech).toBeTruthy();
  });

  it("returns fallback dialogue gracefully when API network error occurs", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Failed to fetch"));

    const dialogue = await fetchCreatureDialogue(sampleCtx);
    expect(dialogue.isFallback).toBe(true);
    expect(dialogue.mood).toBe("Contemplative");
  });

  it("returns fallback evolution narrative gracefully when API returns 429", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
      })
    );

    const narrative = await fetchEvolutionNarrative({
      species: 2,
      name: "Sprout",
      level: 3,
      choiceId: 1,
      choiceName: "Verdant Elder",
    });

    expect(narrative.isFallback).toBe(true);
    expect(narrative.title).toBe("Ascension of the Verdant Elder");
  });
});

describe("Controlled Live Connectivity Smoke Test", () => {
  // Opt-in smoke test: skipped by default to conserve API rate limits and avoid flakiness in automated runs.
  const canRunLiveTest =
    process.env.RUN_LIVE_AI_SMOKE === "true" &&
    Boolean(process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY);

  it.skipIf(!canRunLiveTest)("live OpenRouter model connectivity check", async () => {
    const result = await callOpenRouter({
      messages: [{ role: "user", content: "Reply with JSON: {\"status\":\"ok\"}" }],
      responseFormatJson: true,
      maxTokens: 20,
      timeoutMs: 10000,
    });

    expect(result.content).toBeTruthy();
    const parsed = JSON.parse(extractJsonFromMarkdown(result.content));
    expect(parsed.status).toBe("ok");
  });
});
