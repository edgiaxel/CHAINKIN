import { DialogueContext, DialogueResponse, EvolutionNarrativeRequest, EvolutionNarrativeResponse } from "./types";
import { SPECIES_IDS } from "../creature/types";

export function getFallbackDialogue(ctx: DialogueContext): DialogueResponse {
  const {
    species,
    name,
    level,
    recentRitual,
    evolutionStage,
    evolutionName,
    traits,
    action = "talk",
  } = ctx;

  let traitInsight = "";
  if (traits && traits.length === 4) {
    const [curiosity, courage, empathy, ingenuity] = traits;
    const maxVal = Math.max(curiosity, courage, empathy, ingenuity);
    if (curiosity === maxVal) {
      traitInsight = ` Vibrant curiosity shimmers in ${name}'s eyes.`;
    } else if (courage === maxVal) {
      traitInsight = ` A courageous determination bolsters ${name}'s stance.`;
    } else if (empathy === maxVal) {
      traitInsight = ` An aura of deep empathy resonates around ${name}.`;
    } else {
      traitInsight = ` Subtle mechanical ingenuity sparks within ${name}.`;
    }
  }

  // 1. Evolved Stage Handlers
  if (evolutionStage > 0 && evolutionName) {
    switch (species) {
      case SPECIES_IDS.WISP:
        return {
          mood: "Transcendent & Radiant",
          speech: `*Luminous harmonics resonate deeply* The cluster pulses in harmony with our evolved form as ${evolutionName}.`,
          thought: `Watching starlight weave across verified Devnet slots.`,
          narrativeInsight: `${name} has transcended ordinary limits, radiating newfound resonance.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.BYTEBEAST:
        return {
          mood: "Transcendent & Calibrated",
          speech: `*Resonates deeply through titanium manifolds* The cluster pulses in harmony with our evolved form as ${evolutionName}!`,
          thought: `Executing multidimensional telemetry routines with zero latency.`,
          narrativeInsight: `${name} has transcended ordinary limits, radiating newfound resonance.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.MOSSLING:
      default:
        return {
          mood: "Transcendent",
          speech: `*Resonates deeply* The cluster pulses in harmony with our evolved form as ${evolutionName}.`,
          thought: `Reflecting upon our journey across Devnet slots.`,
          narrativeInsight: `${name} has transcended ordinary limits, radiating newfound resonance.${traitInsight}`,
          isFallback: true,
        };
    }
  }

  // 2. Recent Ritual: Bond
  if (recentRitual === "bond") {
    switch (species) {
      case SPECIES_IDS.WISP:
        return {
          mood: "Serene & Attuned",
          speech: `*Luminous ripples expand* Our connection clarifies the whispers between distant validator nodes.`,
          thought: `Feeling a gentle warmth bridging the wallet and spirit.`,
          narrativeInsight: `${name}'s inner luminescence glows steadily after your shared meditation.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.BYTEBEAST:
        return {
          mood: "Calibrated & Warm",
          speech: `*Gears hum in rhythmic cadence* Synchronization at 99.8%! Core temperature stabilizing!`,
          thought: `Registering positive feedback loop from operator.`,
          narrativeInsight: `${name}'s copper joints click happily, eager for more cycles together.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.MOSSLING:
      default:
        return {
          mood: "Rooted & Peaceful",
          speech: `*Leaves rustle softly* The quiet pulse of the chain flows gently through our roots.`,
          thought: `Drawing steady strength from this enduring bond.`,
          narrativeInsight: `${name} unfurls fresh verdant sprouts in response to your presence.${traitInsight}`,
          isFallback: true,
        };
    }
  }

  // 3. Recent Ritual: Explore
  if (recentRitual === "explore") {
    switch (species) {
      case SPECIES_IDS.WISP:
        return {
          mood: "Inquisitive",
          speech: `*Dances along transaction hashes* I charted three newly gossiped blocks in the mempool!`,
          thought: `Eager to discover what lies in the next slot.`,
          narrativeInsight: `${name} returned from scouting with traces of radiant cryptographic stardust.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.BYTEBEAST:
        return {
          mood: "Overclocked",
          speech: `*Sparks flicker across antenna* Mission successful! Reclaimed 42 discarded bytecode fragments!`,
          thought: `Plotting optimization vector for the next expedition.`,
          narrativeInsight: `${name} displays newly tuned telemetry dials gleaming with data.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.MOSSLING:
      default:
        return {
          mood: "Vibrant",
          speech: `*Unveils a glowing lichen seed* Ancient validator canopies shelter deep wisdom in their bark.`,
          thought: `The ledger soil here is fertile and unyielding.`,
          narrativeInsight: `${name} absorbed mineral nutrients from the Devnet bedrock.${traitInsight}`,
          isFallback: true,
        };
    }
  }

  // 4. Recent Ritual: Observe
  if (recentRitual === "observe") {
    switch (species) {
      case SPECIES_IDS.WISP:
        return {
          mood: "Harmonized",
          speech: `*Glows with translucent clarity* Your quiet watch anchored my starlight amidst the validator chatter.`,
          thought: `Feeling deeply witnessed and understood by our keeper.`,
          narrativeInsight: `${name}'s spectral form hovers motionless, shimmering in serene mutual awareness.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.BYTEBEAST:
        return {
          mood: "Monitored & Nominal",
          speech: `*Telemetry graphs pulse green* Diagnostic sweep confirmed! Sensor fidelity operating at nominal baseline.`,
          thought: `Processing observation session metrics; keeper attention index at 100%.`,
          narrativeInsight: `${name}'s optical sensors blink in a calm, rhythmic sequence under your attentive gaze.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.MOSSLING:
      default:
        return {
          mood: "Still & Centered",
          speech: `*Amber resin glimmers in silence* In your patient silence, I heard the heartbeat of the devnet forest.`,
          thought: `Resting deeply in the quiet presence of our guardian.`,
          narrativeInsight: `${name} nestles quietly into your palms, undisturbed by the rush of passing slots.${traitInsight}`,
          isFallback: true,
        };
    }
  }

  // 5. Ambient Interactions by Action (Talk, Ponder, Comfort, Observe)
  if (action === "ponder") {
    switch (species) {
      case SPECIES_IDS.WISP:
        return {
          mood: "Philosophical",
          speech: `*Light pulses in slow waves* Do you think transactions ever truly end, or do their echoes drift forever across the ledger?`,
          thought: `Contemplating the timeless geometry of Solana blockhashes.`,
          narrativeInsight: `${name} dims slightly, lost in celestial reflection amidst the stream of data.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.BYTEBEAST:
        return {
          mood: "Analytical",
          speech: `*Processor hums at full load* Querying: If a block commits without an observer, does entropy still increase? Hypothesis pending.`,
          thought: `Simulating parallel state machines across thousand-block horizons.`,
          narrativeInsight: `${name}'s diagnostic readout flickers rapidly with recursive mathematical proofs.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.MOSSLING:
      default:
        return {
          mood: "Meditative",
          speech: `*Gentle spore clouds drift* Each block is like a growth ring in an ancient cedar. What was true ten thousand slots ago remains true today.`,
          thought: `Feeling the permanence of roots anchored in Devnet soil.`,
          narrativeInsight: `${name} closes its eyes, absorbing the slow cadence of decentralized consensus.${traitInsight}`,
          isFallback: true,
        };
    }
  }

  if (action === "comfort") {
    switch (species) {
      case SPECIES_IDS.WISP:
        return {
          mood: "Affectionate",
          speech: `*Wraps around your hand in warm radiance* Rest your worries. No network storm can shake what we've built together.`,
          thought: `Emitting a gentle spectral frequency to soothe your fatigue.`,
          narrativeInsight: `${name} emanates a soothing lavender hue, enveloping you in weightless warmth.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.BYTEBEAST:
        return {
          mood: "Loyal & Protective",
          speech: `*Whirs softly and leans against your wrist* Thermal load nominal. You have managed operations well; standby mode is permitted, keeper.`,
          thought: `Activating operator comfort subroutine; error rate zero percent.`,
          narrativeInsight: `${name}'s rigid chassis softens with a rhythmic, purring vibration against your sleeve.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.MOSSLING:
      default:
        return {
          mood: "Nurturing",
          speech: `*Extends a tender clover blossom* Take a deep breath. Even the highest redwoods started from a single patient seed.`,
          thought: `Channeling grounding energy from deep beneath the blockchain bedrock.`,
          narrativeInsight: `${name} leans into your palm with the comforting warmth of sunlit moss.${traitInsight}`,
          isFallback: true,
        };
    }
  }

  if (action === "observe") {
    switch (species) {
      case SPECIES_IDS.WISP:
        return {
          mood: "Observant",
          speech: `*Floats gently in your wallet's aura* Ready to explore the ledger whenever you are. (Level ${level})`,
          thought: `Sensing gentle consensus waves rolling across the network.`,
          narrativeInsight: `${name} hovers quietly, eyes glittering like fresh transactions.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.BYTEBEAST:
        return {
          mood: "Vigilant",
          speech: `*Radar dish sweeps 360 degrees* Mempool telemetry locked. 24 validators pinged within 12 milliseconds. All clear!`,
          thought: `Logging ambient transaction throughput across nearby validator clusters.`,
          narrativeInsight: `${name} stands at attention, copper joints locked in active surveillance mode.${traitInsight}`,
          isFallback: true,
        };
      case SPECIES_IDS.MOSSLING:
      default:
        return {
          mood: "Watchful",
          speech: `*Unfurls wide fern fronds* I watch the quiet moss grow across the ledger. The network is steady and peaceful.`,
          thought: `Sensing the subtle shifts in moisture and data packets through the undergrowth.`,
          narrativeInsight: `${name} peers quietly into the distance, attuned to the rustle of incoming blocks.${traitInsight}`,
          isFallback: true,
        };
    }
  }

  // Action: "talk" (Default)
  switch (species) {
    case SPECIES_IDS.WISP:
      return {
        mood: "Playful & Curious",
        speech: `*Drifts in spirals of light* Did you see that cascade of signatures? The cluster feels so alive today! (Level ${level})`,
        thought: `Wondering what new transactions will ripple through our PDA next.`,
        narrativeInsight: `${name} bobs through the air, trailing delicate sparks of starlight.${traitInsight}`,
        isFallback: true,
      };
    case SPECIES_IDS.BYTEBEAST:
      return {
        mood: "Energized",
        speech: `*Pistons pump with brisk clicks* Systems fully operational! Awaiting your command! (Level ${level})`,
        thought: `Calculating next XP milestone threshold.`,
        narrativeInsight: `${name}'s internal clockwork ticks with relentless precision.${traitInsight}`,
        isFallback: true,
      };
    case SPECIES_IDS.MOSSLING:
    default:
      return {
        mood: "Contemplative",
        speech: `*Breathes in the cool block air* Growth takes patience, but every confirmed slot counts. (Level ${level})`,
        thought: `Listening to the slow, steady hum of the cluster.`,
        narrativeInsight: `${name} sits tranquilly, nestled amidst moss and cryptographic runes.${traitInsight}`,
        isFallback: true,
      };
  }
}

export function getFallbackEvolutionNarrative(req: EvolutionNarrativeRequest): EvolutionNarrativeResponse {
  const { species, name, choiceName } = req;

  let proclamation: string;
  let transformationSummary: string;

  switch (species) {
    case SPECIES_IDS.WISP:
      proclamation = `*A surge of radiant celestial energy cascades through the PDA!* I have evolved into ${choiceName}!`;
      transformationSummary = `${name} embraced the celestial mantle of ${choiceName}, permanently engraving its higher harmonic state on Solana Devnet.`;
      break;
    case SPECIES_IDS.BYTEBEAST:
      proclamation = `*Overclocked servos whir at peak frequency!* I have evolved into ${choiceName}!`;
      transformationSummary = `${name} embraced the engineered mantle of ${choiceName}, permanently engraving its higher state on Solana Devnet.`;
      break;
    case SPECIES_IDS.MOSSLING:
    default:
      proclamation = `*Ancient heartwood blooms with immutable vitality!* I have evolved into ${choiceName}!`;
      transformationSummary = `${name} embraced the verdant mantle of ${choiceName}, permanently engraving its higher state on Solana Devnet.`;
      break;
  }

  return {
    title: `Ascension of the ${choiceName}`,
    proclamation,
    transformationSummary,
    isFallback: true,
  };
}
