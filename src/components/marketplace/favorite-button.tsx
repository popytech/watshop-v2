"use client";

import { Heart } from "lucide-react";

import { useFavoris } from "@/lib/favoris/use-favoris";
import { cn } from "@/lib/utils";

/**
 * Le cœur des cartes produit.
 *
 * Il vit à l'intérieur du lien de la carte : d'où `preventDefault`, sans quoi
 * mettre un article de côté ouvrirait sa fiche. `stopPropagation` seul ne
 * suffirait pas — le clic remonterait quand même jusqu'au lien.
 *
 * `type="button"` est nécessaire : dans un formulaire, un bouton sans type est
 * un bouton d'envoi.
 */
export function FavoriteButton({
  productId,
  nom,
  className,
}: {
  productId: string;
  /** Nom de l'article, pour que le libellé lu à voix haute dise lequel. */
  nom: string;
  className?: string;
}) {
  const { estFavori, basculer } = useFavoris();
  const actif = estFavori(productId);

  return (
    <button
      type="button"
      aria-pressed={actif}
      aria-label={actif ? `Retirer ${nom} des favoris` : `Mettre ${nom} en favori`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        basculer(productId);
      }}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          actif ? "fill-destructive text-destructive" : "text-muted-foreground",
        )}
      />
    </button>
  );
}
