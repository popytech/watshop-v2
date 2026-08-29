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
      {/* Barres centrées, comme le texte de la carte. */}
      <div className="flex flex-col items-center space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}
