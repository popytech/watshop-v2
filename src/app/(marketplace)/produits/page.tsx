import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Filters } from "@/components/marketplace/filters";
import { Pagination } from "@/components/marketplace/pagination";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";
import { AucunResultat, MarketplacePageHeader } from "@/components/marketplace/page-header";
import { formatNumber } from "@/lib/format";
import { listProducts } from "@/lib/marketplace/queries";
import { parseParams } from "@/lib/marketplace/params";

export const metadata: Metadata = {
  title: "Tous les produits — Watshop",
  description:
    "Le catalogue des boutiques Watshop : mode, beauté, alimentation, électronique. Commandez au vendeur directement sur WhatsApp.",
  openGraph: {
    title: "Tous les produits — Watshop",
    description: "Le catalogue de toutes les boutiques Watshop, en un seul endroit.",
    type: "website",
  },
};

export default async function ProduitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseParams(await searchParams);
  const { items, total } = await listProducts(params);

  // Une page au-delà des résultats n'existe pas : mieux vaut un 404 franc
  // qu'une liste vide qui laisserait croire que le filtre ne donne rien.
  if (items.length === 0 && params.page > 1) notFound();

  const filtre = Boolean(params.q || params.categorie || params.pays);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:py-12">
      <MarketplacePageHeader
        title="Tous les produits"
        description="Le catalogue de toutes les boutiques. La commande se passe chez le vendeur, sur son WhatsApp."
      >
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatNumber(total)} produit{total > 1 ? "s" : ""}
          {filtre ? " correspondent à votre recherche" : " en ligne"}
        </p>
      </MarketplacePageHeader>

      <Filters params={params} avecTri />

      {items.length === 0 ? (
        <AucunResultat titre="Aucun produit trouvé" filtre={filtre} />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} />
          ))}
        </ul>
      )}

      <Pagination params={params} total={total} chemin="/produits" />
    </div>
  );
}
