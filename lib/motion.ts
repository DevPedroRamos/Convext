/**
 * Tokens de motion da Convext para o GSAP.
 * Espelham as variáveis CSS em app/globals.css (--ease-out-expo, --dur-*).
 */
export const ease = {
  /** cubic-bezier(0.16, 1, 0.3, 1) — entrada padrão de tudo que aparece. */
  out: "expo.out",
  /** cubic-bezier(0.65, 0, 0.35, 1) — trocas e cortinas (sai e entra). */
  inOut: "power4.inOut",
  /** Para scrubs ligados ao scroll, onde a curva vem do próprio scroll. */
  none: "none",
} as const;

export const duration = {
  fast: 0.16,
  base: 0.28,
  slow: 0.6,
  reveal: 1,
} as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Mouse/trackpad real: habilita cursor, magnético e spotlight. */
export function hasFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
