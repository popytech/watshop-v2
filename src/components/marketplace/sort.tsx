import Link from "next/link";

import { TRIS, toQueryString, type MarketplaceParams } from "@/lib/marketplace/params";
import { cn } from "@/lib/utils";

/**
 * Tri en liens, repris de Your Next Store (MIT).
 *
 * YNS en fait deux composants clients qui lisent l'URL et poussent par le
 * routeur ; ici les liens sont rendus côté serveur, puisque la page connaît
 * déjà ses paramètres. Ils marchent donc sans JavaScript, et il n'y a qu'une
 * version au lieu de deux — trois options tiennent sur une ligne de téléphone.
 *
 * Changer le tri renvoie à la page 1 : le résultat est le même, dans un autre
 * ordre, et la page 3 de l'ancien ordre ne veut plus rien dire.
 */
export function SortLinks({
  params,
  chemin,
}: {
  params: MarketplaceParams;
  chemin: string;
}) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      <span className="shrink-0 text-sm text-muted-foreground">Trier :</span>

      {TRIS.map((tri) => {
        const actif = params.tri === tri.valeur;

        return (
          <Link
            key={tri.valeur}
            href={`${chemin}${toQueryString({ ...params, tri: tri.valeur, page: 1 })}`}
            aria-current={actif ? "true" : undefined}
            className={cn(
              "shrink-0 text-sm transition-colors",
              actif
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tri.label}
          </Link>
        );
      })}
    </div>
  );
}
