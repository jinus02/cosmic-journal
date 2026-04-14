import { z } from "zod";

export const HEX = /^#[0-9a-fA-F]{6}$/;

export const AnalysisSchema = z.object({
  language: z.enum(["en", "ko"]),
  mood: z.enum(["serene", "melancholic", "hopeful", "anxious", "joyful", "contemplative"]),
  emotion_scores: z.object({
    joy: z.number().min(0).max(1),
    sadness: z.number().min(0).max(1),
    anger: z.number().min(0).max(1),
    fear: z.number().min(0).max(1),
    wonder: z.number().min(0).max(1),
  }),
  palette: z.object({
    primary: z.string().regex(HEX),
    secondary: z.string().regex(HEX),
    accent: z.string().regex(HEX),
    emissive: z.string().regex(HEX),
  }),
  biome_hint: z.enum(["ocean", "desert", "forest", "ice", "lava", "crystal"]),
  poem: z.string().min(10).max(800),
  summary: z.string().min(5).max(300),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

// Gemini responseSchema (JSON Schema dialect Gemini accepts)
export const GeminiResponseSchema = {
  type: "object",
  properties: {
    language: { type: "string", enum: ["en", "ko"] },
    mood: { type: "string", enum: ["serene", "melancholic", "hopeful", "anxious", "joyful", "contemplative"] },
    emotion_scores: {
      type: "object",
      properties: {
        joy: { type: "number" },
        sadness: { type: "number" },
        anger: { type: "number" },
        fear: { type: "number" },
        wonder: { type: "number" },
      },
      required: ["joy", "sadness", "anger", "fear", "wonder"],
    },
    palette: {
      type: "object",
      properties: {
        primary: { type: "string" },
        secondary: { type: "string" },
        accent: { type: "string" },
        emissive: { type: "string" },
      },
      required: ["primary", "secondary", "accent", "emissive"],
    },
    biome_hint: { type: "string", enum: ["ocean", "desert", "forest", "ice", "lava", "crystal"] },
    poem: { type: "string" },
    summary: { type: "string" },
  },
  required: ["language", "mood", "emotion_scores", "palette", "biome_hint", "poem", "summary"],
} as const;
