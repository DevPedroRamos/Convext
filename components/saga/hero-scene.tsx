"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { buildPiece, createPieceMaterial } from "@/components/saga/chess-3d";
import type { PieceKind } from "@/lib/saga-content";
import { siteReducedMotion } from "@/lib/motion";

/**
 * Peças do hero, torneadas em código (LatheGeometry): nada de modelo externo.
 * Únicos movimentos: o paralaxe de ponteiro amortecido (decorativo, só em
 * mouse) e o render pausado quando o hero sai da tela.
 */

// Composição: o rei (a marca do cliente) no centro, cercado pelas demais peças.
const layout: { kind: PieceKind; position: [number, number, number]; turn: number }[] = [
  { kind: "king", position: [0.2, 0, 0], turn: 0.3 },
  { kind: "queen", position: [-1.35, 0, -1.2], turn: -0.2 },
  { kind: "bishop", position: [1.8, 0, -1.5], turn: 0.5 },
  { kind: "knight", position: [-0.9, 0, -2.6], turn: -0.25 },
  { kind: "rook", position: [3.05, 0, 0.2], turn: 0.2 },
  { kind: "pawn", position: [1.45, 0, 1.3], turn: 0 },
];

function Pieces() {
  const material = useMemo(() => createPieceMaterial(), []);
  const groups = useMemo(
    () =>
      layout.map(({ kind, position, turn }) => {
        const group = buildPiece(kind, material);
        group.position.set(...position);
        group.rotation.y = turn;
        group.scale.setScalar(0.62);
        return group;
      }),
    [material],
  );
  return (
    <group>
      {groups.map((group, index) => (
        <primitive key={index} object={group} />
      ))}
    </group>
  );
}

/** Tabuleiro que se perde na névoa: só as casas mais próximas aparecem. */
function Board() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d")!;
    for (let x = 0; x < 8; x += 1) {
      for (let y = 0; y < 8; y += 1) {
        context.fillStyle = (x + y) % 2 ? "#0a0909" : "#151311";
        context.fillRect(x * 64, y * 64, 64, 64);
      }
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 2);
    map.anisotropy = 8;
    return map;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.8, 0, -1]} receiveShadow>
      <planeGeometry args={[18, 18]} />
      <meshStandardMaterial map={texture} roughness={0.8} metalness={0} />
    </mesh>
  );
}

function Rig({ finePointer }: { finePointer: boolean }) {
  const pointer = useRef({ x: 0, y: 0 });
  const target = useMemo(() => new THREE.Vector3(1.1, 1.35, 0), []);

  useEffect(() => {
    if (!finePointer) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [finePointer]);

  // A câmera vem do estado do frame (objeto do three.js, mutável por natureza).
  useFrame(({ camera, size }, delta) => {
    const narrow = size.width < 768;
    // Amortecimento exponencial: o paralaxe chega com inércia, não colado ao mouse.
    const k = 1 - Math.exp(-delta * 2.2);
    const baseX = narrow ? 1.0 : -1.6;
    const baseZ = narrow ? 16 : 12.5;
    camera.position.x += (baseX + pointer.current.x * 0.8 - camera.position.x) * k;
    camera.position.y += (2.7 - pointer.current.y * 0.35 - camera.position.y) * k;
    camera.position.z += (baseZ - camera.position.z) * k;
    camera.lookAt(narrow ? target.set(0.9, 0.2, 0) : target.set(-2.2, 2.05, 0));
  });

  return null;
}

export default function HeroScene() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [finePointer] = useState(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  const [reduced] = useState(() => siteReducedMotion());

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [-1.6, 2.7, 12.5], fov: 30 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      >
        <color attach="background" args={["#0b0b0b"]} />
        <fog attach="fog" args={["#0b0b0b", 11, 22]} />

        <ambientLight intensity={0.08} />
        {/* Contraluz laranja: desenha o contorno das peças */}
        <spotLight position={[5, 6, -5]} angle={0.55} penumbra={1} intensity={150} color="#f35703" castShadow />
        <pointLight position={[-4, 2.5, -3]} intensity={30} color="#ff7a2e" />
        {/* Luz de preenchimento fria e baixa, vinda da frente */}
        <directionalLight position={[-3, 4, 6]} intensity={0.35} color="#fff4ea" />

        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} color="#f35703" position={[5, 2, -3]} scale={[2, 6, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#ffffff" position={[-5, 3, 2]} scale={[3, 5, 1]} />
          <Lightformer form="ring" intensity={1.2} color="#ff8a3d" position={[0, 6, -6]} scale={3} />
        </Environment>

        <Pieces />
        <Board />
        <ContactShadows position={[0.8, 0.001, -0.2]} opacity={0.75} scale={12} blur={2.4} far={3} color="#000000" />

        <Rig finePointer={finePointer && !reduced} />
      </Canvas>
    </div>
  );
}
