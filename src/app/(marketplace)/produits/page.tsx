import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryTiles, CategoryTilesSkeleton } from "@/components/marketplace/category-tiles";
import { FilterControls } from "@/components/marketplace/filters";
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero";
import { FiltersMobile } from "@/components/marketplace/filters-mobile";
import { ListingPagination } from "@/components/marketplace/listing-pagination";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";
import { ProductGridSkeleton } from "@/components/marketplace/product-grid-skeleton";
import { SortSelect } from "@/components/marketplace/sort";
import { formatNumber } from "@/lib/format";
import { countProducts, getMarketplaceCounts, listProducts } from "@/lib/marketplace/queries";
import { nombreDePages, parseParams, type MarketplaceParams } from "@/lib/marketplace/params";

const CHEMIN = "/produits";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { page } = parseParams(await searchParams);

  // Canonique sans les filtres : les combinaisons de catégorie et de pays
  // donnent des dizaines d'adresses pour le même catalogue, et rien ne sert de
  // les faire indexer séparément. La pagination, elle, est conservée : ses
  // pages ont bien un contenu différent.
  const canonical = page > 1 ? `${CHEMIN}?page=${page}` : CHEMIN;
  const title = page > 1 ? `Tous les produits — page ${page}` : "Tous les produits — Watshop";

  return {
    title,
    description:
      "Le catalogue des boutiques Watshop : mode, beauté, alimentation, électronique. Commandez au vendeur directement sur WhatsApp.",
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description: "Le catalogue de toutes les boutiques Watshop, en un seul endroit.",
      url: canonical,
    },
  };
}

/**
 * La liste est isolée pour être suspendue : l'en-tête et la barre d'outils ne
 * dépendent pas de la base et s'affichent tout de suite, la grille arrive
 * derrière avec son squelette.
 */
async function ListeProduits({ params }: { params: MarketplaceParams }) {
  const { items, total } = await listProducts(params);
  const filtre = Boolean(params.q || params.categorie || params.pays);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-24 text-center">
        <p className="font-medium">Aucun produit trouvé</p>
        <p className="pt-1 text-sm text-muted-foreground">
          {filtre
            ? "Essayez avec moins de filtres, ou un autre mot-clé."
            : "Les premières boutiques arrivent. Revenez bientôt."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Grille pleine largeur, trois colonnes : les visuels sont ce qui fait
          vendre, ils ont besoin de place. */}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product, index) => (
          <MarketplaceProductCard key={product.id} product={product} priority={index === 0} />
        ))}
      </ul>

      <div className="flex flex-col items-center gap-3">
        <ListingPagination params={params} total={total} chemin={CHEMIN} />
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatNumber(total)} produit{total > 1 ? "s" : ""}
          {filtre ? " correspondent à votre recherche" : " en ligne"}
        </p>
      </div>
    </div>
  );
}

export default async function ProduitsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = parseParams(await searchParams);
  const actifs = [params.q, params.categorie, params.pays].filter(Boolean).length;
  const sansFiltre = actifs === 0 && params.page === 1;

  // Validé avant le rendu, pas dans la liste suspendue : une fois le flux
  // ouvert, le code HTTP est parti, et un notFound() plus tard afficherait la
  // page 404 sous un statut 200. Un compte seul, et seulement au-delà de la
  // première page — donc rien de plus sur le chemin courant.
  if (params.page > 1 && params.page > nombreDePages(await countProducts(params))) notFound();

  const comptes = await getMarketplaceCounts();

  return (
    <>
      <MarketplaceHero produits={comptes.produits} boutiques={comptes.boutiques} />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Barre d'outils : filtres à gauche, tri à droite. Pas de colonne
            latérale — elle prenait un quart de la largeur pour deux filtres, au
            détriment des visuels. */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <FiltersMobile actifs={actifs}>
            <FilterControls params={params} chemin={CHEMIN} />
          </FiltersMobile>

          <SortSelect params={params} chemin={CHEMIN} />
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<ProductGridSkeleton />}>
          <ListeProduits params={params} />
        </Suspense>

        {/* Sous la grille, et seulement sur la première page sans filtre : une
            fois qu'on a choisi une catégorie, la liste des catégories n'est plus
            qu'un encombrement. */}
        {sansFiltre ? (
          <div className="mt-16">
            <Suspense fallback={<CategoryTilesSkeleton />}>
              <CategoryTiles />
            </Suspense>
          </div>
        ) : null}
      </div>
    </>
  );
}
