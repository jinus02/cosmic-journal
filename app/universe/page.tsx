import { UniverseCanvas } from "@/components/three/UniverseCanvas";
import { LangToggle } from "@/components/ui/LangToggle";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UniversePage() {
  // Fetch all public planets so the client can highlight owned ones in the procedural grid
  const supabase = await createSupabaseServerClient();
  const { data: planets } = await supabase
    .from("planets")
    .select("id, name, universe_x, universe_y, universe_z, palette")
    .in("visibility", ["public", "unlisted"]);

  // Map procedural id "sx:sy:sz:0" → planet meta (best-effort: first planet in each sector)
  const ownedMap = new Map<string, { name: string; palette?: { primary: string } }>();
  for (const p of planets ?? []) {
    ownedMap.set(`${p.universe_x}:${p.universe_y}:${p.universe_z}:0`, {
      name: p.name,
      palette: p.palette as { primary: string } | undefined,
    });
  }

  // Pass through serializable shape
  const ownedJson = JSON.stringify(Array.from(ownedMap.entries()));

  return (
    <main className="relative h-screen w-screen">
      <UniverseClient ownedJson={ownedJson} />
      <div className="absolute right-4 top-4 z-30 flex items-center gap-3">
        <LangToggle />
        <Link href="/" className="text-xs font-mono text-cosmos-star/60 hover:text-cosmos-star">
          ← home
        </Link>
      </div>
    </main>
  );
}

// Client wrapper to deserialize the owned-planet map
import { UniverseClient } from "./UniverseClient";
