import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { analyzeJournalEntry, hashBody } from "@/lib/gemini/analyzeEntry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_LENGTH = 8000;
const MAX_REQUEST_BYTES = 48000;

async function readBody(req: Request): Promise<unknown> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("missing_body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new Error("body_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "analysis_unavailable" }, { status: 503 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await readBody(req);
  } catch (err) {
    const tooLarge = err instanceof Error && err.message === "body_too_large";
    return NextResponse.json({ error: tooLarge ? "body_too_large" : "invalid_json" }, { status: tooLarge ? 413 : 400 });
  }
  const text = body && typeof body === "object" && "body_md" in body && typeof body.body_md === "string"
    ? body.body_md.trim() : "";
  if (!text || text.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: "invalid_body_length" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  // One database transaction shares the budget across every server instance.
  const { data: allowed, error: budgetError } = await admin.rpc("consume_ai_budget", { p_user_id: user.id });
  if (budgetError) {
    return NextResponse.json({ error: "analysis_unavailable" }, { status: 503 });
  }
  if (allowed !== true) {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    const retryAfter = Math.max(1, Math.ceil((tomorrow.getTime() - Date.now()) / 1000));
    return NextResponse.json({ error: "analysis_limit_reached" }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }

  // Identical private journal text must not share a cache across accounts.
  const bodyHash = await hashBody(`${user.id}\0${text}`);
  const { data: cached, error: cacheError } = await admin
    .from("ai_cache").select("payload").eq("body_hash", bodyHash).maybeSingle();
  if (cacheError) {
    return NextResponse.json({ error: "analysis_unavailable" }, { status: 503 });
  }
  if (cached?.payload) {
    return NextResponse.json({ result: cached.payload, cached: true, body_hash: bodyHash });
  }

  try {
    const result = await analyzeJournalEntry(text);
    const { error: insertError } = await admin.from("ai_cache").upsert({ body_hash: bodyHash, payload: result });
    if (insertError) {
      return NextResponse.json({ error: "analysis_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ result, cached: false, body_hash: bodyHash });
  } catch {
    return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
  }
}
