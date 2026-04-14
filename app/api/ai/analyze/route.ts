import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { analyzeJournalEntry, hashBody } from "@/lib/gemini/analyzeEntry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_LENGTH = 8000;

export async function POST(req: Request) {
  // 1) Auth
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 2) Validate input
  let body: { body_md?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const text = typeof body.body_md === "string" ? body.body_md.trim() : "";
  if (!text || text.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: "invalid_body_length" }, { status: 400 });
  }

  // 3) Cache lookup (server-only via service role)
  const admin = createSupabaseAdminClient();
  const bodyHash = await hashBody(text);
  const { data: cached } = await admin
    .from("ai_cache")
    .select("payload")
    .eq("body_hash", bodyHash)
    .maybeSingle();

  if (cached?.payload) {
    return NextResponse.json({ result: cached.payload, cached: true, body_hash: bodyHash });
  }

  // 4) Call Gemini
  try {
    const result = await analyzeJournalEntry(text);
    await admin.from("ai_cache").insert({ body_hash: bodyHash, payload: result });
    return NextResponse.json({ result, cached: false, body_hash: bodyHash });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error";
    console.error("[ai/analyze]", msg);
    return NextResponse.json({ error: "analysis_failed", detail: msg }, { status: 502 });
  }
}
