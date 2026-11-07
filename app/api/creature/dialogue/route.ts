import { NextRequest, NextResponse } from "next/server";
import { DialogueContextSchema, DialogueResponse } from "@/lib/ai/types";
import { getFallbackDialogue } from "@/lib/ai/fallback";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = DialogueContextSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid dialogue request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const ctx = parseResult.data;
    const apiKey = process.env.AI_API_KEY;
    const provider = process.env.AI_PROVIDER || "fallback";

    // If no provider key or provider is fallback, use deterministic fallback
    if (!apiKey || provider === "fallback") {
      const fallbackResponse = getFallbackDialogue(ctx);
      return NextResponse.json(fallbackResponse);
    }

    // Provider-independent AI caller with short timeout (3.5s max to protect user experience)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      // Example generic OpenAI-compatible or Gemini-compatible integration
      if (provider === "openai" || provider === "openrouter" || provider === "groq") {
        const baseUrl =
          provider === "openrouter"
            ? "https://openrouter.ai/api/v1"
            : provider === "groq"
            ? "https://api.groq.com/openai/v1"
            : "https://api.openai.com/v1";

        const model = process.env.AI_MODEL || "gpt-4o-mini";

        const prompt = `You are a digital creature named "${ctx.name}", a species of "${ctx.speciesName}" in a Solana Devnet companion game called Chainkin.
Level: ${ctx.level}, XP: ${ctx.xp}, Evolution Stage: ${ctx.evolutionStage}${ctx.evolutionName ? ` (${ctx.evolutionName})` : ""}.
Recent ritual: ${ctx.recentRitual}.
Write creature dialogue in 1-2 short sentences.
Respond in strict JSON with keys:
"mood": short string, max 25 chars.
"speech": creature direct words, max 160 chars.
"thought": creature internal feeling, max 160 chars.
"narrativeInsight": narrator observation of creature, max 200 chars.`;

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
            const response: DialogueResponse = {
              mood: String(parsedJson.mood || "Observant").slice(0, 30),
              speech: String(parsedJson.speech || "...").slice(0, 200),
              thought: String(parsedJson.thought || "...").slice(0, 200),
              narrativeInsight: String(parsedJson.narrativeInsight || "").slice(0, 280),
              isFallback: false,
            };
            return NextResponse.json(response);
          }
        }
      }
    } catch (aiErr) {
      console.warn("AI generation failed or timed out, using fallback:", aiErr);
    } finally {
      clearTimeout(timeoutId);
    }

    // Default fallback if provider fails
    const fallback = getFallbackDialogue(ctx);
    return NextResponse.json(fallback);
  } catch (error) {
    console.error("Dialogue route unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
