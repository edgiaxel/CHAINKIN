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
  buildCreatureEvolutionPrompt,
  getSpeciesVoiceGuideline,
  getActionIntentGuideline,
  getOpenRouterApiKey,
  DEFAULT_OPENROUTER_MODEL,
} from "@/lib/ai/openrouter";
import { POST as dialoguePostHandler } from "@/app/api/creature/dialogue/route";
import { POST as evolutionPostHandler } from "@/app/api/creature/evolution/route";
import { fetchCreatureDialogue, fetchEvolutionNarrative } from "@/lib/ai/client";
import { getFallbackDialogue, getFallbackEvolutionNarrative } from "@/lib/ai/fallback";
import { SPECIES_IDS } from "@/lib/creature/types";
import { resetDailyBudgetForTesting } from "@/lib/ai/dailyBudget";

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

  it("differentiates species voice guidelines for Wisp, Bytebeast, and Mossling", () => {
    const wispPrompt = buildCreatureDialoguePrompt({ ...baseCtx, species: SPECIES_IDS.WISP, speciesName: "Wisp" });
    const bytePrompt = buildCreatureDialoguePrompt({ ...baseCtx, species: SPECIES_IDS.BYTEBEAST, speciesName: "Bytebeast" });
    const mossPrompt = buildCreatureDialoguePrompt({ ...baseCtx, species: SPECIES_IDS.MOSSLING, speciesName: "Mossling" });

    // Wisp: ethereal, celestial cadence
    expect(wispPrompt).toContain("Ethereal, intuitive, curious");
    expect(wispPrompt).toContain("celestial cadence");
    expect(wispPrompt).toContain("starlight");

    // Bytebeast: analytical, technical, glitchy-precise
    expect(bytePrompt).toContain("Analytical, energetic, technical");
    expect(bytePrompt).toContain("glitchy-precise cadence");
    expect(bytePrompt).toContain("clock cycles");

    // Mossling: gentle, ancient, grounding
    expect(mossPrompt).toContain("Gentle, ancient, grounding");
    expect(mossPrompt).toContain("earthy-symbiotic");
    expect(mossPrompt).toContain("root systems");
  });

  it("injects interaction intent guidelines for talk, ponder, comfort, and observe", () => {
    const talkPrompt = buildCreatureDialoguePrompt({ ...baseCtx, action: "talk" });
    const ponderPrompt = buildCreatureDialoguePrompt({ ...baseCtx, action: "ponder" });
    const comfortPrompt = buildCreatureDialoguePrompt({ ...baseCtx, action: "comfort" });
    const observePrompt = buildCreatureDialoguePrompt({ ...baseCtx, action: "observe" });

    expect(talkPrompt).toContain('Interaction Mode ("talk")');
    expect(ponderPrompt).toContain('Interaction Mode ("ponder")');
    expect(comfortPrompt).toContain('Interaction Mode ("comfort")');
    expect(observePrompt).toContain('Interaction Mode ("observe")');
  });

  it("builds species-tailored prompt for creature evolution narrative", () => {
    const wispEvo = buildCreatureEvolutionPrompt({
      species: SPECIES_IDS.WISP,
      speciesName: "Wisp",
      name: "Lumi",
      level: 3,
      choiceId: 1,
      choiceName: "Astral Guide",
      traits: [10, 10, 20, 10],
    });

    expect(wispEvo).toContain('Chainkin creature "Lumi"');
    expect(wispEvo).toContain("Astral Guide");
    expect(wispEvo).toContain("Ethereal, intuitive, curious");
    expect(wispEvo).toContain("Personality traits: Curiosity=10, Courage=10, Empathy=20, Ingenuity=10");
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

  it("sanitizes trailing commas before closing braces/brackets commonly emitted by small LLMs", () => {
    const rawWithTrailing = '{"mood": "Curious", "speech": "What is that?",}';
    const cleaned = extractJsonFromMarkdown(rawWithTrailing);
    expect(cleaned).toBe('{"mood": "Curious", "speech": "What is that?"}');
    expect(() => JSON.parse(cleaned)).not.toThrow();
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
    resetDailyBudgetForTesting();
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

  it("supports interaction actions (ponder, comfort, observe, talk) via API endpoint", async () => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.AI_API_KEY;

    const ponderReq = new NextRequest("http://localhost/api/creature/dialogue", {
      method: "POST",
      headers: { "x-real-ip": "192.168.1.15" },
      body: JSON.stringify({ ...validPayload, recentRitual: "none", action: "ponder" }),
    });

    const res = await dialoguePostHandler(ponderReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isFallback).toBe(true);
    expect(data.mood).toBe("Analytical");
    expect(data.speech).toContain("entropy");
  });
});

describe("Species Differentiation & Interaction Matrix in Fallback Dialogue (lib/ai/fallback.ts)", () => {
  const baseKin = {
    name: "Kin",
    level: 2,
    xp: 45,
    evolutionStage: 0,
    recentRitual: "none" as const,
  };

  it("returns distinct species voices for Talk interaction", () => {
    const wisp = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.WISP, speciesName: "Wisp", action: "talk" });
    const byte = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.BYTEBEAST, speciesName: "Bytebeast", action: "talk" });
    const moss = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.MOSSLING, speciesName: "Mossling", action: "talk" });

    expect(wisp.mood).toBe("Playful & Curious");
    expect(byte.mood).toBe("Energized");
    expect(moss.mood).toBe("Contemplative");

    expect(wisp.speech).toContain("spirals of light");
    expect(byte.speech).toContain("Pistons pump");
    expect(moss.speech).toContain("cool block air");

    expect(wisp.speech).not.toBe(byte.speech);
    expect(byte.speech).not.toBe(moss.speech);
    expect(wisp.speech).not.toBe(moss.speech);
  });

  it("returns distinct species voices for Ponder interaction", () => {
    const wisp = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.WISP, speciesName: "Wisp", action: "ponder" });
    const byte = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.BYTEBEAST, speciesName: "Bytebeast", action: "ponder" });
    const moss = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.MOSSLING, speciesName: "Mossling", action: "ponder" });

    expect(wisp.mood).toBe("Philosophical");
    expect(byte.mood).toBe("Analytical");
    expect(moss.mood).toBe("Meditative");

    expect(wisp.speech).toContain("echoes drift forever");
    expect(byte.speech).toContain("entropy");
    expect(moss.speech).toContain("growth ring");

    expect(wisp.thought).not.toBe(byte.thought);
    expect(byte.thought).not.toBe(moss.thought);
  });

  it("returns distinct species voices for Comfort interaction", () => {
    const wisp = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.WISP, speciesName: "Wisp", action: "comfort" });
    const byte = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.BYTEBEAST, speciesName: "Bytebeast", action: "comfort" });
    const moss = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.MOSSLING, speciesName: "Mossling", action: "comfort" });

    expect(wisp.mood).toBe("Affectionate");
    expect(byte.mood).toBe("Loyal & Protective");
    expect(moss.mood).toBe("Nurturing");

    expect(wisp.speech).toContain("Rest your worries");
    expect(byte.speech).toContain("Thermal load nominal");
    expect(moss.speech).toContain("tender clover blossom");
  });

  it("returns distinct species voices for Observe interaction", () => {
    const wisp = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.WISP, speciesName: "Wisp", action: "observe" });
    const byte = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.BYTEBEAST, speciesName: "Bytebeast", action: "observe" });
    const moss = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.MOSSLING, speciesName: "Mossling", action: "observe" });

    expect(wisp.mood).toBe("Observant");
    expect(byte.mood).toBe("Vigilant");
    expect(moss.mood).toBe("Watchful");

    expect(wisp.speech).toContain("wallet's aura");
    expect(byte.speech).toContain("Radar dish sweeps");
    expect(moss.speech).toContain("fern fronds");
  });

  it("returns distinct ritual acknowledgments for all ritual types", () => {
    const wispObs = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.WISP, speciesName: "Wisp", recentRitual: "observe" });
    const byteObs = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.BYTEBEAST, speciesName: "Bytebeast", recentRitual: "observe" });
    const mossObs = getFallbackDialogue({ ...baseKin, species: SPECIES_IDS.MOSSLING, speciesName: "Mossling", recentRitual: "observe" });

    expect(wispObs.mood).toBe("Harmonized");
    expect(wispObs.speech).toContain("translucent clarity");

    expect(byteObs.mood).toBe("Monitored & Nominal");
    expect(byteObs.speech).toContain("Diagnostic sweep confirmed");

    expect(mossObs.mood).toBe("Still & Centered");
    expect(mossObs.speech).toContain("Amber resin glimmers");
  });

  it("differentiates evolved form fallbacks across species while retaining transcendent harmony", () => {
    const wispEvolved = getFallbackDialogue({
      ...baseKin,
      species: SPECIES_IDS.WISP,
      speciesName: "Wisp",
      evolutionStage: 1,
      evolutionName: "Astral Guide",
    });

    const byteEvolved = getFallbackDialogue({
      ...baseKin,
      species: SPECIES_IDS.BYTEBEAST,
      speciesName: "Bytebeast",
      evolutionStage: 1,
      evolutionName: "Cyber Warden",
    });

    expect(wispEvolved.mood).toBe("Transcendent & Radiant");
    expect(wispEvolved.speech).toContain("Luminous harmonics resonate deeply");
    expect(wispEvolved.speech).toContain("The cluster pulses in harmony with our evolved form as Astral Guide");

    expect(byteEvolved.mood).toBe("Transcendent & Calibrated");
    expect(byteEvolved.speech).toContain("titanium manifolds");
    expect(byteEvolved.speech).toContain("The cluster pulses in harmony with our evolved form as Cyber Warden");
  });

  it("differentiates evolution proclamations and transformation summaries by species", () => {
    const wispNar = getFallbackEvolutionNarrative({
      species: SPECIES_IDS.WISP,
      name: "Lumi",
      level: 3,
      choiceId: 1,
      choiceName: "Astral Guide",
    });

    const byteNar = getFallbackEvolutionNarrative({
      species: SPECIES_IDS.BYTEBEAST,
      name: "Geary",
      level: 3,
      choiceId: 1,
      choiceName: "Cyber Warden",
    });

    const mossNar = getFallbackEvolutionNarrative({
      species: SPECIES_IDS.MOSSLING,
      name: "Sprout",
      level: 3,
      choiceId: 1,
      choiceName: "Verdant Elder",
    });

    expect(wispNar.proclamation).toContain("radiant celestial energy");
    expect(wispNar.transformationSummary).toContain("celestial mantle");

    expect(byteNar.proclamation).toContain("Overclocked servos");
    expect(byteNar.transformationSummary).toContain("engineered mantle");

    expect(mossNar.proclamation).toContain("Ancient heartwood");
    expect(mossNar.transformationSummary).toContain("verdant mantle");

    expect(wispNar.title).toBe("Ascension of the Astral Guide");
    expect(byteNar.title).toBe("Ascension of the Cyber Warden");
    expect(mossNar.title).toBe("Ascension of the Verdant Elder");
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
