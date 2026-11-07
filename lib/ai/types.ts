import { z } from "zod";

export const DialogueContextSchema = z.object({
  species: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  speciesName: z.string().max(20),
  name: z.string().max(32),
  level: z.number().int().min(1).max(100),
  xp: z.number().int().min(0),
  evolutionStage: z.number().int().min(0).max(10),
  evolutionName: z.string().max(32).optional(),
  recentRitual: z.enum(["none", "observe", "bond", "explore"]).default("none"),
});

export type DialogueContext = z.infer<typeof DialogueContextSchema>;

export const DialogueResponseSchema = z.object({
  mood: z.string().max(30),
  speech: z.string().max(200),
  thought: z.string().max(200),
  narrativeInsight: z.string().max(280),
  isFallback: z.boolean(),
});

export type DialogueResponse = z.infer<typeof DialogueResponseSchema>;

export const EvolutionNarrativeRequestSchema = z.object({
  species: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  name: z.string().max(32),
  level: z.number().int().min(1).max(100),
  choiceId: z.union([z.literal(1), z.literal(2)]),
  choiceName: z.string().max(32),
});

export type EvolutionNarrativeRequest = z.infer<typeof EvolutionNarrativeRequestSchema>;

export const EvolutionNarrativeResponseSchema = z.object({
  title: z.string().max(50),
  proclamation: z.string().max(200),
  transformationSummary: z.string().max(280),
  isFallback: z.boolean(),
});

export type EvolutionNarrativeResponse = z.infer<typeof EvolutionNarrativeResponseSchema>;
