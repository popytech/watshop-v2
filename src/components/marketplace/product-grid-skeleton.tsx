import { cn } from "@/lib/utils";

/**
 * Squelette de la grille, porté de Your Next Store (MIT).
 *
 * Il reprend exactement les proportions de la carte — visuel carré, deux lignes
 * de texte — pour que la grille ne saute pas quand les vraies données arrivent.
 */
export function ProductCardSkeleton() {
  return (
    <div>
      <div className="mb-3 aspect-square animate-pulse rounded-2xl bg-secondary" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 xl:grid-cols-4", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}
