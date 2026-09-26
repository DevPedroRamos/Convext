import { cn } from "@/lib/utils";

export function Section({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section className={cn("relative py-20 sm:py-28 lg:py-36", className)} {...props}>
      {children}
    </section>
  );
}
