import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FilterControls } from "@/components/marketplace/filters";
import { FiltersMobile } from "@/components/marketplace/filters-mobile";
import { ListingPagination } from "@/components/marketplace/listing-pagination";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";
import { ProductGridSkeleton } from "@/components/marketplace/product-grid-skeleton";
import { SortLinks } from "@/components/marketplace/sort";
import { formatNumber } from "@/lib/format";
import { countProducts, listProducts } from "@/lib/marketplace/queries";
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
 * La liste est isolée dans son propre composant pour être suspendue : la
 * colonne de filtres et la barre de tri ne dépendent pas de la base et
 * s'affichent tout de suite, la grille arrive derrière avec son squelette.
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
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground tabular-nums">
        {formatNumber(total)} produit{total > 1 ? "s" : ""}
        {filtre ? " correspondent à votre recherche" : " en ligne"}
      </p>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 xl:grid-cols-4">
        {items.map((product, index) => (
          <MarketplaceProductCard key={product.id} product={product} priority={index === 0} />
        ))}
      </ul>

      <ListingPagination params={params} total={total} chemin={CHEMIN} />
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

  // Validé avant le rendu, pas dans la liste suspendue : une fois le flux
  // ouvert, le code HTTP est parti, et un notFound() plus tard afficherait la
  // page 404 sous un statut 200. Un compte seul, et seulement au-delà de la
  // première page — donc rien de plus sur le chemin courant.
  if (params.page > 1 && params.page > nombreDePages(await countProducts(params))) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tous les produits</h1>
        <p className="text-muted-foreground">
          Le catalogue de toutes les boutiques. La commande se passe chez le vendeur, sur son
          WhatsApp.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        {/* Colonne de filtres, à partir de lg seulement. */}
        <aside className="hidden lg:block">
          <FilterControls params={params} chemin={CHEMIN} />
        </aside>

        <div>
          <div className="mb-8 flex items-center justify-between gap-3">
            <FiltersMobile actifs={actifs}>
              <FilterControls params={params} chemin={CHEMIN} />
            </FiltersMobile>

            <SortLinks params={params} chemin={CHEMIN} />
          </div>

          <Suspense key={JSON.stringify(params)} fallback={<ProductGridSkeleton />}>
            <ListeProduits params={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
