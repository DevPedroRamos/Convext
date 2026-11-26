import type { PieceKind } from "@/lib/saga-content";

/**
 * Desenho das peças (estilo Staunton), traçado a partir das referências em
 * docs/proposals/lp-saga/pecas. Uma única fonte alimenta o 3D (torneado no
 * three.js) e os ícones 2D (silhueta SVG), para as duas versões baterem.
 *
 * Unidade: raio da base = 1. Perfis são pares [raio, altura] de baixo para cima.
 */

export type Profile = [number, number][];
type Point = [number, number];

const base: Profile = [
  [0, 0], [1.0, 0], [1.03, 0.06], [1.03, 0.2], [0.97, 0.26], [0.92, 0.3],
];

export const profiles: Record<Exclude<PieceKind, "knight">, Profile> = {
  king: [
    ...base, [0.93, 0.4], [0.9, 0.62], [0.8, 0.85], [0.64, 1.05], [0.56, 1.18], [0.6, 1.24], [0.58, 1.32], [0.42, 1.38],
    [0.37, 1.6], [0.32, 2.2], [0.3, 2.6], [0.36, 2.72], [0.52, 2.82], [0.62, 2.9], [0.62, 3.0], [0.52, 3.06], [0.58, 3.12],
    [0.55, 3.2], [0.44, 3.26], [0.46, 3.45], [0.56, 3.85], [0.62, 4.12], [0.6, 4.2], [0.45, 4.3], [0.22, 4.36], [0.12, 4.4],
    [0.14, 4.48], [0.08, 4.52], [0, 4.53],
  ],
  queen: [
    [0, 0], [1.05, 0], [1.08, 0.08], [1.06, 0.25], [0.98, 0.32], [1.0, 0.42], [0.98, 0.62], [0.86, 0.88], [0.66, 1.08],
    [0.58, 1.18], [0.64, 1.26], [0.6, 1.34], [0.44, 1.4], [0.38, 1.7], [0.32, 2.3], [0.3, 2.75], [0.36, 2.86], [0.6, 2.98],
    [0.66, 3.06], [0.6, 3.16], [0.44, 3.2], [0.42, 3.28], [0.38, 3.36], [0.42, 3.5], [0.55, 3.8], [0.66, 4.0], [0.68, 4.06],
    [0.6, 4.05], [0.5, 4.02], [0.36, 4.12], [0.2, 4.22], [0.08, 4.24], [0.08, 4.3], [0, 4.31],
  ],
  rook: [
    ...base, [0.98, 0.36], [1.0, 0.55], [0.94, 0.78], [0.86, 0.92], [0.9, 1.0], [0.86, 1.1], [0.7, 1.2], [0.6, 1.32],
    [0.56, 1.6], [0.52, 2.2], [0.53, 2.5], [0.6, 2.7], [0.72, 2.86], [0.78, 2.92], [0.78, 2.98], [0.74, 3.0], [0.76, 3.06],
    [0.76, 3.3], [0.58, 3.3], [0.58, 3.2], [0, 3.2],
  ],
  pawn: [
    ...base, [0.95, 0.38], [0.92, 0.56], [0.78, 0.78], [0.6, 0.92], [0.62, 0.98], [0.5, 1.06], [0.4, 1.3], [0.33, 1.7],
    [0.32, 1.86], [0.62, 1.92], [0.66, 1.98], [0.6, 2.04], [0.3, 2.08], [0.26, 2.14], [0, 2.14],
  ],
  bishop: [
    ...base, [0.95, 0.38], [0.93, 0.58], [0.8, 0.82], [0.6, 0.98], [0.62, 1.04], [0.5, 1.12], [0.4, 1.4], [0.33, 2.0],
    [0.32, 2.3], [0.4, 2.38], [0.62, 2.46], [0.66, 2.54], [0.58, 2.62], [0.5, 2.66], [0.52, 2.72], [0.42, 2.78], [0.36, 2.84],
    [0.44, 2.95], [0.5, 3.2], [0.48, 3.45], [0.38, 3.75], [0.22, 4.0], [0.1, 4.12], [0.06, 4.18], [0, 4.2],
  ],
};

