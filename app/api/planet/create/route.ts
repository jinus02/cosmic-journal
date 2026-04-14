import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalysisSchema } from "@/lib/gemini/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const InputSchema = z.object({
  procedural_id: z.string().regex(/^-?\d+:-?\d+:-?\d+:\d+$/),
  position: z.tuple([z.number(), z.number(), z.number()]),
  radius: z.number().positive().max(200),
  seed: z.number().int(),
  name: z.string().min(1).max(80),
  body_md: z.string().min(1).max(8000),
  analysis: AnalysisSchema,
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let parsed;
  try {
    parsed = InputSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "invalid_input", detail: String(err) }, { status: 400 });
  }

  const [sx, sy, sz] = parsed.procedural_id.split(":").slice(0, 3).map(Number);

  // 1) Insert planet (or fetch existing for same coordinate)
  const { data: planet, error: planetErr } = await supabase
    .from("planets")
    .insert({
      owner_id: user.id,
      name: parsed.name,
      seed: parsed.seed,
      universe_x: sx,
      universe_y: sy,
      universe_z: sz,
      biome: parsed.analysis.biome_hint,
      palette: parsed.analysis.palette,
      radius: parsed.radius,
      visibility: "public",
    })
    .select()
    .single();

  if (planetErr) {
    if (planetErr.code === "23505") {
      return NextResponse.json({ error: "planet_already_claimed" }, { status: 409 });
    }
    return NextResponse.json({ error: "planet_insert_failed", detail: planetErr.message }, { status: 500 });
  }

  // 2) Insert entry
  const { error: entryErr } = await supabase.from("journal_entries").insert({
    planet_id: planet.id,
    author_id: user.id,
    title: parsed.name,
    body_md: parsed.body_md,
    mood: parsed.analysis.mood,
    emotion_scores: parsed.analysis.emotion_scores,
    ai_poem: parsed.analysis.poem,
    ai_summary: parsed.analysis.summary,
    language: parsed.analysis.language,
  });

  if (entryErr) {
    return NextResponse.json({ error: "entry_insert_failed", detail: entryErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, planet_id: planet.id });
}
