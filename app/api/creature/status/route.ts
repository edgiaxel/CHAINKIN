import { NextResponse } from "next/server";
import { getDailyUsage } from "@/lib/ai/dailyBudget";
import { getOpenRouterApiKey } from "@/lib/ai/openrouter";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = getOpenRouterApiKey();
  const provider = process.env.AI_PROVIDER || "openrouter";
  const model = process.env.AI_MODEL || "liquid/lfm-3-1.7b:free";
  const hasKey = Boolean(apiKey);

  const budget = getDailyUsage();

  return NextResponse.json({
    ai: {
      provider: hasKey && provider !== "fallback" ? "OpenRouter" : "Deterministic Fallback",
      model: hasKey && provider !== "fallback" ? model : "Internal Rules",
      hasKey,
      dailyBudget: {
        limit: budget.limit,
        used: budget.used,
        remaining: budget.remaining,
      },
      requestsPerMinuteLimit: 10,
    },
    solana: {
      cluster: process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet",
      programId: process.env.NEXT_PUBLIC_PROGRAM_ID || "DzykRWVFpJGr9fuHoJUfsoE8FRhcYhVZLvVs1hZyggEB",
    },
  });
}
