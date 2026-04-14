import { create } from "zustand";

export type CameraMode = "fly" | "orbit" | "walk";

interface CameraState {
  mode: CameraMode;
  focusedPlanetId: string | null;
  setMode: (mode: CameraMode) => void;
  focusPlanet: (id: string | null) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  mode: "fly",
  focusedPlanetId: null,
  setMode: (mode) => set({ mode }),
  focusPlanet: (id) => set({ focusedPlanetId: id, mode: id ? "orbit" : "fly" }),
}));
