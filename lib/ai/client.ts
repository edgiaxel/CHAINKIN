import {
  DialogueContext,
  DialogueResponse,
  EvolutionNarrativeRequest,
  EvolutionNarrativeResponse,
} from "./types";
import { getFallbackDialogue, getFallbackEvolutionNarrative } from "./fallback";

export async function fetchCreatureDialogue(ctx: DialogueContext): Promise<DialogueResponse> {
  try {
    const res = await fetch("/api/creature/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ctx),
    });

    if (!res.ok) {
      console.warn("Dialogue API returned non-OK status:", res.status);
      return getFallbackDialogue(ctx);
    }

    const data = await res.json();
    return data as DialogueResponse;
  } catch (err) {
    console.warn("Failed to reach dialogue API, using client fallback:", err);
    return getFallbackDialogue(ctx);
  }
}

export async function fetchEvolutionNarrative(
  req: EvolutionNarrativeRequest
): Promise<EvolutionNarrativeResponse> {
  try {
    const res = await fetch("/api/creature/evolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      console.warn("Evolution narrative API returned non-OK status:", res.status);
      return getFallbackEvolutionNarrative(req);
    }

    const data = await res.json();
    return data as EvolutionNarrativeResponse;
  } catch (err) {
    console.warn("Failed to reach evolution API, using client fallback:", err);
    return getFallbackEvolutionNarrative(req);
  }
}
