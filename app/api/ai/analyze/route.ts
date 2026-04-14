import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { analyzeJournalEntry, hashBody } from "@/lib/gemini/analyzeEntry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_LENGTH = 8000;

function hasAdminEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(req: Request) {
  // Anonymous allowed — analysis is a read-only Gemini call, persistence happens
  // only in /api/planet/create which still requires auth.
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

  const bodyHash = await hashBody(text);
  const cacheEnabled = hasAdminEnv();
  const admin = cacheEnabled ? createSupabaseAdminClient() : null;

  if (admin) {
    const { data: cached } = await admin
      .from("ai_cache")
      .select("payload")
      .eq("body_hash", bodyHash)
      .maybeSingle();
    if (cached?.payload) {
      return NextResponse.json({ result: cached.payload, cached: true, body_hash: bodyHash });
    }
  }

  try {
    const result = await analyzeJournalEntry(text);
    if (admin) {
      await admin.from("ai_cache").insert({ body_hash: bodyHash, payload: result });
    }
    return NextResponse.json({ result, cached: false, body_hash: bodyHash });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error";
    console.error("[ai/analyze]", msg);
    return NextResponse.json({ error: "analysis_failed", detail: msg }, { status: 502 });
  }
}
