import { NextRequest, NextResponse } from "next/server";
import { DialogueContextSchema, DialogueResponseSchema } from "@/lib/ai/types";
import { getFallbackDialogue } from "@/lib/ai/fallback";
import { checkRequestRateLimit, createRateLimitResponse } from "@/lib/ai/rateLimit";
import { consumeDailyBudget } from "@/lib/ai/dailyBudget";
import {
  buildCreatureDialoguePrompt,
  callOpenRouter,
  extractJsonFromMarkdown,
  getOpenRouterApiKey,
} from "@/lib/ai/openrouter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parseResult = DialogueContextSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid dialogue request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const ctx = parseResult.data;

    // 1. Per-minute rate limiting by IP and wallet
    const rateLimitResult = checkRequestRateLimit(req, ctx.walletAddress);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // 2. Daily budget check (35/day default, configurable)
    const budget = consumeDailyBudget();
    if (!budget.allowed) {
      const fallback = getFallbackDialogue(ctx);
      return NextResponse.json(fallback, {
        headers: {
          "X-Daily-Budget-Limit": String(budget.limit),
          "X-Daily-Budget-Used": String(budget.used),
          "X-Daily-Budget-Remaining": "0",
        },
      });
    }

    // 3. API key check
    const apiKey = getOpenRouterApiKey();
    const provider = process.env.AI_PROVIDER || "openrouter";

    if (!apiKey || provider === "fallback") {
      return NextResponse.json(getFallbackDialogue(ctx));
    }

    // 4. Generate dialogue with OpenRouter
    try {
      const prompt = buildCreatureDialoguePrompt(ctx);
      const completion = await callOpenRouter({
        messages: [
          {
            role: "system",
            content:
              "You are the Chainkin living creature dialogue engine. Always respond in strict, valid JSON format only.",
          },
          { role: "user", content: prompt },
        ],
        responseFormatJson: true,
        maxTokens: 250,
        temperature: 0.7,
        timeoutMs: 15_000,
      });

      // 5. Structured output validation with markdown code fence stripping
      const cleanedJson = extractJsonFromMarkdown(completion.content);
      const parsedJson = JSON.parse(cleanedJson);

      const validated = DialogueResponseSchema.safeParse({
        mood: String(parsedJson.mood || "Observant").slice(0, 30),
        speech: String(parsedJson.speech || "...").slice(0, 200),
        thought: String(parsedJson.thought || "...").slice(0, 200),
        narrativeInsight: String(parsedJson.narrativeInsight || "").slice(0, 280),
        isFallback: false,
      });

      if (validated.success) {
        return NextResponse.json(validated.data, {
          headers: {
            "X-Daily-Budget-Remaining": String(budget.remaining),
          },
        });
      }
      console.warn("Dialogue AI response validation failed schema:", validated.error);
    } catch (aiErr) {
      console.warn("AI generation failed or timed out, activating deterministic fallback:", aiErr);
    }

    // 6. Fallback if model fails, times out, or returns invalid format
    return NextResponse.json(getFallbackDialogue(ctx));
  } catch (error) {
    console.error("Dialogue route unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
