import Image from "next/image";
import Link from "next/link";
import { ImageOff, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { effectivePrice } from "@/lib/shop/public";
import type { MarketplaceProduct } from "@/lib/marketplace/queries";

/**
 * Carte produit du marketplace, dans la composition de Your Next Store (MIT) :
 * visuel carré aux coins arrondis, texte posé dessous sans encadrement. Une
 * grille de vitrine, pas une grille de tableau de bord.
 *
 * Deux ajouts propres à Watshop :
 *   - la deuxième photo apparaît au survol, quand le vendeur en a mis une ;
 *   - le nom de la boutique, parce qu'ici l'acheteur navigue entre des vendeurs
 *     et doit savoir chez qui il achète avant de cliquer.
 *
 * Le lien mène à la fiche produit dans la boutique du vendeur, pas à une fiche
 * du marketplace : c'est là qu'est le panier.
 */
export function MarketplaceProductCard({
  product,
  priority = false,
}: {
  product: MarketplaceProduct;
  /** Vrai pour la première carte : son image est le plus grand élément visible. */
  priority?: boolean;
}) {
  const images = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);
  const principale = images[0];
  const secondaire = images[1];

  // Recalculé plutôt que lu dans `effective_price` : la colonne générée sert au
  // tri, qui se fait en SQL ; l'affichage passe par le même helper que la
  // boutique, donc la carte reste juste même si la migration n'est pas passée.
  const prix = effectivePrice(product);
  const enPromo = prix < product.price;
  const rupture = product.quantity <= 0;
  const devise = product.shops.currency_symbol;
  const tailles = (product.sizes ?? []).filter(Boolean);

  return (
    <li>
      <Link href={`/${product.shops.slug}/produit/${product.slug}`} className="group block">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-secondary">
          {principale ? (
            <>
              <Image
                src={principale.url}
                alt={principale.alt_text || product.name}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
                priority={priority}
                className={`object-cover transition-opacity duration-500 ${
                  secondaire ? "group-hover:opacity-0" : ""
                }`}
              />
              {secondaire ? (
                <Image
                  src={secondaire.url}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <span className="flex size-full items-center justify-center">
              <ImageOff className="size-5 text-muted-foreground" />
            </span>
          )}

          {enPromo ? <Badge className="absolute top-2 left-2">Promo</Badge> : null}
          {rupture ? (
            <Badge variant="secondary" className="absolute top-2 right-2">
              Rupture
            </Badge>
          ) : null}
        </div>

        {/* Texte centré sous le visuel, comme chez YNS : la grille se lit comme
            une vitrine, pas comme un tableau. */}
        <div className="space-y-1 text-center">
          {/* À la place des pastilles de couleur de YNS, qui reposent sur leurs
              variantes : nous n'avons pas de couleurs en base, mais des tailles,
              saisies en texte libre par le vendeur. Trois au plus, pour ne pas
              qu'une saisie bavarde déséquilibre la grille. */}
          {tailles.length > 0 ? (
            <ul className="flex flex-wrap justify-center gap-1">
              {tailles.slice(0, 3).map((taille) => (
                <li
                  key={taille}
                  className="rounded border px-1.5 py-0.5 text-[0.65rem] leading-none text-muted-foreground"
                >
                  {taille}
                </li>
              ))}
              {tailles.length > 3 ? (
                <li className="px-1 text-[0.65rem] leading-none text-muted-foreground">
                  +{tailles.length - 3}
                </li>
              ) : null}
            </ul>
          ) : null}

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