/** Base em degraus do cavalo (como na referência), sobre a qual vai a cabeça. */
export const knightBase: Profile = [
  [0, 0], [1.0, 0], [1.02, 0.06], [1.02, 0.42], [0.96, 0.48], [0.84, 0.5], [0.82, 0.58], [0.72, 0.62], [0.7, 0.7],
  [0.62, 0.74], [0, 0.74],
];

/** Cabeça do cavalo de perfil (virada para a direita), em sentido horário. */
export const knightHead: Point[] = [
  [-0.6, 0.72], [-0.68, 1.4], [-0.62, 2.0], [-0.48, 2.6], [-0.28, 3.1], [-0.12, 3.48], [0.0, 3.92], [0.12, 4.06],
  [0.2, 3.78], [0.46, 3.56], [0.78, 3.22], [1.04, 2.86], [1.12, 2.62], [1.02, 2.46], [0.8, 2.42], [0.54, 2.38],
  [0.36, 2.2], [0.4, 1.8], [0.52, 1.3], [0.6, 0.72],
];

/** Alturas totais (topo do ornamento), usadas para enquadrar. */
export const heights: Record<PieceKind, number> = { king: 5.35, queen: 4.6, rook: 3.62, pawn: 3.12, bishop: 4.47, knight: 4.06 };

/** Catmull-Rom: amostra uma curva suave que passa pelos pontos. */
export function sampleCurve(points: Point[], perSegment = 8, closed = false): Point[] {
  const out: Point[] = [];
  const n = points.length;
  const get = (i: number) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i += 1) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
    for (let s = 0; s < perSegment; s += 1) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map(
        (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3),
      ) as Point);
    }
  }
  if (!closed) out.push(points[n - 1]);
  return out;
}

const f = (value: number) => Number(value.toFixed(3));

/** Silhueta 2D de um perfil torneado: espelha o perfil em torno do eixo. */
function latheSilhouette(profile: Profile) {
  const right = sampleCurve(profile, 6);
  const left = [...right].reverse().map(([r, y]) => [-r, y] as Point);
  const points = [...right, ...left];
  return `M${points.map(([x, y]) => `${f(x)} ${f(-y)}`).join("L")}Z`;
}

function polygon(points: Point[]) {
  return `M${points.map(([x, y]) => `${f(x)} ${f(-y)}`).join("L")}Z`;
}

function circle(cx: number, cy: number, r: number) {
  return `M${f(cx - r)} ${f(-cy)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0Z`;
}

/** Partes do SVG de cada peça (desenhadas como <path> separados, sem buracos de winding) (viewBox comum: -1.2 -5.5 2.4 5.6). */
export const piecePaths: Record<PieceKind, string[]> = {
  king: [
    latheSilhouette(profiles.king),
    polygon([[-0.1, 4.48], [0.1, 4.48], [0.1, 4.82], [0.3, 4.82], [0.3, 5.02], [0.1, 5.02], [0.1, 5.32], [-0.1, 5.32], [-0.1, 5.02], [-0.3, 5.02], [-0.3, 4.82], [-0.1, 4.82]]),
  ],
  queen: [
    latheSilhouette(profiles.queen),
    ...[-0.62, -0.31, 0, 0.31, 0.62].map((x) => polygon([[x - 0.09, 4.02], [x + 0.09, 4.02], [x, 4.2]])),
    circle(0, 4.45, 0.15),
  ],
  rook: [
    latheSilhouette(profiles.rook),
    ...[[-0.76, -0.42], [-0.2, 0.2], [0.42, 0.76]].map(([a, b]) => polygon([[a, 3.28], [b, 3.28], [b, 3.62], [a, 3.62]])),
  ],
  pawn: [latheSilhouette(profiles.pawn), circle(0, 2.6, 0.52)],
  bishop: [latheSilhouette(profiles.bishop), circle(0, 4.33, 0.14)],
  knight: [latheSilhouette(knightBase), polygon(sampleCurve(knightHead, 6, true))],
};
