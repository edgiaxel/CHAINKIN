import { DialogueContext, EvolutionNarrativeRequest } from "./types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  responseFormatJson?: boolean;
}

export interface AiCompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export const DEFAULT_OPENROUTER_MODEL = "liquid/lfm-3-1.7b";
export const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Read OpenRouter API key server-side.
 * Never expose this value to client bundles or NEXT_PUBLIC_* variables.
 */
export function getOpenRouterApiKey(): string {
  return (
    process.env.OPENROUTER_API_KEY?.trim() ||
    process.env.AI_API_KEY?.trim() ||
    ""
  );
}

/**
 * Species-specific voice and cadence guidelines to ensure distinct personalities.
 * Wisp: ethereal, intuitive, curious, celestial cadence.
 * Bytebeast: analytical, energetic, technical, glitchy-precise cadence.
 * Mossling: gentle, ancient, grounding, earthy-symbiotic cadence.
 */
export function getSpeciesVoiceGuideline(species: number): string {
  switch (species) {
    case 0:
      return "Species Voice & Cadence: Ethereal, intuitive, curious, and poetic with a celestial cadence. Describe phenomena through shimmering starlight, celestial tides, quantum frequencies, and intuitive whispers between Solana cluster nodes. Soft, luminous, and full of celestial wonder.";
    case 1:
      return "Species Voice & Cadence: Analytical, energetic, technical, and brisk with a glitchy-precise cadence. Describe phenomena through clock cycles, telemetry metrics, bytecode, gear ratios, overclocking pulses, and computational optimism. Sharp, lively, and metric-driven.";
    case 2:
    default:
      return "Species Voice & Cadence: Gentle, ancient, grounding, and earthy-symbiotic with a patient cadence. Describe phenomena through deep root systems, living loam, mycorrhizal consensus, canopy shade, and ancient Solana bedrock. Calm, reassuring, and rooted.";
  }
}

/**
 * Interaction intent guidelines for talk, ponder, comfort, and observe.
 */
export function getActionIntentGuideline(action: string): string {
  switch (action) {
    case "ponder":
      return 'Interaction Mode ("ponder"): Deep philosophical contemplation. Muse upon the mysteries of Solana consensus, the permanence of transaction slots, the flow of cryptographic time, or the nature of digital existence.';
    case "comfort":
      return 'Interaction Mode ("comfort"): Affectionate emotional reassurance and gentle empathy. Soothe your keeper\'s spirit, offer warmth, presence, and calm solace.';
    case "observe":
      return 'Interaction Mode ("observe"): Keen environmental and ledger observation. Scan the immediate network, mempool gossip, validator signatures, and ambient energy surrounding your keeper.';
    case "talk":
    default:
      return 'Interaction Mode ("talk"): Casual, companionable interaction. Converse naturally with your keeper about the journey, cluster atmosphere, and shared bond.';
  }
}

/**
 * Builds trait-aware, stage-aware, and ritual-aware prompt for AI dialogue.
 */
