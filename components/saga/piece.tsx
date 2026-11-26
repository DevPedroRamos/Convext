import { piecePaths } from "@/lib/chess-pieces";
import type { PieceKind } from "@/lib/saga-content";
import { cn } from "@/lib/utils";

/**
 * Ícone 2D da peça: a silhueta do mesmo desenho que vira 3D no hero e no
 * palco das soluções (lib/chess-pieces). Preenchida com currentColor.
 */
export function Piece({ kind, className, title }: { kind: PieceKind; className?: string; title?: string }) {
  return (
    <svg
      viewBox="-1.2 -5.45 2.4 5.5"
      className={cn("block", className)}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {piecePaths[kind].map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
}
