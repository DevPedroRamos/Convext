import { cn } from "@/lib/utils";

/**
 * Rótulo que rola no hover do link/botão pai: o texto sobe e uma cópia entra por baixo.
 * Estilos em app/globals.css (.roll-label).
 */
export function RollLabel({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cn("roll-label", className)}>
      <span data-text={children}>{children}</span>
    </span>
  );
}
