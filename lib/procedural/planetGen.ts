import { mulberry32, planetSeed, sectorSeed } from "./seed";
import { SECTOR_SIZE } from "./sectors";

export type Biome = "ocean" | "desert" | "forest" | "ice" | "lava" | "crystal";

export interface PlanetDescriptor {
  id: string;                 // procedural id "sx:sy:sz:idx"
  position: [number, number, number];
  radius: number;
  biome: Biome;
  baseColor: string;          // hex
  emissive: string;           // hex
  hasRing: boolean;
  hasAtmosphere: boolean;
  seed: number;
}

const BIOME_PALETTE: Record<Biome, { base: string; emissive: string }> = {
  ocean:   { base: "#2a6fb5", emissive: "#0a1a2a" },
  desert:  { base: "#c89561", emissive: "#2a1a08" },
  forest:  { base: "#3a7a45", emissive: "#0a1f10" },
  ice:     { base: "#c8e3ff", emissive: "#1a2a3a" },
  lava:    { base: "#b8341a", emissive: "#5a0a00" },
  crystal: { base: "#a87bd6", emissive: "#2a0a4a" },
};

const BIOMES: Biome[] = ["ocean", "desert", "forest", "ice", "lava", "crystal"];

function pickBiome(rand: () => number): Biome {
  return BIOMES[Math.floor(rand() * BIOMES.length)];
}

// Density field: how many planets in this sector?
export function sectorPlanetCount(universeSeed: string, sx: number, sy: number, sz: number): number {
  const rand = mulberry32(sectorSeed(universeSeed, sx, sy, sz));
  // Sparse universe: 70% empty, 20% 1-2 planets, 10% cluster of 3-5
  const r = rand();
  if (r < 0.7) return 0;
  if (r < 0.9) return 1 + Math.floor(rand() * 2);
  return 3 + Math.floor(rand() * 3);
}

export function generateSectorPlanets(
  universeSeed: string,
  sx: number,
  sy: number,
  sz: number,
): PlanetDescriptor[] {
  const count = sectorPlanetCount(universeSeed, sx, sy, sz);
  if (count === 0) return [];

  const planets: PlanetDescriptor[] = [];
  for (let i = 0; i < count; i++) {
    const seed = planetSeed(universeSeed, sx, sy, sz, i);
    const rand = mulberry32(seed);

    // Position within sector (with margin so planets don't clip sector boundaries)
    const margin = SECTOR_SIZE * 0.1;
    const range = SECTOR_SIZE - 2 * margin;
    const px = sx * SECTOR_SIZE + margin + rand() * range;
    const py = sy * SECTOR_SIZE + margin + rand() * range;
    const pz = sz * SECTOR_SIZE + margin + rand() * range;

    const biome = pickBiome(rand);
    const palette = BIOME_PALETTE[biome];
    const radius = 8 + rand() * 22; // 8..30 units

    planets.push({
      id: `${sx}:${sy}:${sz}:${i}`,
      position: [px, py, pz],
      radius,
      biome,
      baseColor: palette.base,
      emissive: palette.emissive,
      hasRing: rand() < 0.18,
      hasAtmosphere: rand() < 0.55,
      seed,
    });
  }
  return planets;
}
