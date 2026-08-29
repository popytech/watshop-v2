import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { nombreDePages, toQueryString, type MarketplaceParams } from "@/lib/marketplace/params";

/**
 * Pagination par liens, pas par bouton « charger plus ».
 *
 * Chaque page a ainsi sa propre adresse : elle se partage, se met en favori, et
 * le retour arrière ramène là où on était. Un bouton qui empile les résultats
 * perd tout cela, et redemande la première page à chaque retour.
 */
export function Pagination({
  params,
  total,
  chemin,
}: {
  params: MarketplaceParams;
  total: number;
  chemin: string;
}) {
  const pages = nombreDePages(total);
  if (pages <= 1) return null;

  const precedente = params.page > 1 ? params.page - 1 : null;
  const suivante = params.page < pages ? params.page + 1 : null;

  return (
    <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
      <Button asChild variant="outline" size="sm" disabled={!precedente}>
        {precedente ? (
          <Link href={`${chemin}${toQueryString({ ...params, page: precedente })}`} rel="prev">
            <ChevronLeft />
            Précédent
          </Link>
        ) : (
          <span aria-disabled="true">
            <ChevronLeft />
            Précédent
          </span>
        )}
      </Button>

      <span className="text-sm text-muted-foreground tabular-nums">
        Page {params.page} sur {pages}
      </span>

      <Button asChild variant="outline" size="sm" disabled={!suivante}>
        {suivante ? (
          <Link href={`${chemin}${toQueryString({ ...params, page: suivante })}`} rel="next">
            Suivant
            <ChevronRight />
          </Link>
        ) : (
          <span aria-disabled="true">
            Suivant
            <ChevronRight />
          </span>
        )}
      </Button>
    </nav>
  );
}
