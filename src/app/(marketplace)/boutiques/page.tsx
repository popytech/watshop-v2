import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Filters } from "@/components/marketplace/filters";
import { Pagination } from "@/components/marketplace/pagination";
import { ShopCard } from "@/components/marketplace/shop-card";
import { AucunResultat, MarketplacePageHeader } from "@/components/marketplace/page-header";
import { formatNumber } from "@/lib/format";
import { listShops } from "@/lib/marketplace/queries";
import { parseParams } from "@/lib/marketplace/params";

export const metadata: Metadata = {
  title: "Toutes les boutiques — Watshop",
  description:
    "Découvrez les boutiques des commerçants de Guinée et d'Afrique de l'Ouest : mode, beauté, alimentation, électronique. Commandez directement sur WhatsApp.",
  openGraph: {
    title: "Toutes les boutiques — Watshop",
    description: "Les commerçants qui vendent sur Watshop, par catégorie et par pays.",
    type: "website",
  },
};

export default async function BoutiquesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseParams(await searchParams);
  const { items, total } = await listShops(params);

  // Une page au-delà des résultats n'existe pas : mieux vaut un 404 franc
  // qu'une liste vide qui laisserait croire que le filtre ne donne rien.
  if (items.length === 0 && params.page > 1) notFound();

  const filtre = Boolean(params.q || params.categorie || params.pays);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:py-12">
      <MarketplacePageHeader
        title="Toutes les boutiques"
        description="Les commerçants qui vendent sur Watshop. Chaque boutique a sa propre adresse et son propre WhatsApp."
      >
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatNumber(total)} boutique{total > 1 ? "s" : ""}
          {filtre ? " correspondent à votre recherche" : " en ligne"}
        </p>
      </MarketplacePageHeader>

      <Filters params={params} avecTri={false} />

      {items.length === 0 ? (
        <AucunResultat titre="Aucune boutique trouvée" filtre={filtre} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </ul>
      )}

      <Pagination params={params} total={total} chemin="/boutiques" />
    </div>
  );
}
