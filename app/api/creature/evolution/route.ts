import { NextRequest, NextResponse } from "next/server";
import {
  EvolutionNarrativeRequestSchema,
  EvolutionNarrativeResponseSchema,
} from "@/lib/ai/types";
import { getFallbackEvolutionNarrative } from "@/lib/ai/fallback";
import { checkRequestRateLimit, createRateLimitResponse } from "@/lib/ai/rateLimit";
import { consumeDailyBudget } from "@/lib/ai/dailyBudget";
import {
  callOpenRouter,
  extractJsonFromMarkdown,
  getOpenRouterApiKey,
  buildCreatureEvolutionPrompt,
} from "@/lib/ai/openrouter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parseResult = EvolutionNarrativeRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid evolution request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const reqData = parseResult.data;

    // 1. Rate limiting by IP and wallet
    const rateLimitResult = checkRequestRateLimit(req, reqData.walletAddress);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // 2. Daily budget check (35/day default)
    const budget = consumeDailyBudget();
    if (!budget.allowed) {
      return NextResponse.json(getFallbackEvolutionNarrative(reqData), {
        headers: {
          "X-Daily-Budget-Remaining": "0",
        },
      });
    }

    // 3. Secret hygiene: Check API key server-side
    const apiKey = getOpenRouterApiKey();
    const provider = process.env.AI_PROVIDER || "openrouter";

    if (!apiKey || provider === "fallback") {
      return NextResponse.json(getFallbackEvolutionNarrative(reqData));
    }

    // 4. Generate narrative with OpenRouter
    try {
      const prompt = buildCreatureEvolutionPrompt(reqData);

      const completion = await callOpenRouter({
        messages: [
          {
            role: "system",
            content:
              "You are the Chainkin living creature evolution narrative engine. Always respond in strict, valid JSON format only.",
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

      const validated = EvolutionNarrativeResponseSchema.safeParse({
        title: String(parsedJson.title || `Ascension of the ${reqData.choiceName}`).slice(0, 50),
        proclamation: String(parsedJson.proclamation || "...").slice(0, 200),
        transformationSummary: String(parsedJson.transformationSummary || "").slice(0, 280),
        isFallback: false,
      });

      if (validated.success) {
        return NextResponse.json(validated.data, {
          headers: {
            "X-Daily-Budget-Remaining": String(budget.remaining),
          },
        });
      }
      console.warn("Evolution AI response validation failed schema:", validated.error);
    } catch (err) {
      console.warn("AI evolution narrative generation failed, activating fallback:", err);
    }

    return NextResponse.json(getFallbackEvolutionNarrative(reqData));
  } catch (error) {
    console.error("Evolution route unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
