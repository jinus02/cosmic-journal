import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const InputSchema = z.object({
  entry_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
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

  const { error } = await supabase.from("comments").insert({
    entry_id: parsed.entry_id,
    author_id: user.id,
    body: parsed.body,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
