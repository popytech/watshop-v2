import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/phone";
import { SHOP_CATEGORIES, categorySlug } from "@/lib/shop/categories";
import { toQueryString, type MarketplaceParams } from "@/lib/marketplace/params";
import { cn } from "@/lib/utils";

/**
 * Filtres du marketplace, dans la disposition de Your Next Store (MIT) : une
 * colonne à gauche sur grand écran, un panneau coulissant sur téléphone.
 *
 * Une différence de mécanisme assumée. YNS pousse chaque changement de filtre
 * par le routeur côté client ; ici ce sont de vrais liens et un vrai formulaire
 * GET. Le résultat visible est le même, mais il marche avant que le JavaScript
 * ait fini de charger — ce qui, sur un Android d'entrée de gamme en 3G, n'est
 * pas un détail.
 *
 * Deux filtres seulement, parce que la base n'en porte que deux : la catégorie
 * de la boutique et son pays. Les facettes de YNS (marques, collections,
 * fourchette de prix, déclinaisons) n'ont pas d'équivalent ici, et en afficher
 * qui ne filtreraient rien serait pire que de ne pas les afficher.
 */

/** Un choix de filtre : un lien qui pose la valeur, ou la retire si elle est active. */
function OptionFiltre({
  actif,
  href,
  children,
}: {
  actif: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={actif ? "true" : undefined}
        className={cn(
          "block rounded-md px-2 py-1.5 text-sm transition-colors",
          actif
            ? "bg-secondary font-medium text-foreground"
            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        )}
      >
        {children}
      </Link>
    </li>
  );
}

function Groupe({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {titre}
      </p>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

export function FilterControls({
  params,
  chemin,
}: {
  params: MarketplaceParams;
  chemin: string;
}) {
  // Changer un filtre renvoie à la page 1 : la page 7 d'un résultat n'a rien à
  // voir avec la page 7 du suivant.
  const lien = (modif: Partial<MarketplaceParams>) =>
    `${chemin}${toQueryString({ ...params, ...modif, page: 1 })}`;

  const filtreActif = Boolean(params.q || params.categorie || params.pays);

  return (
    <div className="flex flex-col gap-6">
      {/* La recherche reste un formulaire : elle a besoin d'une saisie. Les
          filtres actifs y sont recopiés en champs cachés, sinon chercher les
          effacerait. */}
      <form action={chemin} method="get" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Rechercher…"
            className="h-10 pl-9"
            aria-label="Rechercher"
          />
        </div>
        {params.categorie ? (
          <input type="hidden" name="categorie" value={categorySlug(params.categorie)} />
        ) : null}
        {params.pays ? <input type="hidden" name="pays" value={params.pays} /> : null}
        {params.tri !== "recent" ? <input type="hidden" name="tri" value={params.tri} /> : null}
        <Button type="submit" size="icon" className="size-10 shrink-0" aria-label="Rechercher">
          <Search />
        </Button>
      </form>

      <Groupe titre="Catégorie">
        <OptionFiltre actif={!params.categorie} href={lien({ categorie: null })}>
          Toutes les catégories
        </OptionFiltre>
        {SHOP_CATEGORIES.map((categorie) => {
          const actif = params.categorie === categorie;
          return (
            <OptionFiltre
              key={categorie}
              actif={actif}
              href={lien({ categorie: actif ? null : categorie })}
            >
              {categorie}
            </OptionFiltre>
          );
        })}
      </Groupe>

      <Groupe titre="Pays">
        <OptionFiltre actif={!params.pays} href={lien({ pays: null })}>
          Tous les pays
        </OptionFiltre>
        {COUNTRIES.map((pays) => {
          const actif = params.pays === pays.code;
          return (
            <OptionFiltre
              key={pays.code}
              actif={actif}
              href={lien({ pays: actif ? null : pays.code })}
            >
              {pays.name}
            </OptionFiltre>
          );
        })}
      </Groupe>

      {filtreActif ? (
        <Link
          href={chemin}
          className="px-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Tout effacer
        </Link>
      ) : null}
    </div>
  );
}
