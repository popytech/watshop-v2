/**
 * Squelette de l'annuaire. Même principe que celui des produits, aux
 * proportions de la carte boutique : une vignette carrée à gauche, deux lignes
 * de texte à droite, une ligne de compte en bas.
 */
function ShopCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="size-12 shrink-0 animate-pulse rounded-lg bg-secondary" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/5 animate-pulse rounded bg-secondary" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
        </div>
      </div>
      <div className="h-3 w-4/5 animate-pulse rounded bg-secondary" />
      <div className="h-3 w-1/4 animate-pulse rounded bg-secondary" />
    </div>
  );
}

export function ShopGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ShopCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}
