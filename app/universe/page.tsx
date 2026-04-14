import { LangToggle } from "@/components/ui/LangToggle";
import { SessionBadge } from "@/components/ui/SessionBadge";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { UniverseClient } from "./UniverseClient";

export const dynamic = "force-dynamic";

export default async function UniversePage() {
  let planets: Array<{ id: string; name: string; universe_x: number; universe_y: number; universe_z: number; palette: unknown }> = [];
  let email: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const [{ data: userRes }, { data: planetRes }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("planets")
        .select("id, name, universe_x, universe_y, universe_z, palette")
        .in("visibility", ["public", "unlisted"]),
    ]);
    email = userRes?.user?.email ?? null;
    planets = planetRes ?? [];
  }

  const ownedMap = new Map<string, { name: string; palette?: { primary: string } }>();
  for (const p of planets) {
    ownedMap.set(`${p.universe_x}:${p.universe_y}:${p.universe_z}:0`, {
      name: p.name,
      palette: p.palette as { primary: string } | undefined,
    });
  }

  const ownedJson = JSON.stringify(Array.from(ownedMap.entries()));

  return (
    <main className="relative h-screen w-screen">
      <UniverseClient ownedJson={ownedJson} />
      <div className="absolute right-4 top-4 z-30 flex items-center gap-3">
        <LangToggle />
        <SessionBadge email={email} />
      </div>
    </main>
  );
}
