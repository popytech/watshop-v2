import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Package, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { productCount, type MarketplaceShop } from "@/lib/marketplace/queries";
import { shopPath } from "@/lib/tenant";

export function ShopCard({ shop }: { shop: MarketplaceShop }) {
  const produits = productCount(shop);

  return (
    <li>
      <Link
        href={shopPath(shop.slug)}
        className="group flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
      >
        <div className="flex items-start gap-3">
          <span
            className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted"
            /* La couleur du vendeur sert de fond quand il n'a pas de logo :
               deux boutiques sans logo restent distinguables. */
            style={shop.logo_url ? undefined : { backgroundColor: `${shop.primary_color}1a` }}
          >
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <Store className="size-5" style={{ color: shop.primary_color }} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="truncate">{shop.name}</span>
              {shop.is_verified ? (
                <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Boutique vérifiée" />
              ) : null}
            </p>
            {shop.category ? (
              <p className="truncate text-sm text-muted-foreground">{shop.category}</p>
            ) : null}
          </div>

          {shop.is_sponsored ? (
            <Badge variant="secondary" className="shrink-0">
              Mise en avant
            </Badge>
          ) : null}
        </div>

        {shop.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{shop.description}</p>
        ) : null}

        <p className="mt-auto flex items-center gap-1.5 pt-1 text-sm text-muted-foreground">
          <Package className="size-4" />
          {produits === 0
            ? "Aucun produit en ligne"
            : `${formatNumber(produits)} produit${produits > 1 ? "s" : ""}`}
        </p>
      </Link>
    </li>
  );
}
