"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFavoris } from "@/lib/favoris/use-favoris";

/**
 * Le raccourci vers les favoris, dans l'en-tête du marketplace.
 *
 * La pastille n'apparaît qu'à partir du premier article : au rendu serveur la
 * liste est forcément vide, donc le HTML est le même pour tout le monde et le
 * compteur s'allume à l'hydratation, sans écart signalé par React.
 */
export function FavorisLien() {
  const { nombre } = useFavoris();

  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link
        href="/favoris"
        aria-label={
          nombre === 0
            ? "Mes favoris"
            : `Mes favoris, ${nombre} article${nombre > 1 ? "s" : ""}`
        }
      >
        <Heart className="size-4" />
        {nombre > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] leading-4 font-medium text-primary-foreground tabular-nums">
            {nombre > 99 ? "99+" : nombre}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
