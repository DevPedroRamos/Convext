import * as THREE from "three";
import { knightBase, knightHead, profiles, sampleCurve, type Profile } from "@/lib/chess-pieces";
import type { PieceKind } from "@/lib/saga-content";

/**
 * Monta as peças em 3D a partir dos mesmos perfis dos ícones 2D.
 * Base de raio 1 apoiada em y = 0. Geometrias ficam em cache por tipo.
 */

/** Preto acetinado como nas referências, com verniz leve para o contraluz laranja desenhar o contorno. */
export function createPieceMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#121110",
    roughness: 0.38,
    metalness: 0.02,
    clearcoat: 0.6,
    clearcoatRoughness: 0.28,
  });
}

function lathe(profile: Profile, segments = 96) {
  const points = sampleCurve(profile, 10).map(([r, y]) => new THREE.Vector2(Math.max(r, 0), y));
  const geometry = new THREE.LatheGeometry(points, segments);
  geometry.computeVertexNormals();
  return geometry;
}

function annularSector(outer: number, inner: number, start: number, length: number, height: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, start, start + length, false);
  shape.absarc(0, 0, inner, start + length, start, true);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 24 });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

const cache = new Map<PieceKind, { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 }[]>();

function parts(kind: PieceKind) {
  const cached = cache.get(kind);
  if (cached) return cached;
  const at = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) =>
    new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1));
  const list: { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 }[] = [];

  switch (kind) {
    case "king": {
      list.push({ geometry: lathe(profiles.king), matrix: at() });
      // Cruz pátea do topo
      list.push({ geometry: new THREE.BoxGeometry(0.2, 0.84, 0.16), matrix: at(0, 4.9) });
      list.push({ geometry: new THREE.BoxGeometry(0.62, 0.2, 0.16), matrix: at(0, 4.92) });
      break;
    }
    case "queen": {
      list.push({ geometry: lathe(profiles.queen), matrix: at() });
      for (let index = 0; index < 12; index += 1) {
        const angle = (index / 12) * Math.PI * 2;
        list.push({ geometry: new THREE.ConeGeometry(0.075, 0.2, 12), matrix: at(Math.cos(angle) * 0.63, 4.14, Math.sin(angle) * 0.63) });
      }
      list.push({ geometry: new THREE.SphereGeometry(0.15, 32, 24), matrix: at(0, 4.45) });
      break;
    }
    case "rook": {
      list.push({ geometry: lathe(profiles.rook), matrix: at() });
      // Ameias: quatro setores do anel, com vãos entre eles
      const gap = 0.32;
      for (let index = 0; index < 4; index += 1) {
        const start = (index / 4) * Math.PI * 2 + gap / 2;
        list.push({ geometry: annularSector(0.76, 0.58, start, Math.PI / 2 - gap, 0.3), matrix: at(0, 3.3) });
      }
      break;
    }
    case "pawn": {
      list.push({ geometry: lathe(profiles.pawn), matrix: at() });
      list.push({ geometry: new THREE.SphereGeometry(0.52, 48, 32), matrix: at(0, 2.6) });
      break;
    }
    case "bishop": {
      list.push({ geometry: lathe(profiles.bishop), matrix: at() });
      list.push({ geometry: new THREE.SphereGeometry(0.14, 24, 16), matrix: at(0, 4.33) });
      break;
    }
    case "knight": {
      list.push({ geometry: lathe(knightBase), matrix: at() });
      const shape = new THREE.Shape(sampleCurve(knightHead, 10, true).map(([x, y]) => new THREE.Vector2(x, y)));
      const depth = 0.86;
      const head = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.1, bevelSegments: 8, curveSegments: 16 });
      head.translate(-0.15, 0, -depth / 2);
      // Esculpe o volume: grosso na nuca, afinando até o focinho e as orelhas.
      const position = head.attributes.position;
      for (let index = 0; index < position.count; index += 1) {
        const x = position.getX(index);
        const y = position.getY(index);
        const toMuzzle = THREE.MathUtils.smoothstep(x, -0.4, 1.0);
        const toEars = THREE.MathUtils.smoothstep(y, 3.2, 4.0);
        const toBase = 1 - THREE.MathUtils.smoothstep(y, 0.7, 1.4);
        const thickness = THREE.MathUtils.lerp(1.05, 0.5, toMuzzle) * THREE.MathUtils.lerp(1, 0.55, toEars) * THREE.MathUtils.lerp(1, 1.15, toBase);
        position.setZ(index, position.getZ(index) * thickness);
      }
      head.computeVertexNormals();
      list.push({ geometry: head, matrix: at() });
      break;
    }
  }
  cache.set(kind, list);
  return list;
}

export function buildPiece(kind: PieceKind, material: THREE.Material) {
  const group = new THREE.Group();
  parts(kind).forEach(({ geometry, matrix }) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.applyMatrix4(matrix);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
  return group;
}
