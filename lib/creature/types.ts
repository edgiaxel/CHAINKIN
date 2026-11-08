import { z } from "zod";

export const SPECIES_IDS = {
  WISP: 0,
  BYTEBEAST: 1,
  MOSSLING: 2,
} as const;

export type SpeciesId = (typeof SPECIES_IDS)[keyof typeof SPECIES_IDS];

export interface SpeciesMetadata {
  id: SpeciesId;
  name: string;
  tagline: string;
  description: string;
  baseTraits: [number, number, number, number]; // [curiosity, courage, empathy, ingenuity]
  color: string;
  accentColor: string;
}

export const SPECIES_CATALOG: Record<SpeciesId, SpeciesMetadata> = {
  [SPECIES_IDS.WISP]: {
    id: SPECIES_IDS.WISP,
    name: "Wisp",
    tagline: "Curious, observant, ethereal",
    description: "A shimmering spirit that drifts through block hashes and feeds on node consensus.",
    baseTraits: [12, 6, 10, 8],
    color: "#38bdf8",
    accentColor: "#0284c7",
  },
  [SPECIES_IDS.BYTEBEAST]: {
    id: SPECIES_IDS.BYTEBEAST,
    name: "Bytebeast",
    tagline: "Energetic, inventive, mechanical",
    description: "A clockwork dynamo assembled from reclaimed compute cycles and copper coils.",
    baseTraits: [8, 12, 6, 10],
    color: "#f59e0b",
    accentColor: "#d97706",
  },
  [SPECIES_IDS.MOSSLING]: {
    id: SPECIES_IDS.MOSSLING,
    name: "Mossling",
    tagline: "Calm, resilient, nature-linked",
    description: "An ancient seed cluster rooted in immutable state and solar energy.",
    baseTraits: [7, 8, 13, 8],
    color: "#10b981",
    accentColor: "#059669",
  },
};

export const RITUAL_IDS = {
  OBSERVE: 0,
  BOND: 1,
  EXPLORE: 2,
} as const;

export type RitualId = (typeof RITUAL_IDS)[keyof typeof RITUAL_IDS];

export interface RitualMetadata {
  id: RitualId;
  name: string;
  description: string;
  isOnChain: boolean;
  xpReward: number;
  traitDelta: [number, number, number, number];
}

export const RITUAL_CATALOG: Record<RitualId, RitualMetadata> = {
  [RITUAL_IDS.OBSERVE]: {
    id: RITUAL_IDS.OBSERVE,
    name: "Observe",
    description: "Quietly study your Chainkin to hear its latest thoughts. No transaction required.",
    isOnChain: false,
    xpReward: 0,
    traitDelta: [0, 0, 0, 0],
  },
  [RITUAL_IDS.BOND]: {
    id: RITUAL_IDS.BOND,
    name: "Bond",
    description: "Channel connection into your companion. Grants +30 XP and deepens empathy & curiosity.",
    isOnChain: true,
    xpReward: 30,
    traitDelta: [2, 0, 3, 0],
  },
  [RITUAL_IDS.EXPLORE]: {
    id: RITUAL_IDS.EXPLORE,
    name: "Explore",
    description: "Send your Chainkin scouting Devnet validators. Grants +40 XP and bolsters courage & ingenuity.",
    isOnChain: true,
    xpReward: 40,
    traitDelta: [0, 3, 0, 2],
  },
};

export interface EvolutionChoice {
  id: number;
  stage: number; // 1, 2, or 3
  requiredLevel: number;
  requiredXp: number;
  speciesId: SpeciesId;
  name: string;
  title: string;
  description: string;
  traitBonus: [number, number, number, number];
}

