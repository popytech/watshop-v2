import Link from "next/link";
import { Images, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PhotoStrip } from "@/components/media/photo-strip";
import { formatMoney } from "@/lib/format";
import { effectivePrice } from "@/lib/shop/public";
import type { MarketplaceProduct } from "@/lib/marketplace/queries";

const TAILLES_IMAGE = "(min-width: 1024px) 33vw, 50vw";

/**
 * Carte produit du marketplace, dans la composition de Your Next Store (MIT) :
 * visuel carré aux coins arrondis, texte centré dessous, sans encadrement. Une
 * grille de vitrine, pas une grille de tableau de bord.
 *
 * Le nom de la boutique y figure parce qu'ici l'acheteur navigue entre des
 * vendeurs et doit savoir chez qui il achète avant de cliquer. Le lien mène à la
 * fiche produit dans la boutique du vendeur, pas à une fiche du marketplace :
 * c'est là qu'est le panier.
 *
 * Les photos se font glisser au doigt plutôt que d'apparaître au survol. Le
 * survol n'existe pas sur un téléphone, et c'est là que sont nos acheteurs.
 */
export function MarketplaceProductCard({
  product,
  priority = false,
}: {
  product: MarketplaceProduct;
  /** Vrai pour la première carte : son image est le plus grand élément visible. */
  priority?: boolean;
}) {
  const photos = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);

  // Recalculé plutôt que lu dans `effective_price` : la colonne générée sert au
  // tri, qui se fait en SQL ; l'affichage passe par le même helper que la
  // boutique, donc la carte reste juste même si la migration n'est pas passée.
  const prix = effectivePrice(product);
  const enPromo = prix < product.price;
  const rupture = product.quantity <= 0;
  const devise = product.shops.currency_symbol;

  return (
    <li>
      <Link href={`/${product.shops.slug}/produit/${product.slug}`} className="group block">
        <div className="relative mb-3 overflow-hidden rounded-2xl bg-secondary">
          <PhotoStrip
            photos={photos}
            alt={product.name}
            sizes={TAILLES_IMAGE}
            priority={priority}
          />

          {enPromo ? <Badge className="absolute top-2 left-2">Promo</Badge> : null}
          {rupture ? (
            <Badge variant="secondary" className="absolute top-2 right-2">
              Rupture
            </Badge>
          ) : null}

          {/* Un compte, pas un indicateur de position : il reste juste où qu'on
              en soit dans la bande, là où des points exigeraient de suivre le
              défilement — donc du JavaScript sur chacune des vingt-quatre
              cartes. Il dit ce qui manquait : il y a d'autres photos. */}
          {photos.length > 1 ? (
            <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs backdrop-blur">
              <Images className="size-3" />
              <span className="tabular-nums">{photos.length}</span>
            </span>
          ) : null}
        </div>

        <div className="space-y-1 text-center">
          <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>

          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Store className="size-3 shrink-0" />
            <span className="truncate">{product.shops.name}</span>
          </p>

          <p className="text-sm">
            <span className="font-semibold">{formatMoney(prix, devise)}</span>
            {enPromo ? (
              <span className="ml-1.5 text-muted-foreground line-through">
                {formatMoney(product.price, devise)}
              </span>
            ) : null}
          </p>
        </div>
      </Link>
    </li>
  );
}
