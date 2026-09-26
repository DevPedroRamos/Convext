"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";

function Orb() {
  const mesh = useRef<Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = state.clock.elapsedTime * 0.18;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.28;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.45} floatIntensity={0.8}>
      <mesh ref={mesh} scale={2.2}>
        <icosahedronGeometry args={[1.4, 18]} />
        <MeshDistortMaterial color="#f35703" emissive="#f35703" emissiveIntensity={0.45} roughness={0.35} metalness={0.45} distort={0.35} speed={1.5} />
      </mesh>
    </Float>
  );
}

function Lines() {
  const points = useMemo(() => new Array(18).fill(0).map((_, index) => index), []);
  return points.map((index) => (
    <mesh key={index} position={[(index % 6) - 2.5, Math.floor(index / 6) - 1, -2.8]}>
      <boxGeometry args={[0.02, 0.02, 3.8]} />
      <meshBasicMaterial color="#f35703" transparent opacity={0.14} />
    </mesh>
  ));
}

export function ThreeScene() {
  return (
    <div className="relative h-[520px] overflow-hidden rounded-3xl border border-border bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(243,87,3,.24),transparent_36%)]" />
      <Canvas camera={{ position: [0, 0, 7], fov: 48 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.55} />
        <pointLight position={[4, 4, 4]} color="#f35703" intensity={12} />
        <Stars radius={80} depth={20} count={900} factor={3} saturation={0} fade speed={0.4} />
        <Lines />
        <Orb />
      </Canvas>
      <div className="pointer-events-none absolute bottom-6 left-6 right-6 flex justify-between text-xs uppercase tracking-[.14em] text-white/40">
        <span>Orange emissive</span>
        <span>Reduced motion fallback</span>
      </div>
    </div>
  );
}
