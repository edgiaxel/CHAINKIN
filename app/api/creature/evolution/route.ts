import { NextRequest, NextResponse } from "next/server";
import {
  EvolutionNarrativeRequestSchema,
  EvolutionNarrativeResponse,
} from "@/lib/ai/types";
import { getFallbackEvolutionNarrative } from "@/lib/ai/fallback";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = EvolutionNarrativeRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid evolution request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const reqData = parseResult.data;
    const apiKey = process.env.AI_API_KEY;
    const provider = process.env.AI_PROVIDER || "fallback";

    if (!apiKey || provider === "fallback") {
      return NextResponse.json(getFallbackEvolutionNarrative(reqData));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      if (provider === "openai" || provider === "openrouter" || provider === "groq") {
        const baseUrl =
          provider === "openrouter"
            ? "https://openrouter.ai/api/v1"
            : provider === "groq"
            ? "https://api.groq.com/openai/v1"
            : "https://api.openai.com/v1";

        const model = process.env.AI_MODEL || "gpt-4o-mini";

        const prompt = `Chainkin creature "${reqData.name}" has just evolved into "${reqData.choiceName}" on Solana Devnet.
Generate flavor text for this milestone.
Respond in strict JSON with keys:
"title": short headline, max 40 chars.
"proclamation": creature's triumphant exclamation, max 160 chars.
"transformationSummary": narrator summary, max 240 chars.`;

        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 250,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsedJson = JSON.parse(content);
            const response: EvolutionNarrativeResponse = {
              title: String(parsedJson.title || `Ascension of the ${reqData.choiceName}`).slice(0, 50),
              proclamation: String(parsedJson.proclamation || "...").slice(0, 200),
              transformationSummary: String(parsedJson.transformationSummary || "").slice(0, 280),
              isFallback: false,
            };
            return NextResponse.json(response);
          }
        }
      }
    } catch (err) {
      console.warn("AI evolution narrative generation failed:", err);
    } finally {
      clearTimeout(timeoutId);
    }

    return NextResponse.json(getFallbackEvolutionNarrative(reqData));
  } catch (error) {
    console.error("Evolution route unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
