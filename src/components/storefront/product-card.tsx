import Link from "next/link";
import { Images } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PhotoStrip } from "@/components/media/photo-strip";
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
  const photos = sortedImages(product);
  const prix = effectivePrice(product);
  const enPromo = prix < product.price;
  const rupture = product.quantity <= 0;

  return (
    <li>
      <Link
        href={`/${shopSlug}/produit/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
      >
        {/* Les photos se font glisser au doigt : le survol, qui les révélait
            ailleurs, n'existe pas sur un téléphone. */}
        <span className="relative block bg-muted">
          <PhotoStrip photos={photos} alt={product.name} sizes="(min-width: 768px) 25vw, 50vw" />

          {enPromo ? (
            <Badge className="absolute top-2 left-2">Promo</Badge>
          ) : null}
          {rupture ? (
            <Badge variant="secondary" className="absolute top-2 right-2">
              Rupture
            </Badge>
          ) : null}
          {photos.length > 1 ? (
            <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs backdrop-blur">
              <Images className="size-3" />
              <span className="tabular-nums">{photos.length}</span>
            </span>
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
