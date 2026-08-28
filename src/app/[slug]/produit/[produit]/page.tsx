import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { SharePanel } from "@/components/shop/share-panel";
import { VisitTracker } from "@/components/storefront/visit-tracker";
import { effectivePrice, getPublicProduct, getPublicShop, sortedImages } from "@/lib/shop/public";
import { getSiteUrl } from "@/lib/site-url";
import { formatMoney } from "@/lib/format";
import { shopPath } from "@/lib/tenant";

type Props = { params: Promise<{ slug: string; produit: string }> };

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

export default async function ProductPage({ params }: Props) {
  const { slug, produit } = await params;
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

      <div className="flex flex-col gap-5">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href={shopPath(shop.slug)}>
            <ArrowLeft />
            Tous les produits
          </Link>
        </Button>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted">
              {images[0] ? (
                <Image
                  src={images[0].url}
                  alt={images[0].alt_text || product.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <ImageOff className="size-6 text-muted-foreground" />
              )}
            </span>

            {images.length > 1 ? (
              <ul className="flex gap-2 overflow-x-auto pb-1">
                {images.slice(1).map((image) => (
                  <li
                    key={image.url}
                    className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt_text || product.name}
                      width={80}
                      height={80}
                      className="size-full object-cover"
                    />
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
