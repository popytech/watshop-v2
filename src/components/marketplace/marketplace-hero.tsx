import { Search, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Glow } from "@/components/landing/glow";
import { formatNumber } from "@/lib/format";
import { categorySlug } from "@/lib/shop/categories";
import { toQueryString, type MarketplaceParams } from "@/lib/marketplace/params";

/**
 * Bandeau d'ouverture du marketplace.
 *
 * Il reprend la langue visuelle de l'accueil — titre en dégradé, lueur qui
 * déborde par le bas, fondu vers la section suivante — pour qu'on reste sur le
 * même site en passant de l'un à l'autre.
 *
 * La recherche y est mise en avant plutôt que reléguée dans le panneau des
 * filtres : sur un catalogue qui mélange plusieurs vendeurs, taper ce qu'on
 * cherche est le premier geste. Le champ des filtres reste, pour affiner.
 *
 * Les deux chiffres sont comptés en base. Rien n'est écrit en dur : le jour où
 * une boutique ferme, la page le dit.
 */
export function MarketplaceHero({
  params,
  chemin,
  produits,
  boutiques,
}: {
  params: MarketplaceParams;
  chemin: string;
  produits: number;
  boutiques: number;
}) {
  return (
    <section className="fade-bottom relative overflow-hidden border-b">
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-14 text-center sm:py-20">
        <h1 className="animate-appear bg-linear-to-r from-foreground to-foreground bg-clip-text text-3xl leading-tight font-semibold text-balance text-transparent opacity-0 sm:text-5xl dark:to-muted-foreground">
          Tout ce qui se vend sur Watshop
        </h1>

        <p className="animate-appear max-w-xl text-pretty text-muted-foreground opacity-0 [animation-delay:100ms] sm:text-lg">
          {produits > 0 ? (
            <>
              {formatNumber(produits)} article{produits > 1 ? "s" : ""} chez{" "}
              {formatNumber(boutiques)} commerçant{boutiques > 1 ? "s" : ""}. La commande se passe
              chez le vendeur, sur son WhatsApp — sans compte à créer.
            </>
          ) : (
            <>
              Les premières boutiques arrivent. La commande se passe chez le vendeur, sur son
              WhatsApp — sans compte à créer.
            </>
          )}
        </p>

        {/* Un formulaire GET, comme le reste du marketplace : la recherche
            fonctionne avant que le JavaScript ait chargé. Les filtres en cours
            sont recopiés en champs cachés, sinon chercher les effacerait. */}
        <form
          action={chemin}
          method="get"
          className="animate-appear flex w-full max-w-lg gap-2 opacity-0 [animation-delay:200ms]"
        >
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Robe wax, téléphone, karité…"
              className="h-12 pl-9 text-base"
              aria-label="Rechercher un produit"
            />
          </div>
          {params.categorie ? (
            <input type="hidden" name="categorie" value={categorySlug(params.categorie)} />
          ) : null}
          {params.pays ? <input type="hidden" name="pays" value={params.pays} /> : null}
          <Button type="submit" size="lg" className="h-12">
            Chercher
          </Button>
        </form>

        {params.q ? (
          <a
            href={`${chemin}${toQueryString({ ...params, q: "", page: 1 })}`}
            className="animate-appear text-sm text-muted-foreground underline-offset-4 opacity-0 [animation-delay:300ms] hover:text-foreground hover:underline"
          >
            Effacer « {params.q} »
          </a>
        ) : (
          <p className="animate-appear flex items-center gap-1.5 text-sm text-muted-foreground opacity-0 [animation-delay:300ms]">
            <Store className="size-4" />
            Chaque article mène à la boutique de son vendeur
          </p>
        )}
      </div>

      <Glow variant="below" className="animate-appear-zoom opacity-0 [animation-delay:400ms]" />
    </section>
  );
}
