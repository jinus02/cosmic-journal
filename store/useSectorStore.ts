import { create } from "zustand";
import type { PlanetDescriptor } from "@/lib/procedural/planetGen";
import { generateSectorPlanets } from "@/lib/procedural/planetGen";
import type { SectorKey } from "@/lib/procedural/sectors";
import { activeSectors, sectorOf } from "@/lib/procedural/sectors";

const UNIVERSE_SEED = process.env.NEXT_PUBLIC_COSMIC_UNIVERSE_SEED || "cosmic-journal-2026";

interface SectorState {
  activeKeys: Set<SectorKey>;
  planetsBySector: Map<SectorKey, PlanetDescriptor[]>;
  updateCamera: (x: number, y: number, z: number) => void;
}

export const useSectorStore = create<SectorState>((set, get) => ({
  activeKeys: new Set(),
  planetsBySector: new Map(),
  updateCamera: (x, y, z) => {
    const [cx, cy, cz] = sectorOf(x, y, z);
    const next = new Set(activeSectors(cx, cy, cz));
    const current = get().activeKeys;

    // No diff
    let changed = next.size !== current.size;
    if (!changed) {
      for (const k of next) if (!current.has(k)) { changed = true; break; }
    }
    if (!changed) return;

    const planets = new Map(get().planetsBySector);
    // enter
    for (const key of next) {
      if (!planets.has(key)) {
        const [sx, sy, sz] = key.split(":").map(Number);
        planets.set(key, generateSectorPlanets(UNIVERSE_SEED, sx, sy, sz));
      }
    }
    // leave (free memory)
    for (const key of planets.keys()) {
      if (!next.has(key)) planets.delete(key);
    }
    set({ activeKeys: next, planetsBySector: planets });
  },
}));
