import { Skeleton } from "@/components/ui/skeleton";

export function MarketingPageSkeleton() {
  return (
    <div className="container-convext grid gap-8 py-24" aria-busy="true" aria-live="polite">
      <Skeleton className="h-16 w-2/3 max-w-xl" />
      <Skeleton className="h-6 w-full max-w-2xl" />
      <Skeleton className="h-6 w-4/5 max-w-xl" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
