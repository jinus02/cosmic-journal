import { createNoise3D } from "simplex-noise";
import { mulberry32 } from "./seed";

export type Noise3D = (x: number, y: number, z: number) => number;

export function makeNoise3D(seed: number): Noise3D {
  return createNoise3D(mulberry32(seed));
}

// Fractional Brownian motion — layered simplex for organic terrain
export function fbm3(noise: Noise3D, x: number, y: number, z: number, octaves = 5, lacunarity = 2.0, gain = 0.5): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq, z * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}
