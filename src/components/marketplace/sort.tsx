"use client";

import type { ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { categorySlug } from "@/lib/shop/categories";
import { TRIS, type MarketplaceParams } from "@/lib/marketplace/params";

/**
 * Sélecteur de tri, en haut à droite de la grille comme chez Your Next Store.
 *
 * C'est un vrai formulaire GET : la liste est native — sur téléphone elle ouvre
 * le sélecteur du système — et le bouton de repli, affiché seulement dans un
 * <noscript>, permet de trier même sans JavaScript. Quand il est là, le
 * changement de valeur envoie le formulaire tout seul.
 *
 * Les autres filtres sont recopiés en champs cachés : trier ne doit pas les
 * effacer. `page` en est volontairement absent — un nouvel ordre remet à la
 * première page.
 */
export function SortSelect({
  params,
  chemin,
}: {
  params: MarketplaceParams;
  chemin: string;
}) {
  function soumettre(event: ChangeEvent<HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <form action={chemin} method="get" className="flex items-center gap-2">
      {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
      {params.categorie ? (
        <input type="hidden" name="categorie" value={categorySlug(params.categorie)} />
      ) : null}
      {params.pays ? <input type="hidden" name="pays" value={params.pays} /> : null}

      <select
        name="tri"
        defaultValue={params.tri}
        onChange={soumettre}
        aria-label="Trier les produits"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {TRIS.map((tri) => (
          <option key={tri.valeur} value={tri.valeur}>
            {tri.label}
          </option>
        ))}
      </select>

      <noscript>
        <Button type="submit" size="sm" variant="outline">
          Trier
        </Button>
      </noscript>
    </form>
  );
}
