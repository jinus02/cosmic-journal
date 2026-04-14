"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useSectorStore } from "@/store/useSectorStore";
import { Planet } from "./Planet";
import type { PlanetDescriptor } from "@/lib/procedural/planetGen";

interface Props {
  onSelectPlanet?: (p: PlanetDescriptor) => void;
  ownedPlanets?: Map<string, { name: string; palette?: { primary: string } }>;
}

export function SectorManager({ onSelectPlanet, ownedPlanets }: Props) {
  const { camera } = useThree();
  const updateCamera = useSectorStore((s) => s.updateCamera);
  const planetsBySector = useSectorStore((s) => s.planetsBySector);
  const lastTick = useRef(0);

  // Initial seed at mount
  useEffect(() => {
    updateCamera(camera.position.x, camera.position.y, camera.position.z);
  }, [camera, updateCamera]);

  useFrame((state) => {
    // throttle to 4 Hz to avoid Set diff churn
    if (state.clock.elapsedTime - lastTick.current < 0.25) return;
    lastTick.current = state.clock.elapsedTime;
    updateCamera(camera.position.x, camera.position.y, camera.position.z);
  });

  const allPlanets: PlanetDescriptor[] = [];
  for (const list of planetsBySector.values()) allPlanets.push(...list);

  return (
    <>
      {allPlanets.map((p) => (
        <Planet
          key={p.id}
          planet={p}
          onSelect={onSelectPlanet}
          ownedName={ownedPlanets?.get(p.id)?.name ?? null}
        />
      ))}
    </>
  );
}
