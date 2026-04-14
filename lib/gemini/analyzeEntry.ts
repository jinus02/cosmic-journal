// Server-only — analyzes a journal entry via Gemini and returns a validated result.
// Model: gemini-2.5-flash with thinkingBudget=0 (errors_log #22 — JSON tasks must
// disable thinking or output gets truncated).

import { GoogleGenAI } from "@google/genai";
import { AnalysisSchema, GeminiResponseSchema, type AnalysisResult } from "./schema";
import { withKeyFallback } from "./keyPool";

const MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are Cosmic Journal's poetic analyst.
Given a journal entry, return JSON matching the schema exactly.
The entry may be in Korean or English — detect the language and write the poem
in the SAME language. Tone: gentle, cosmic, contemplative.
Choose a palette (4 hex colors) that visually expresses the dominant mood:
- serene: cool blues/cyans
- melancholic: muted indigos/greys
- hopeful: warm golds/peach
- anxious: stormy violets
- joyful: vivid corals/yellows
- contemplative: deep teals/silvers
Pick a biome that the planet would have if shaped by this emotion.
Poem: 4 to 8 short lines, no title.`;

export async function analyzeJournalEntry(bodyMd: string): Promise<AnalysisResult> {
  const result = await withKeyFallback(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { role: "user", parts: [{ text: bodyMd }] },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: GeminiResponseSchema as never,
        // CRITICAL: disable thinking for JSON tasks (errors_log #22)
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.85,
        maxOutputTokens: 1024,
      },
    });
    const text = response.text;
    if (!text) throw new Error("Gemini returned empty response");
    return text;
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(result);
  } catch {
    // Defensive: extract first {...} block
    const match = result.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini response is not JSON: " + result.slice(0, 200));
    parsed = JSON.parse(match[0]);
  }
  return AnalysisSchema.parse(parsed);
}

// SHA-256 hash helper for ai_cache key
export async function hashBody(body: string): Promise<string> {
  const enc = new TextEncoder().encode(body);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
