"use client";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Suspense, useState } from "react";
import { SectorManager } from "./SectorManager";
import { CameraRig } from "./CameraRig";
import { JournalEditor } from "@/components/ui/JournalEditor";
import type { PlanetDescriptor } from "@/lib/procedural/planetGen";

interface Props {
  ownedPlanets?: Map<string, { name: string; palette?: { primary: string } }>;
}

export function UniverseCanvas({ ownedPlanets }: Props) {
  const [selected, setSelected] = useState<PlanetDescriptor | null>(null);

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 200], fov: 70, near: 0.1, far: 50000 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#04050a"]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[100, 200, 100]} intensity={0.9} />
        <Stars radius={8000} depth={400} count={6000} factor={6} fade speed={0.5} />

        <Suspense fallback={null}>
          <SectorManager onSelectPlanet={setSelected} ownedPlanets={ownedPlanets} />
        </Suspense>

        <CameraRig />
      </Canvas>

      <div className="absolute top-4 left-4 text-cosmos-star/80 text-xs font-mono pointer-events-none select-none">
        WASD · Space/Shift · drag to look
      </div>

      {selected && (
        <JournalEditor
          planet={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
