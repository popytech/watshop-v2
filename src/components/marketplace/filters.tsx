"use client";

import type { ChangeEvent } from "react";
import { usePathname } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/phone";
import { SHOP_CATEGORIES, categorySlug } from "@/lib/shop/categories";
import { TRIS, type MarketplaceParams } from "@/lib/marketplace/params";

/**
 * Barre de filtres.
 *
 * Un `<form method="get">` tout simple plutôt qu'un état React poussé dans
 * l'URL : la page est déjà rendue côté serveur, et une recherche doit marcher
 * sur un Android d'entrée de gamme dont le JavaScript n'a pas fini de charger.
 * Le bouton « Filtrer » suffit ; le JavaScript, quand il est là, ne fait
 * qu'éviter d'avoir à l'atteindre après chaque choix.
 *
 * `page` n'est volontairement pas un champ du formulaire : changer un filtre
 * renvoie donc à la page 1, ce qui est le seul comportement correct — la page 7
 * d'un résultat n'a rien à voir avec la page 7 du suivant.
 *
 * Les listes déroulantes sont natives : sur téléphone elles ouvrent le sélecteur
 * du système, plus rapide et plus familier qu'un menu recréé en HTML.
 */
const CLASSE_SELECT =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-auto";

export function Filters({
  params,
  avecTri,
}: {
  params: MarketplaceParams;
  /** Le tri par prix n'est proposé que sur les produits. */
  avecTri: boolean;
}) {
  const pathname = usePathname();

  function soumettre(event: ChangeEvent<HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <form action={pathname} method="get" className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder={avecTri ? "Rechercher un produit…" : "Rechercher une boutique…"}
            className="h-10 pl-9"
            aria-label="Rechercher"
          />
        </div>
        <Button type="submit" className="h-10">
          <SlidersHorizontal className="sm:hidden" />
          <span className="hidden sm:inline">Filtrer</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          name="categorie"
          defaultValue={params.categorie ? categorySlug(params.categorie) : ""}
          onChange={soumettre}
          className={CLASSE_SELECT}
          aria-label="Catégorie"
        >
          <option value="">Toutes les catégories</option>
          {SHOP_CATEGORIES.map((categorie) => (
            <option key={categorie} value={categorySlug(categorie)}>
              {categorie}
            </option>
          ))}
        </select>

        <select
          name="pays"
          defaultValue={params.pays ?? ""}
          onChange={soumettre}
          className={CLASSE_SELECT}
          aria-label="Pays"
        >
          <option value="">Tous les pays</option>
          {COUNTRIES.map((pays) => (
            <option key={pays.code} value={pays.code}>
              {pays.name}
            </option>
          ))}
        </select>

        {avecTri ? (
          <select
            name="tri"
            defaultValue={params.tri}
            onChange={soumettre}
            className={CLASSE_SELECT}
            aria-label="Trier"
          >
            {TRIS.map((tri) => (
              <option key={tri.valeur} value={tri.valeur}>
                {tri.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </form>
  );
}
