import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { effectivePrice, sortedImages, type PublicProduct } from "@/lib/shop/public";

export function ProductCard({
  product,
  shopSlug,
  currency,
}: {
  product: PublicProduct;
  shopSlug: string;
  currency: string;
}) {
  const cover = sortedImages(product)[0];
  const prix = effectivePrice(product);
  const enPromo = prix < product.price;
  const rupture = product.quantity <= 0;

  return (
    <li>
      <Link
        href={`/${shopSlug}/produit/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
      >
        <span className="relative flex aspect-square items-center justify-center bg-muted">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt_text || product.name}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <ImageOff className="size-5 text-muted-foreground" />
          )}

          {enPromo ? (
            <Badge className="absolute top-2 left-2">Promo</Badge>
          ) : null}
          {rupture ? (
            <Badge variant="secondary" className="absolute top-2 right-2">
              Rupture
            </Badge>
          ) : null}
        </span>

        <span className="flex flex-1 flex-col gap-0.5 p-3">
          <span className="line-clamp-2 text-sm font-medium">{product.name}</span>
          <span className="mt-auto pt-1 text-sm">
            <span className="font-semibold">{formatMoney(prix, currency)}</span>
            {enPromo ? (
              <span className="ml-1.5 text-muted-foreground line-through">
                {formatMoney(product.price, currency)}
              </span>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}
