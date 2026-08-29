"use client";

import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Les filtres, dans un panneau coulissant. Une colonne latérale prenait un quart
 * de la largeur pour deux filtres, au détriment des visuels — qui sont ce qui
 * fait vendre.
 *
 * Seule l'enveloppe est un composant client : les filtres eux-mêmes sont rendus
 * côté serveur et passés en `children`. Leurs liens fonctionnent donc même si le
 * panneau, lui, a besoin de JavaScript pour s'ouvrir.
 */
export function FiltersMobile({
  children,
  actifs,
}: {
  children: ReactNode;
  /** Nombre de filtres posés, affiché sur le bouton. */
  actifs: number;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10">
          <SlidersHorizontal />
          Filtres
          {actifs > 0 ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground tabular-nums">
              {actifs}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[min(20rem,85vw)] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtres</SheetTitle>
          <SheetDescription>Affinez par catégorie et par pays.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
