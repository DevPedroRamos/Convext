"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import { buildPiece, createPieceMaterial } from "@/components/saga/chess-3d";
import { heights } from "@/lib/chess-pieces";
import type { PieceKind } from "@/lib/saga-content";
import { hasFinePointer } from "@/lib/motion";

/**
 * Palco das cinco soluções: a peça escolhida emerge do pedestal (corte no
 * plano y = 0) girando meia volta, enquanto a anterior afunda. Em repouso gira
 * devagar e inclina com o ponteiro, sempre com amortecimento.
 */

const clip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const SPIN_IDLE = 0.22; // rad/s

/** Estado da cena fora do React: objetos do three.js são mutáveis por natureza. */
function createStage(kinds: PieceKind[]) {
  const material = createPieceMaterial();
  material.clippingPlanes = [clip];
  material.clipShadows = true;

  const root = new THREE.Group();
  const holder = new THREE.Group();
  root.add(holder);

  const groups = kinds.map((kind) => {
    const group = buildPiece(kind, material);
    const scale = gsap.utils.clamp(0.86, 1.18, 4.5 / heights[kind]);
    group.scale.setScalar(scale);
    group.userData.depth = heights[kind] * scale + 0.2;
    group.position.y = -group.userData.depth;
    group.visible = false;
    // O cavalo só se lê de perfil: balança em torno dele em vez de girar inteiro.
    group.userData.sway = kind === "knight";
    holder.add(group);
    return group;
  });

  // Pedestal: disco escuro com filete laranja aceso
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.85, 0.28, 96),
    new THREE.MeshPhysicalMaterial({ color: "#0d0c0b", roughness: 0.3, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.15 }),
  );
  pedestal.position.y = -0.14;
  pedestal.receiveShadow = true;
  const rim = new THREE.Mesh(new THREE.RingGeometry(1.66, 1.72, 128), new THREE.MeshBasicMaterial({ color: "#f35703", toneMapped: false }));
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.002;
  root.add(pedestal, rim);

  let current = -1;
  let swayTime = 0;

  return {
    root,
    show(index: number) {
      const incoming = groups[index];
      const outgoing = current >= 0 && current !== index ? groups[current] : null;
      current = index;
      if (!incoming) return;

      gsap.killTweensOf([incoming.position, incoming.rotation]);
      if (outgoing) {
        gsap.killTweensOf([outgoing.position, outgoing.rotation]);
        gsap.to(outgoing.position, {
          y: -outgoing.userData.depth,
          duration: 0.5,
          ease: "power3.inOut",
          onComplete: () => {
            outgoing.visible = false;
          },
        });
        gsap.to(outgoing.rotation, { y: outgoing.rotation.y - Math.PI * 0.5, duration: 0.5, ease: "power3.inOut" });
      }
      incoming.visible = true;
      const delay = outgoing ? 0.22 : 0.1;
      const settle = incoming.userData.sway ? 0 : incoming.rotation.y;
      swayTime = 0;
      gsap.fromTo(incoming.position, { y: -incoming.userData.depth }, { y: 0, duration: 0.9, delay, ease: "expo.out" });
      gsap.fromTo(incoming.rotation, { y: settle - Math.PI }, { y: settle, duration: 1.1, delay, ease: "expo.out" });
    },
    tick(delta: number, pointer: { x: number; y: number }) {
      const piece = groups[current];
      if (piece && !gsap.isTweening(piece.rotation)) {
        if (piece.userData.sway) {
          swayTime += delta;
          piece.rotation.y = Math.sin(swayTime * 0.55) * 0.6;
        } else {
          piece.rotation.y += delta * SPIN_IDLE;
        }
      }
      // Inclinação amortecida em direção ao ponteiro
      const k = 1 - Math.exp(-delta * 3);
      root.rotation.x += (pointer.y * 0.12 - root.rotation.x) * k;
      root.rotation.z += (-pointer.x * 0.08 - root.rotation.z) * k;
    },
    dispose() {
      gsap.killTweensOf(groups.flatMap((group) => [group.position, group.rotation]));
    },
  };
}

function Pieces({ kinds, active }: { kinds: PieceKind[]; active: number }) {
  const [stage] = useState(() => createStage(kinds));
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!hasFinePointer()) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => stage.show(active), [active, stage]);
  useEffect(() => () => stage.dispose(), [stage]);
  useFrame((_, delta) => stage.tick(delta, pointer.current));

  return <primitive object={stage.root} />;
}

export default function PieceStage({ kinds, active }: { kinds: PieceKind[]; active: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 3.2, 11], fov: 30 }}
        onCreated={({ gl, camera }) => {
          gl.localClippingEnabled = true;
          camera.lookAt(0, 2.15, 0);
        }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      >
        <ambientLight intensity={0.12} />
        <spotLight position={[4.5, 7, -4]} angle={0.5} penumbra={1} intensity={220} color="#f35703" castShadow />
        <spotLight position={[-5, 5, -3]} angle={0.6} penumbra={1} intensity={70} color="#ff8a3d" />
        <directionalLight position={[-3, 5, 7]} intensity={0.55} color="#fff3e8" />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.6} color="#f35703" position={[4, 3, -3]} scale={[2, 7, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[-4, 4, 3]} scale={[3, 6, 1]} />
          <Lightformer form="ring" intensity={1} color="#ff8a3d" position={[0, 7, -5]} scale={3} />
        </Environment>
        <Pieces kinds={kinds} active={active} />
      </Canvas>
    </div>
  );
}
