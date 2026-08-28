import Image from "next/image";
import Link from "next/link";
import { ImageOff, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import type { ProductWithImage } from "@/lib/shop/queries";

/**
 * Une ligne de produit, réutilisée dans l'onboarding et dans la liste du
 * tableau de bord. `href` absent = simple affichage, sans lien d'édition.
 */
export function ProductListItem({
  product,
  currency,
  href,
}: {
  product: ProductWithImage;
  currency: string;
  href?: string;
}) {
  const images = [...(product.product_images ?? [])];
  const cover = images[0];
  const enPromo = product.promo_price !== null && product.promo_price < product.price;

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt_text || product.name}
            width={56}
            height={56}
            className="size-full object-cover"
          />
        ) : (
          <ImageOff className="size-4 text-muted-foreground" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {enPromo ? (
            <>
              <span className="font-medium text-foreground">
                {formatMoney(product.promo_price!, currency)}
              </span>{" "}
              <span className="line-through">{formatMoney(product.price, currency)}</span>
            </>
          ) : (
            formatMoney(product.price, currency)
          )}
          <span className="mx-1.5">·</span>
          {product.quantity > 0 ? `${product.quantity} en stock` : "rupture"}
        </p>
      </div>

      {product.is_active ? null : (
        <Badge variant="secondary" className="hidden sm:inline-flex">
          Masqué
        </Badge>
      )}

      {href ? (
        <Button asChild variant="ghost" size="icon" aria-label={`Modifier ${product.name}`}>
          <Link href={href}>
            <Pencil />
          </Link>
        </Button>
      ) : null}
    </li>
  );
}
