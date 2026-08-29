import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  nombreDePages,
  toQueryString,
  type MarketplaceParams,
} from "@/lib/marketplace/params";

/**
 * Pagination numérotée, portée de Your Next Store (MIT).
 *
 * Deux adaptations : les liens sont construits par notre `toQueryString`, qui
 * connaît déjà les filtres et omet les valeurs par défaut ; et les libellés sont
 * en français.
 *
 * Des liens plutôt qu'un bouton « charger plus » : chaque page a son adresse,
 * elle se partage, et le retour arrière ramène là où on était.
 */

/**
 * Première page, dernière page, et les voisines de la page courante — le reste
 * remplacé par un seul « … ». Sur 40 pages, cela fait sept boutons au lieu de
 * quarante, sans jamais perdre le moyen d'aller au début ou à la fin.
 */
function numerosDePage(pageCourante: number, total: number): (number | "ellipsis")[] {
  return Array.from({ length: total }, (_, i) => i + 1).reduce<(number | "ellipsis")[]>(
    (acc, page) => {
      if (page === 1 || page === total || (page >= pageCourante - 1 && page <= pageCourante + 1)) {
        acc.push(page);
        return acc;
      }
      if (acc[acc.length - 1] !== "ellipsis") acc.push("ellipsis");
      return acc;
    },
    [],
  );
}

export function ListingPagination({
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

  const lien = (page: number) => `${chemin}${toQueryString({ ...params, page })}`;

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        {params.page > 1 ? (
          <PaginationItem>
            <PaginationPrevious href={lien(params.page - 1)} text="Précédent" />
          </PaginationItem>
        ) : null}

        {numerosDePage(params.page, pages).map((page, index) =>
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink href={lien(page)} isActive={page === params.page}>
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        {params.page < pages ? (
          <PaginationItem>
            <PaginationNext href={lien(params.page + 1)} text="Suivant" />
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  );
}
