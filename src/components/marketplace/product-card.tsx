import Image from "next/image";
import Link from "next/link";
import { ImageOff, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { effectivePrice } from "@/lib/shop/public";
import type { MarketplaceProduct } from "@/lib/marketplace/queries";

/**
 * Carte produit du marketplace.
 *
 * Proche de celle de la boutique, avec une différence qui justifie un composant
 * séparé : ici l'acheteur navigue entre des vendeurs, il doit voir chez qui il
 * achète avant de cliquer. Le lien mène à la fiche produit dans la boutique du
 * vendeur, pas à une fiche du marketplace : c'est là qu'est le panier.
 */
export function MarketplaceProductCard({ product }: { product: MarketplaceProduct }) {
  const cover = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position)[0];
  // Recalculé plutôt que lu dans `effective_price` : la colonne générée sert au
  // tri, qui se fait en SQL ; l'affichage passe par le même helper que la
  // boutique, donc une carte reste juste même sur une base où la migration 0010
  // n'est pas encore passée.
  const prix = effectivePrice(product);
  const enPromo = prix < product.price;
  const rupture = product.quantity <= 0;
  const devise = product.shops.currency_symbol;

  return (
    <li>
      <Link
        href={`/${product.shops.slug}/produit/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
      >
        <span className="relative flex aspect-square items-center justify-center bg-muted">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt_text || product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <ImageOff className="size-5 text-muted-foreground" />
          )}

          {enPromo ? <Badge className="absolute top-2 left-2">Promo</Badge> : null}
          {rupture ? (
            <Badge variant="secondary" className="absolute top-2 right-2">
              Rupture
            </Badge>
          ) : null}
        </span>

        <span className="flex flex-1 flex-col gap-1 p-3">
          <span className="line-clamp-2 text-sm font-medium">{product.name}</span>

          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Store className="size-3 shrink-0" />
            <span className="truncate">{product.shops.name}</span>
          </span>

          <span className="mt-auto pt-1 text-sm">
            <span className="font-semibold">{formatMoney(prix, devise)}</span>
            {enPromo ? (
              <span className="ml-1.5 text-muted-foreground line-through">
                {formatMoney(product.price, devise)}
              </span>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}
