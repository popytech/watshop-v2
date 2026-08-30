import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/storefront/product-card";
import { ShopHero } from "@/components/storefront/shop-hero";
import { SharePanel } from "@/components/shop/share-panel";
import { VisitTracker } from "@/components/storefront/visit-tracker";
import {
  getDeliveryZones,
  getPublicProducts,
  getPublicShop,
  sortedImages,
} from "@/lib/shop/public";
import { getSiteUrl } from "@/lib/site-url";
import { shopPath } from "@/lib/tenant";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicShop(slug);

  if (!shop) return { title: "Boutique introuvable — Watshop" };

  const description =
    shop.description ??
    `Découvrez les produits de ${shop.name} et commandez directement sur WhatsApp.`;

  return {
    title: `${shop.name} — Watshop`,
    description,
    alternates: { canonical: shopPath(shop.slug) },
    openGraph: {
      title: shop.name,
      description,
      type: "website",
      images: shop.logo_url ? [{ url: shop.logo_url }] : undefined,
    },
  };
}

export default async function ShopPage({ params }: Props) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);

  if (!shop) notFound();

  const [products, zones, siteUrl] = await Promise.all([
    getPublicProducts(shop.id),
    getDeliveryZones(shop.id),
    getSiteUrl(),
  ]);
  const shopUrl = `${siteUrl}${shopPath(shop.slug)}`;

  // Données structurées : c'est ce qui permet à la boutique d'apparaître
  // correctement dans une recherche Google ou un aperçu de lien.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: shop.name,
    description: shop.description ?? undefined,
    url: shopUrl,
    image: shop.logo_url ?? undefined,
    address: { "@type": "PostalAddress", addressCountry: shop.country_code },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VisitTracker shopId={shop.id} />

      <div className="flex flex-col gap-6">
        {/* Le bandeau porte le titre de la page : c'est lui qui dit au visiteur
            arrivé d'un lien WhatsApp chez qui il est tombé.

            Pas de bouton de contact — joindre le vendeur passe par une
            commande, sinon la vente se conclut hors de Watshop et personne n'en
            garde la trace. */}
        <ShopHero
          shop={shop}
          produits={products.length}
          zones={zones.length}
          photoDeSecours={sortedImages(products[0] ?? { product_images: [] })[0]?.url}
        />

        {products.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                shopSlug={shop.slug}
                currency={shop.currency_symbol}
              />
            ))}
          </ul>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground">
                Cette boutique n&apos;a pas encore de produit en ligne.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex flex-col gap-3 py-5">
            <p className="text-sm font-medium">Partager cette boutique</p>
            <SharePanel shopName={shop.name} url={shopUrl} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
