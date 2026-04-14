// Sector chunking — universe is divided into SECTOR_SIZE cubes.
// Active sectors = those within ACTIVE_RADIUS of the camera (Manhattan).

export const SECTOR_SIZE = 2000;
export const ACTIVE_RADIUS = 2;

export type SectorKey = `${number}:${number}:${number}`;

export function sectorOf(x: number, y: number, z: number): [number, number, number] {
  return [
    Math.floor(x / SECTOR_SIZE),
    Math.floor(y / SECTOR_SIZE),
    Math.floor(z / SECTOR_SIZE),
  ];
}

export function sectorKey(sx: number, sy: number, sz: number): SectorKey {
  return `${sx}:${sy}:${sz}`;
}

export function activeSectors(cx: number, cy: number, cz: number, radius = ACTIVE_RADIUS): SectorKey[] {
  const keys: SectorKey[] = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) <= radius) {
          keys.push(sectorKey(cx + dx, cy + dy, cz + dz));
        }
      }
    }
  }
  return keys;
}

export function sectorOrigin(sx: number, sy: number, sz: number): [number, number, number] {
  return [sx * SECTOR_SIZE, sy * SECTOR_SIZE, sz * SECTOR_SIZE];
}
