import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CommentList } from "@/components/ui/CommentList";
import Link from "next/link";

interface Params {
  planetId: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { planetId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("planets")
    .select("name, palette, biome")
    .eq("id", planetId)
    .maybeSingle();
  if (!data) return { title: "Planet not found · Cosmic Journal" };

  return {
    title: `${data.name} · Cosmic Journal`,
    description: `A ${data.biome ?? "mysterious"} planet in the Cosmic Journal universe.`,
    openGraph: {
      title: data.name,
      description: `Visit this planet in Cosmic Journal.`,
      type: "article",
    },
  };
}

export default async function PlanetSharePage({ params }: { params: Promise<Params> }) {
  const { planetId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: planet } = await supabase
    .from("planets")
    .select("id, name, biome, palette, radius, created_at, owner_id")
    .eq("id", planetId)
    .maybeSingle();
  if (!planet) notFound();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, title, body_md, mood, ai_poem, ai_summary, language, created_at")
    .eq("planet_id", planetId)
    .order("created_at", { ascending: false });

  // Log a visit (best-effort — RLS allows insert)
  await supabase.from("visits").insert({ planet_id: planetId });

  const palette = (planet.palette as { primary: string; secondary: string; accent: string; emissive: string } | null) ?? {
    primary: "#7a9cff",
    secondary: "#3a4a7a",
    accent: "#ff8aa8",
    emissive: "#0a1a2a",
  };

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto" style={{ overflow: "auto" }}>
      <Link href="/universe" className="text-xs font-mono text-cosmos-star/60 hover:text-cosmos-star">
        ← back to the universe
      </Link>

      <div
        className="mt-6 h-48 rounded-2xl border border-cosmos-aurora/30"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${palette.primary}, ${palette.secondary} 60%, ${palette.emissive})`,
          boxShadow: `0 0 80px ${palette.accent}55`,
        }}
      />

      <h1 className="mt-6 font-display text-4xl text-cosmos-star">{planet.name}</h1>
      <p className="mt-1 text-sm font-mono text-cosmos-star/50 uppercase tracking-wider">
        {planet.biome} · r {planet.radius.toFixed(0)} · born {new Date(planet.created_at).toLocaleDateString()}
      </p>

      <div className="mt-10 space-y-12">
        {(entries ?? []).map((e) => (
          <article key={e.id} className="border-l-2 border-cosmos-aurora/30 pl-6">
            <header className="mb-3">
              <h2 className="font-display text-2xl text-cosmos-star">{e.title}</h2>
              <p className="text-xs font-mono text-cosmos-star/40 uppercase">{e.mood}</p>
            </header>
            {e.ai_poem && (
              <pre className="whitespace-pre-wrap font-display text-cosmos-star/90 italic leading-relaxed mb-4">
                {e.ai_poem}
              </pre>
            )}
            <div className="text-cosmos-star/80 leading-relaxed whitespace-pre-wrap">{e.body_md}</div>
            {e.ai_summary && (
              <p className="mt-3 text-sm text-cosmos-star/50 italic">— {e.ai_summary}</p>
            )}
            <CommentList entryId={e.id} />
          </article>
        ))}
      </div>
    </main>
  );
}
