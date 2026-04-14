"use client";
import { useMemo } from "react";
import { UniverseCanvas } from "@/components/three/UniverseCanvas";

export function UniverseClient({ ownedJson }: { ownedJson: string }) {
  const ownedMap = useMemo(() => {
    try {
      const entries = JSON.parse(ownedJson) as Array<[string, { name: string; palette?: { primary: string } }]>;
      return new Map(entries);
    } catch {
      return new Map();
    }
  }, [ownedJson]);

  return <UniverseCanvas ownedPlanets={ownedMap} />;
}
