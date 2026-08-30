import Image from "next/image";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

export type Photo = { url: string; alt_text: string };

/**
 * Bande de photos que l'on fait glisser au doigt.
 *
 * Jusqu'ici la deuxième photo d'un produit n'apparaissait qu'au survol, et le
 * survol n'existe pas sur un écran tactile : sur téléphone, les photos 2 à 4
 * étaient tout simplement inatteignables. Or c'est là que sont nos acheteurs,
 * et une seule photo suffit rarement à décider d'un achat.
 *
 * Tout repose sur `scroll-snap`, donc sur le défilement natif : aucun
 * JavaScript, aucune librairie de carrousel, et le geste est celui que le
 * téléphone connaît déjà. Vingt-quatre cartes par page, cela compte — autant
 * d'instances d'Embla auraient coûté cher exactement aux appareils qu'on vise.
 *
 * Le défilement natif n'émet pas de clic : la bande peut donc vivre à
 * l'intérieur d'un lien sans que faire glisser ouvre la fiche. `overscroll-x`
 * empêche le geste de se propager à la page une fois la dernière photo
 * atteinte.
 */
export function PhotoStrip({
  photos,
  alt,
  sizes,
  priority = false,
  className,
  /** Préfixe des ancres, pour que des vignettes puissent viser une photo. */
  ancre,
}: {
  photos: Photo[];
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  ancre?: string;
}) {
  if (photos.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center bg-secondary",
          className,
        )}
      >
        <ImageOff className="size-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain",
        className,
      )}
    >
      {photos.map((photo, index) => (
        <div
          key={photo.url}
          id={ancre ? `${ancre}-${index}` : undefined}
          className="relative aspect-square w-full shrink-0 snap-center"
        >
          <Image
            src={photo.url}
            alt={index === 0 ? alt : ""}
            fill
            sizes={sizes}
            priority={priority && index === 0}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
