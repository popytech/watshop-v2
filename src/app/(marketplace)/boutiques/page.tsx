import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FilterControls } from "@/components/marketplace/filters";
import { FiltersMobile } from "@/components/marketplace/filters-mobile";
import { ListingPagination } from "@/components/marketplace/listing-pagination";
import { ShopCard } from "@/components/marketplace/shop-card";
import { ShopGridSkeleton } from "@/components/marketplace/shop-grid-skeleton";
import { formatNumber } from "@/lib/format";
import { countShops, listShops } from "@/lib/marketplace/queries";
import { nombreDePages, parseParams, type MarketplaceParams } from "@/lib/marketplace/params";

const CHEMIN = "/boutiques";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { page } = parseParams(await searchParams);

  // Canonique sans les filtres : leurs combinaisons donnent des dizaines
  // d'adresses pour le même annuaire. La pagination reste, ses pages ayant bien
  // un contenu différent.
  const canonical = page > 1 ? `${CHEMIN}?page=${page}` : CHEMIN;
  const title = page > 1 ? `Toutes les boutiques — page ${page}` : "Toutes les boutiques — Watshop";

  return {
    title,
    description:
      "Découvrez les boutiques des commerçants d'Afrique de l'Ouest : mode, beauté, alimentation, électronique. Commandez directement sur WhatsApp.",
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description: "Les commerçants qui vendent sur Watshop, par catégorie et par pays.",
      url: canonical,
    },
  };
}

async function ListeBoutiques({ params }: { params: MarketplaceParams }) {
  const { items, total } = await listShops(params);
  const filtre = Boolean(params.q || params.categorie || params.pays);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-24 text-center">
        <p className="font-medium">Aucune boutique trouvée</p>
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
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </ul>

      <div className="flex flex-col items-center gap-3">
        <ListingPagination params={params} total={total} chemin={CHEMIN} />
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatNumber(total)} boutique{total > 1 ? "s" : ""}
          {filtre ? " correspondent à votre recherche" : " en ligne"}
        </p>
      </div>
    </div>
  );
}

export default async function BoutiquesPage({
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
  if (params.page > 1 && params.page > nombreDePages(await countShops(params))) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Toutes les boutiques</h1>
        <p className="text-muted-foreground">
          Les commerçants qui vendent sur Watshop. Chaque boutique a sa propre adresse et son
          propre WhatsApp.
        </p>
      </div>

      {/* Pas de sélecteur de tri ici : une boutique n'a pas de prix, et l'ordre
          alphabétique n'apprendrait rien à personne. */}
      <div className="mb-8">
        <FiltersMobile actifs={actifs}>
          <FilterControls params={params} chemin={CHEMIN} />
        </FiltersMobile>
      </div>

      <Suspense key={JSON.stringify(params)} fallback={<ShopGridSkeleton />}>
        <ListeBoutiques params={params} />
      </Suspense>
    </div>
  );
}
