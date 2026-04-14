"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { PlanetDescriptor } from "@/lib/procedural/planetGen";

interface Props {
  planet: PlanetDescriptor;
  onSelect?: (p: PlanetDescriptor) => void;
  ownedName?: string | null;
}

export function Planet({ planet, onSelect, ownedName }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const baseColor = useMemo(() => new THREE.Color(planet.baseColor), [planet.baseColor]);
  const emissive = useMemo(() => new THREE.Color(planet.emissive), [planet.emissive]);

  useFrame((_, dt) => {
    if (meshRef.current) meshRef.current.rotation.y += dt * 0.05;
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.02;
  });

  return (
    <group position={planet.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect?.(planet); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        <icosahedronGeometry args={[planet.radius, 4]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={0.25}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {planet.hasAtmosphere && (
        <mesh>
          <sphereGeometry args={[planet.radius * 1.06, 32, 32]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>
      )}

      {planet.hasRing && (
        <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[planet.radius * 1.4, planet.radius * 2.0, 64]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}

      {ownedName && (
        <Html center distanceFactor={120} position={[0, planet.radius + 4, 0]} style={{ pointerEvents: "none" }}>
          <div className="px-2 py-1 rounded bg-cosmos-void/70 text-cosmos-star text-xs font-display whitespace-nowrap border border-cosmos-aurora/30">
            {ownedName}
          </div>
        </Html>
      )}
    </group>
  );
}