// Stage I (Level 3 / 100 XP)
export const EVOLUTION_CATALOG: Record<SpeciesId, [EvolutionChoice, EvolutionChoice]> = {
  [SPECIES_IDS.WISP]: [
    {
      id: 1,
      stage: 1,
      requiredLevel: 3,
      requiredXp: 100,
      speciesId: SPECIES_IDS.WISP,
      name: "Astral Guide",
      title: "The Ethereal Navigator",
      description: "Ascends into luminous star-trails, discerning truth in chaotic transaction streams.",
      traitBonus: [5, 2, 8, 3],
    },
    {
      id: 2,
      stage: 1,
      requiredLevel: 3,
      requiredXp: 100,
      speciesId: SPECIES_IDS.WISP,
      name: "Chrono Phantom",
      title: "The Slot Weaver",
      description: "Phases through time-locked state, dancing between past slots and future blocks.",
      traitBonus: [7, 4, 3, 6],
    },
  ],
  [SPECIES_IDS.BYTEBEAST]: [
    {
      id: 1,
      stage: 1,
      requiredLevel: 3,
      requiredXp: 100,
      speciesId: SPECIES_IDS.BYTEBEAST,
      name: "Cyber Warden",
      title: "The Iron Sentinel",
      description: "Forges heavy cryptographic plating to shield its cluster from corrupt data.",
      traitBonus: [2, 9, 3, 6],
    },
    {
      id: 2,
      stage: 1,
      requiredLevel: 3,
      requiredXp: 100,
      speciesId: SPECIES_IDS.BYTEBEAST,
      name: "Spark Overdrive",
      title: "The Lightning Artificer",
      description: "Overclocks its core reactor to synthesize novel algorithms in fractions of a second.",
      traitBonus: [6, 7, 2, 9],
    },
  ],
  [SPECIES_IDS.MOSSLING]: [
    {
      id: 1,
      stage: 1,
      requiredLevel: 3,
      requiredXp: 100,
      speciesId: SPECIES_IDS.MOSSLING,
      name: "Elder Arbor",
      title: "The Heartwood Titan",
      description: "Roots deep into the ledger canopy, enduring validator splits with unyielding calm.",
      traitBonus: [3, 6, 10, 3],
    },
    {
      id: 2,
      stage: 1,
      requiredLevel: 3,
      requiredXp: 100,
      speciesId: SPECIES_IDS.MOSSLING,
      name: "Bloom Weaver",
      title: "The Spore Alchemist",
      description: "Blossoms with luminescent flora that heal damaged state and nourish dormant seeds.",
      traitBonus: [6, 4, 8, 6],
    },
  ],
};

// Multi-tier Evolution Stages for Levels 3, 7, 15
export interface EvolutionTierInfo {
  stage: number;
  requiredLevel: number;
  requiredXp: number;
  label: string;
  description: string;
}

export const EVOLUTION_TIERS: EvolutionTierInfo[] = [
  {
    stage: 1,
    requiredLevel: 3,
    requiredXp: 100,
    label: "Stage I: Awakening Specialization",
    description: "Initial specialization unlocking dedicated branch paths on-chain.",
  },
  {
    stage: 2,
    requiredLevel: 7,
    requiredXp: 800,
    label: "Stage II: Harmonic Resonance",
    description: "Advanced harmony channeling deeper validator attunement.",
  },
  {
    stage: 3,
    requiredLevel: 15,
    requiredXp: 3200,
    label: "Stage III: Transcendent Apex",
    description: "The ultimate form embodying permanent Solana consensus mastery.",
  },
];

export const EVOLUTION_REQUIRED_LEVEL = 3;
export const EVOLUTION_REQUIRED_XP = 100;

export interface CreatureState {
  owner: string; // Base58 public key
  creatureId: string; // Base58 PDA or identifier
  species: SpeciesId;
  name: string;
  level: number;
  xp: number;
  traits: [number, number, number, number]; // [curiosity, courage, empathy, ingenuity]
  ritualCount: number;
  evolutionStage: number; // 0 = base, 1 = evolved
  evolutionChoice: number; // 0 = none, 1 = option A, 2 = option B
  lastActionSlot: number;
  bump: number;
}

export const CreatureStateSchema = z.object({
  owner: z.string().min(32).max(44),
  creatureId: z.string().min(32).max(44),
  species: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  name: z.string().min(1).max(32),
  level: z.number().int().min(1).max(100),
  xp: z.number().int().min(0),
  traits: z.tuple([
    z.number().int().min(0).max(255),
    z.number().int().min(0).max(255),
    z.number().int().min(0).max(255),
    z.number().int().min(0).max(255),
  ]),
  ritualCount: z.number().int().min(0),
  evolutionStage: z.number().int().min(0).max(10),
  evolutionChoice: z.number().int().min(0).max(255),
  lastActionSlot: z.number().int().min(0),
  bump: z.number().int().min(0).max(255),
});

export function calculateLevel(xp: number): number {
  if (xp >= 3200) return 15;
  if (xp >= 2600) return 14;
  if (xp >= 2100) return 13;
  if (xp >= 1700) return 12;
  if (xp >= 1400) return 11;
  if (xp >= 1150) return 10;
  if (xp >= 950) return 9;
  if (xp >= 800) return 8;
  if (xp >= 650) return 7;
  if (xp >= 500) return 6;
  if (xp >= 350) return 5;
  if (xp >= 200) return 4;
  if (xp >= 100) return 3;
  if (xp >= 40) return 2;
  return 1;
}

export function isEvolutionEligible(creature: Pick<CreatureState, "level" | "xp" | "evolutionStage">): boolean {
  return creature.evolutionStage === 0 && (creature.level >= EVOLUTION_REQUIRED_LEVEL || creature.xp >= EVOLUTION_REQUIRED_XP);
}
