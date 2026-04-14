"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// Free-fly camera: WASD = strafe/forward/back, Space/Shift = up/down,
// mouse drag (LMB held) = look. Damped, simple, good enough for MVP.

const MAX_SPEED = 240;
const ACCEL = 600;
const DAMP = 4.0;

export function CameraRig() {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = () => { dragging.current = false; lastPointer.current = null; };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current || !lastPointer.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      yaw.current -= dx * 0.0025;
      pitch.current -= dy * 0.0025;
      pitch.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch.current));
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const dom = gl.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [gl]);

  useFrame((_, dt) => {
    // Build orientation
    const euler = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);

    // Acceleration from input
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(euler);
    const up = new THREE.Vector3(0, 1, 0);
    const accel = new THREE.Vector3();
    if (keys.current["KeyW"]) accel.addScaledVector(forward, 1);
    if (keys.current["KeyS"]) accel.addScaledVector(forward, -1);
    if (keys.current["KeyA"]) accel.addScaledVector(right, -1);
    if (keys.current["KeyD"]) accel.addScaledVector(right, 1);
    if (keys.current["Space"]) accel.addScaledVector(up, 1);
    if (keys.current["ShiftLeft"]) accel.addScaledVector(up, -1);
    if (accel.lengthSq() > 0) accel.normalize().multiplyScalar(ACCEL);

    velocity.current.addScaledVector(accel, dt);
    velocity.current.multiplyScalar(Math.max(0, 1 - DAMP * dt));
    if (velocity.current.length() > MAX_SPEED) {
      velocity.current.setLength(MAX_SPEED);
    }
    camera.position.addScaledVector(velocity.current, dt);
  });

  return null;
}