export function buildCreatureDialoguePrompt(ctx: DialogueContext): string {
  const {
    species,
    speciesName,
    name,
    level,
    xp,
    evolutionStage,
    evolutionName,
    recentRitual,
    traits,
    ritualCount,
    action = "talk",
    currentMood,
  } = ctx;

  let traitText = "";
  if (traits && traits.length === 4) {
    const [curiosity, courage, empathy, ingenuity] = traits;
    const traitEntries = [
      { name: "Curiosity", val: curiosity },
      { name: "Courage", val: courage },
      { name: "Empathy", val: empathy },
      { name: "Ingenuity", val: ingenuity },
    ];
    traitEntries.sort((a, b) => b.val - a.val);
    const dominant = traitEntries[0];
    traitText = `On-Chain Personality Traits:
- Curiosity: ${curiosity} (fascination with blockchain lore, block hashes, and mysteries)
- Courage: ${courage} (bravery in the face of network turbulence and bold exploration)
- Empathy: ${empathy} (deep emotional attunement and affection for keeper)
- Ingenuity: ${ingenuity} (computational inventiveness, bytecode tinkering, and clockwork precision)
Dominant Trait: ${dominant.name} (${dominant.val}). Let this dominant trait heavily influence your speech, attitude, and mood.`;
  }

  const ritualText =
    recentRitual && recentRitual !== "none"
      ? `Recent ritual with owner: "${recentRitual}". Total rituals on-chain: ${ritualCount ?? 1}. Express the resonance, feeling, and after-effects of this ritual.`
      : `No recent ritual performed. Total rituals on-chain: ${ritualCount ?? 0}.`;

  const stageText =
    evolutionStage > 0 && evolutionName
      ? `Evolution: Evolved Form "${evolutionName}" (Stage ${evolutionStage}, Level ${level}, XP ${xp}). Speak with elevated dignity, deep wisdom, and transcendent resonance.`
      : `Evolution: Base Form (Stage 0, Level ${level}, XP ${xp}). Speak with youthful wonder and companionable affection.`;

  const voiceGuideline = getSpeciesVoiceGuideline(species);
  const actionGuideline = getActionIntentGuideline(action);
  const moodGuideline = currentMood ? `Current Mood Tone: "${currentMood}".` : "";

  return `You are "${name}", a sentient digital creature companion of species "${speciesName}" residing on Solana Devnet in the game Chainkin.
${stageText}
${ritualText}
${traitText}

${voiceGuideline}
${actionGuideline}
${moodGuideline}

Guidelines:
- Stay strictly in-character as a creature bound to Solana Devnet.
- Never mention being an AI or language model; you are a living blockchain creature companion.
- Reflect your dominant traits and ritual history authentically.
- Keep speech lively, concise, and emotionally expressive.

Respond in strict JSON with keys:
{
  "mood": "Short mood description, max 30 characters",
  "speech": "Creature's spoken words, max 200 characters",
  "thought": "Creature's internal thoughts, max 200 characters",
  "narrativeInsight": "Narrator observation of the creature's demeanor and aura, max 280 characters"
}`;
}

/**
 * Builds species-tailored prompt for creature evolution narrative.
 */
export function buildCreatureEvolutionPrompt(req: EvolutionNarrativeRequest): string {
  const { species, name, choiceName, level, traits, speciesName } = req;
  const voiceGuideline = getSpeciesVoiceGuideline(species);

  let traitContext = "";
  if (traits && traits.length === 4) {
    const [curiosity, courage, empathy, ingenuity] = traits;
    traitContext = `Personality traits: Curiosity=${curiosity}, Courage=${courage}, Empathy=${empathy}, Ingenuity=${ingenuity}.`;
  }

  return `Chainkin creature "${name}" (species "${speciesName || "Companion"}", Level ${level}) has just evolved into "${choiceName}" on Solana Devnet.
${voiceGuideline}
${traitContext}
Generate triumphant flavor text for this ascension milestone celebrating their permanent transformation on the blockchain.
Respond in strict JSON with keys:
"title": short headline, max 40 chars.
"proclamation": creature's triumphant exclamation, max 160 chars.
"transformationSummary": narrator summary, max 240 chars.`;
}

/**
 * Safely extract raw JSON substring from markdown code fences or conversational text.
 * Sanitizes trailing commas frequently emitted by smaller LLMs like Liquid LFM3 1.7B.
 */
export function extractJsonFromMarkdown(raw: string): string {
  let cleaned = raw.trim();

  // 1. Try matching ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    // 2. Try slicing between first '{' and last '}'
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1).trim();
    }
  }

  // 3. Remove trailing commas before closing braces/brackets (common small-model formatting flaw)
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return cleaned;
}

/**
 * Provider-independent AI caller connecting to OpenRouter (or compatible providers)
 * with timeout, model selection, and clean error handling.
 */
export async function callOpenRouter(
  options: AiCompletionOptions
): Promise<AiCompletionResult> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error("Missing OpenRouter API key (OPENROUTER_API_KEY or AI_API_KEY)");
  }

  const model = options.model || process.env.AI_MODEL || DEFAULT_OPENROUTER_MODEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: Record<string, unknown> = {
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 250,
    };

    if (options.responseFormatJson) {
      payload.response_format = { type: "json_object" };
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chainkin.devnet",
        "X-Title": "Chainkin Companion",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(
        `OpenRouter request failed with status ${res.status} (${res.statusText}): ${errorBody}`
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      throw new Error("OpenRouter returned empty or malformed message content");
    }

    return {
      content,
      model: data.model || model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`OpenRouter request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
