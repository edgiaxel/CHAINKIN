import { DialogueContext, DialogueResponse, EvolutionNarrativeRequest, EvolutionNarrativeResponse } from "./types";
import { SPECIES_IDS } from "../creature/types";

export function getFallbackDialogue(ctx: DialogueContext): DialogueResponse {
  const { species, name, level, recentRitual, evolutionStage, evolutionName } = ctx;

  if (evolutionStage > 0 && evolutionName) {
    return {
      mood: "Transcendent",
      speech: `*Resonates deeply* The cluster pulses in harmony with our evolved form as ${evolutionName}.`,
      thought: `Reflecting upon our journey across Devnet slots.`,
      narrativeInsight: `${name} has transcended ordinary limits, radiating newfound resonance.`,
      isFallback: true,
    };
  }

  if (recentRitual === "bond") {
    switch (species) {
      case SPECIES_IDS.WISP:
        return {
          mood: "Serene & Attuned",
          speech: `*Luminous ripples expand* Our connection clarifies the whispers between distant validator nodes.`,
          thought: `Feeling a gentle warmth bridging the wallet and spirit.`,
          narrativeInsight: `${name}'s inner luminescence glows steadily after your shared meditation.`,
          isFallback: true,
        };
      case SPECIES_IDS.BYTEBEAST:
        return {
          mood: "Calibrated & Warm",
          speech: `*Gears hum in rhythmic cadence* Synchronization at 99.8%! Core temperature stabilizing!`,
          thought: `Registering positive feedback loop from operator.`,
          narrativeInsight: `${name}'s copper joints click happily, eager for more cycles together.`,
          isFallback: true,
        };
      case SPECIES_IDS.MOSSLING:
        return {
          mood: "Rooted & Peaceful",
          speech: `*Leaves rustle softly* The quiet pulse of the chain flows gently through our roots.`,
          thought: `Drawing steady strength from this enduring bond.`,
          narrativeInsight: `${name} unfurls fresh verdant sprouts in response to your presence.`,
          isFallback: true,
        };
    }
  }

  if (recentRitual === "explore") {
    switch (species) {
      case SPECIES_IDS.WISP:
        return {
          mood: "Inquisitive",
          speech: `*Dances along transaction hashes* I charted three newly gossiped blocks in the mempool!`,
          thought: `Eager to discover what lies in the next slot.`,
          narrativeInsight: `${name} returned from scouting with traces of radiant cryptographic stardust.`,
          isFallback: true,
        };
      case SPECIES_IDS.BYTEBEAST:
        return {
          mood: "Overclocked",
          speech: `*Sparks flicker across antenna* Mission successful! Reclaimed 42 discarded bytecode fragments!`,
          thought: `Plotting optimization vector for the next expedition.`,
          narrativeInsight: `${name} displays newly tuned telemetry dials gleaming with data.`,
          isFallback: true,
        };
      case SPECIES_IDS.MOSSLING:
        return {
          mood: "Vibrant",
          speech: `*Unveils a glowing lichen seed* Ancient validator canopies shelter deep wisdom in their bark.`,
          thought: `The ledger soil here is fertile and unyielding.`,
          narrativeInsight: `${name} absorbed mineral nutrients from the Devnet bedrock.`,
          isFallback: true,
        };
    }
  }

  // Default / Observe
  switch (species) {
    case SPECIES_IDS.WISP:
      return {
        mood: "Observant",
        speech: `*Floats gently in your wallet's aura* Ready to explore the ledger whenever you are. (Level ${level})`,
        thought: `Sensing gentle consensus waves rolling across the network.`,
        narrativeInsight: `${name} hovers quietly, eyes glittering like fresh transactions.`,
        isFallback: true,
      };
    case SPECIES_IDS.BYTEBEAST:
      return {
        mood: "Energized",
        speech: `*Pistons pump with brisk clicks* Systems fully operational! Awaiting your command! (Level ${level})`,
        thought: `Calculating next XP milestone threshold.`,
        narrativeInsight: `${name}'s internal clockwork ticks with relentless precision.`,
        isFallback: true,
      };
    case SPECIES_IDS.MOSSLING:
    default:
      return {
        mood: "Contemplative",
        speech: `*Breathes in the cool block air* Growth takes patience, but every confirmed slot counts. (Level ${level})`,
        thought: `Listening to the slow, steady hum of the cluster.`,
        narrativeInsight: `${name} sits tranquilly, nestled amidst moss and cryptographic runes.`,
        isFallback: true,
      };
  }
}

export function getFallbackEvolutionNarrative(req: EvolutionNarrativeRequest): EvolutionNarrativeResponse {
  const { name, choiceName } = req;
  return {
    title: `Ascension of the ${choiceName}`,
    proclamation: `*A surge of verified energy cascades through the PDA!* I have evolved into ${choiceName}!`,
    transformationSummary: `${name} embraced the mantle of ${choiceName}, permanently engraving its higher state on Solana Devnet.`,
    isFallback: true,
  };
}
