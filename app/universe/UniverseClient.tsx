"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";

const UniverseCanvas = dynamic(
  () => import("@/components/three/UniverseCanvas").then((m) => m.UniverseCanvas),
  { ssr: false },
);

interface Props {
  ownedJson: string;
  isAuthenticated?: boolean;
}

export function UniverseClient({ ownedJson, isAuthenticated = false }: Props) {
  const ownedMap = useMemo(() => {
    try {
      const entries = JSON.parse(ownedJson) as Array<[string, { name: string; palette?: { primary: string } }]>;
      return new Map(entries);
    } catch {
      return new Map();
    }
  }, [ownedJson]);

  return <UniverseCanvas ownedPlanets={ownedMap} isAuthenticated={isAuthenticated} />;
}
