import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/storefront/product-card";
import { SharePanel } from "@/components/shop/share-panel";
import { VisitTracker } from "@/components/storefront/visit-tracker";
import { getPublicProducts, getPublicShop } from "@/lib/shop/public";
import { getSiteUrl } from "@/lib/site-url";
import { shopPath } from "@/lib/tenant";
import { whatsappLink } from "@/lib/whatsapp";

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

  const [products, siteUrl] = await Promise.all([getPublicProducts(shop.id), getSiteUrl()]);
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
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{shop.name}</h1>
          {shop.description ? (
            <p className="text-sm text-muted-foreground">{shop.description}</p>
          ) : null}

          {shop.whatsapp_number ? (
            <Button asChild size="lg" className="h-11 sm:self-start">
              <a
                href={whatsappLink(
                  shop.whatsapp_number,
                  `Bonjour ${shop.name}, j'ai une question sur votre boutique.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle />
                Contacter la boutique
              </a>
            </Button>
          ) : null}
        </div>

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
