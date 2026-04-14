"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { Vector3 } from "three";
import { SectorManager } from "./SectorManager";
import { CameraRig } from "./CameraRig";
import { JournalEditor } from "@/components/ui/JournalEditor";
import { useI18n } from "@/lib/i18n/useI18n";
import type { PlanetDescriptor, Biome } from "@/lib/procedural/planetGen";
import { sectorOf } from "@/lib/procedural/sectors";

interface Props {
  ownedPlanets?: Map<string, { name: string; palette?: { primary: string } }>;
  isAuthenticated?: boolean;
}

function EmptySpaceClicker({ onPick }: { onPick: (p: PlanetDescriptor) => void }) {
  const { camera } = useThree();

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent;
      if (ev.type !== "cj:empty-click") return;
      const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      const target = new Vector3()
        .copy(camera.position)
        .add(forward.multiplyScalar(400));

      const [sx, sy, sz] = sectorOf(target.x, target.y, target.z);
      const biomes: Biome[] = ["ocean", "desert", "forest", "ice", "lava", "crystal"];
      const biome = biomes[Math.floor(Math.random() * biomes.length)];
      const seed = Math.floor(Math.random() * 2 ** 31);

      onPick({
        id: `${sx}:${sy}:${sz}:999`,
        position: [target.x, target.y, target.z],
        radius: 18,
        biome,
        baseColor: "#7a9cff",
        emissive: "#0a1a2a",
        hasRing: false,
        hasAtmosphere: true,
        seed,
      });
    };
    window.addEventListener("cj:empty-click", handler);
    return () => window.removeEventListener("cj:empty-click", handler);
  }, [camera, onPick]);

  return null;
}

export function UniverseCanvas({ ownedPlanets, isAuthenticated = false }: Props) {
  const t = useI18n();
  const [selected, setSelected] = useState<PlanetDescriptor | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setIsCoarse(coarse);
    if (!localStorage.getItem("cj_seen_hint")) setHintVisible(true);
  }, []);

  const dismissHint = () => {
    setHintVisible(false);
    try {
      localStorage.setItem("cj_seen_hint", "1");
    } catch {}
  };

  const handlePointerMissed = () => {
    if (!selected) window.dispatchEvent(new CustomEvent("cj:empty-click"));
  };

  return (
    <div className="absolute inset-0" style={{ touchAction: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 200], fov: 70, near: 0.1, far: 50000 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onPointerMissed={handlePointerMissed}
      >
        <color attach="background" args={["#04050a"]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[100, 200, 100]} intensity={0.9} />
        <Stars radius={8000} depth={400} count={6000} factor={6} fade speed={0.5} />

        <Suspense fallback={null}>
          <SectorManager onSelectPlanet={setSelected} ownedPlanets={ownedPlanets} />
        </Suspense>

        <EmptySpaceClicker onPick={setSelected} />
        <CameraRig />
      </Canvas>

      <div className="absolute top-4 left-4 text-cosmos-star/80 text-xs font-mono pointer-events-none select-none">
        WASD · Space/Shift · drag to look
      </div>

      {hintVisible && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-md rounded-xl border border-cosmos-aurora/40 bg-cosmos-deep/90 px-5 py-3 text-sm text-cosmos-star/90 backdrop-blur-sm">
          <p className="leading-relaxed">
            {isCoarse ? t("universe.hint.mobile") : t("universe.hint.desktop")}
          </p>
          <button
            onClick={dismissHint}
            className="mt-2 text-xs font-mono text-cosmos-aurora hover:text-cosmos-star"
          >
            ✕ dismiss
          </button>
        </div>
      )}

      {selected && (
        <JournalEditor
          planet={selected}
          onClose={() => setSelected(null)}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
}
