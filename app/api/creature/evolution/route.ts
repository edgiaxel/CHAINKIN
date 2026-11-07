import { NextRequest, NextResponse } from "next/server";
import {
  EvolutionNarrativeRequestSchema,
  EvolutionNarrativeResponseSchema,
} from "@/lib/ai/types";
import { getFallbackEvolutionNarrative } from "@/lib/ai/fallback";
import { checkRequestRateLimit, createRateLimitResponse } from "@/lib/ai/rateLimit";
import {
  callOpenRouter,
  extractJsonFromMarkdown,
  getOpenRouterApiKey,
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

    // 1. Enforce server-side in-memory rate limiting by IP and wallet
    const rateLimitResult = checkRequestRateLimit(req, reqData.walletAddress);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // 2. Secret hygiene: Check API key server-side
    const apiKey = getOpenRouterApiKey();
    const provider = process.env.AI_PROVIDER || "openrouter";

    if (!apiKey || provider === "fallback") {
      return NextResponse.json(getFallbackEvolutionNarrative(reqData));
    }

    // 3. Generate narrative with OpenRouter
    try {
      const prompt = `Chainkin creature "${reqData.name}" has just evolved into "${reqData.choiceName}" on Solana Devnet.
Generate triumphant flavor text for this ascension milestone.
Respond in strict JSON with keys:
"title": short headline, max 40 chars.
"proclamation": creature's triumphant exclamation, max 160 chars.
"transformationSummary": narrator summary, max 240 chars.`;

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
      });

      // 4. Structured output validation with markdown code fence stripping
      const cleanedJson = extractJsonFromMarkdown(completion.content);
      const parsedJson = JSON.parse(cleanedJson);

      const validated = EvolutionNarrativeResponseSchema.safeParse({
        title: String(parsedJson.title || `Ascension of the ${reqData.choiceName}`).slice(0, 50),
        proclamation: String(parsedJson.proclamation || "...").slice(0, 200),
        transformationSummary: String(parsedJson.transformationSummary || "").slice(0, 280),
        isFallback: false,
      });

      if (validated.success) {
        return NextResponse.json(validated.data);
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
