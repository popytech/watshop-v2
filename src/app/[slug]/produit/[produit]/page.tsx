import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PhotoStrip } from "@/components/media/photo-strip";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { SharePanel } from "@/components/shop/share-panel";
import { VisitTracker } from "@/components/storefront/visit-tracker";
import { AffiliateTracker } from "@/components/storefront/affiliate-tracker";
import { effectivePrice, getPublicProduct, getPublicShop, sortedImages } from "@/lib/shop/public";
import { getSiteUrl } from "@/lib/site-url";
import { formatMoney } from "@/lib/format";
import { shopPath } from "@/lib/tenant";

type Props = {
  params: Promise<{ slug: string; produit: string }>;
  searchParams: Promise<{ ref?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, produit } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) return { title: "Produit introuvable — Watshop" };

  const product = await getPublicProduct(shop.id, produit);
  if (!product) return { title: "Produit introuvable — Watshop" };

  const description =
    product.description ??
    `${product.name} — ${formatMoney(effectivePrice(product), shop.currency_symbol)} chez ${shop.name}.`;
  const cover = sortedImages(product)[0];

  return {
    title: `${product.name} — ${shop.name}`,
    description,
    alternates: { canonical: `${shopPath(shop.slug)}/produit/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: cover ? [{ url: cover.url }] : undefined,
    },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug, produit }, { ref }] = await Promise.all([params, searchParams]);
  const shop = await getPublicShop(slug);
  if (!shop) notFound();

  const [product, siteUrl] = await Promise.all([
    getPublicProduct(shop.id, produit),
    getSiteUrl(),
  ]);
  if (!product) notFound();

  const images = sortedImages(product);
  const prix = effectivePrice(product);
  const enPromo = prix < product.price;
  const productUrl = `${siteUrl}${shopPath(shop.slug)}/produit/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: images.map((image) => image.url),
    offers: {
      "@type": "Offer",
      url: productUrl,
      price: prix,
      priceCurrency: shop.currency_symbol,
      availability:
        product.quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: shop.name },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VisitTracker shopId={shop.id} productId={product.id} />
      {ref ? (
        <AffiliateTracker shopSlug={shop.slug} productId={product.id} code={ref} />
      ) : null}

      <div className="flex flex-col gap-5">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href={shopPath(shop.slug)}>
            <ArrowLeft />
            Tous les produits
          </Link>
        </Button>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Galerie.
              La grande image se fait glisser au doigt, et les vignettes sont de
              vrais liens vers l'ancre de chaque photo : cliquer l'une d'elles
              fait défiler la bande jusqu'à la bonne. Auparavant les vignettes
              n'étaient que décoratives — sur un téléphone, les photos 2 à 4
              n'étaient visibles qu'en 80 pixels, ce qui ne permet de juger de
              rien. Tout tient en HTML et en CSS, sans JavaScript. */}
          <div className="flex flex-col gap-2">
            <PhotoStrip
              photos={images}
              alt={product.name}
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
              ancre="photo"
              className="overflow-hidden rounded-xl bg-muted"
            />

            {images.length > 1 ? (
              <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <li key={image.url}>
                    <a
                      href={`#photo-${index}`}
                      className="block size-20 shrink-0 overflow-hidden rounded-lg bg-muted ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <Image
                        src={image.url}
                        alt={`${product.name} — photo ${index + 1}`}
                        width={80}
                        height={80}
                        className="size-full object-cover"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
              <p className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {formatMoney(prix, shop.currency_symbol)}
                </span>
                {enPromo ? (
                  <>
                    <span className="text-muted-foreground line-through">
                      {formatMoney(product.price, shop.currency_symbol)}
                    </span>
                    <Badge>Promo</Badge>
                  </>
                ) : null}
              </p>
              <p className="text-sm text-muted-foreground">
                {product.quantity > 0
                  ? `${product.quantity} disponible${product.quantity > 1 ? "s" : ""}`
                  : "Rupture de stock"}
              </p>
            </div>

            <AddToCart
              shopSlug={shop.slug}
              inStock={product.quantity > 0}
              sizes={product.sizes ?? []}
              item={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                unitPrice: prix,
                imageUrl: images[0]?.url ?? null,
              }}
            />

            {product.description ? (
              <div className="flex flex-col gap-1.5">
                <h2 className="font-medium">Description</h2>
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {product.description}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 py-5">
            <p className="text-sm font-medium">Partager ce produit</p>
            <SharePanel shopName={product.name} url={productUrl} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
