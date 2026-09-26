import { cn } from "@/lib/utils";

export function Container({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("container-convext", className)}>{children}</div>;
}
