import Image from "next/image";
import Link from "next/link";
import { Store } from "lucide-react";

import { formatNumber } from "@/lib/format";
import { getCategoryTiles } from "@/lib/marketplace/queries";
import { toQueryString } from "@/lib/marketplace/params";

/**
 * « Parcourir par catégorie », dans l'esprit des tuiles de collection de la
 * démo Your Next Store : un grand visuel, le titre et une ligne de contexte
 * dessous.
 *
 * Deux règles pour que la section reste honnête :
 *   - une catégorie sans boutique publiée n'est pas rendue, plutôt que rendue
 *     vide. Avec une seule boutique en base, il y a une tuile, pas huit ;
 *   - le visuel est une vraie photo produit de la catégorie. Faute de photo, un
 *     aplat de la couleur de marque, pas une image d'illustration achetée
 *     ailleurs qui ne montrerait rien de ce qui est réellement en vente.
 *
 * Affichée seulement sans filtre actif : une fois qu'on a choisi une catégorie,
 * la liste des catégories n'est plus qu'un encombrement.
 */
export async function CategoryTiles() {
  const tuiles = await getCategoryTiles();
  if (tuiles.length === 0) return null;

  return (
    <section className="flex flex-col gap-6 border-t pt-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">Parcourir par catégorie</h2>
        <p className="text-sm text-muted-foreground">
          {tuiles.length === 1
            ? "Une seule catégorie pour l'instant. Les autres arrivent avec les prochaines boutiques."
            : "Ce que vendent les commerçants de Watshop."}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tuiles.map((tuile) => (
          <li key={tuile.nom}>
            <Link
              href={`/produits${toQueryString({ categorie: tuile.nom })}`}
              className="group block"
            >
              <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
                {tuile.image ? (
                  <Image
                    src={tuile.image.url}
                    alt={tuile.image.alt || tuile.nom}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center bg-linear-to-br from-brand/15 to-brand/5">
                    <Store className="size-8 text-brand dark:text-brand-foreground" />
                  </span>
                )}
              </div>

              <p className="font-medium">{tuile.nom}</p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {formatNumber(tuile.boutiques)} boutique{tuile.boutiques > 1 ? "s" : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Squelette de la section, aux mêmes proportions. */
export function CategoryTilesSkeleton() {
  return (
    <section className="flex flex-col gap-6 border-t pt-12">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-56 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-72 animate-pulse rounded bg-secondary" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`tuile-${i}`}>
            <div className="mb-3 aspect-[4/3] animate-pulse rounded-2xl bg-secondary" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
            <div className="mt-2 h-3 w-1/4 animate-pulse rounded bg-secondary" />
          </div>
        ))}
      </div>
    </section>
  );
}
