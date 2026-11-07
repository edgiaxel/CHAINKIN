import { z } from "zod";

export const DialogueContextSchema = z.object({
  species: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  speciesName: z.string().min(1).max(32),
  name: z.string().min(1).max(32),
  level: z.number().int().min(1).max(100),
  xp: z.number().int().min(0),
  evolutionStage: z.number().int().min(0).max(10),
  evolutionName: z.string().max(32).optional(),
  recentRitual: z.enum(["none", "observe", "bond", "explore"]).default("none"),
  traits: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(), // [curiosity, courage, empathy, ingenuity]
  ritualCount: z.number().int().nonnegative().optional(),
  walletAddress: z.string().optional(),
});

export type DialogueContext = z.infer<typeof DialogueContextSchema>;

export const DialogueResponseSchema = z.object({
  mood: z.string().max(30),
  speech: z.string().max(200),
  thought: z.string().max(200),
  narrativeInsight: z.string().max(280),
  isFallback: z.boolean().default(false),
});

export type DialogueResponse = z.infer<typeof DialogueResponseSchema>;

export const EvolutionNarrativeRequestSchema = z.object({
  species: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  name: z.string().min(1).max(32),
  level: z.number().int().min(1).max(100),
  choiceId: z.union([z.literal(1), z.literal(2)]),
  choiceName: z.string().min(1).max(32),
  walletAddress: z.string().optional(),
});

export type EvolutionNarrativeRequest = z.infer<typeof EvolutionNarrativeRequestSchema>;

export const EvolutionNarrativeResponseSchema = z.object({
  title: z.string().max(50),
  proclamation: z.string().max(200),
  transformationSummary: z.string().max(280),
  isFallback: z.boolean().default(false),
});

export type EvolutionNarrativeResponse = z.infer<typeof EvolutionNarrativeResponseSchema>;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}
