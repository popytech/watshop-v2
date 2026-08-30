"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarketplaceProductCard } from "@/components/marketplace/product-card";
import { ProductGridSkeleton } from "@/components/marketplace/product-grid-skeleton";
import { getFavoris } from "@/lib/favoris/actions";
import { useFavoris } from "@/lib/favoris/use-favoris";
import type { MarketplaceProduct } from "@/lib/marketplace/types";

/**
 * La liste des articles mis de côté.
 *
 * Forcément rendue côté client : le serveur ne sait pas ce que l'acheteur a mis
 * de côté, cela vit dans son navigateur. Les identifiants sont lus ici, puis
 * envoyés au serveur qui renvoie les articles à leur prix du jour.
 *
 * Pas de `setState` dans un effet — la règle du projet, et elle a raison ici :
 * la requête est mise en cache par liste d'identifiants et consommée avec
 * `use()`, sous une frontière Suspense. Retirer un favori change la clé, donc
 * relance la lecture, sans qu'aucun état ne soit posé après coup.
 */
const enCours = new Map<string, Promise<MarketplaceProduct[]>>();

function charger(cle: string, ids: string[]): Promise<MarketplaceProduct[]> {
  const memorise = enCours.get(cle);
  if (memorise) return memorise;

  const promesse = getFavoris(ids);
  enCours.set(cle, promesse);

  // Le cache ne sert qu'à stabiliser la promesse d'un rendu à l'autre. Le garder
  // au-delà ferait afficher un prix périmé au prochain passage sur la page.
  void promesse.finally(() => {
    setTimeout(() => enCours.delete(cle), 30_000);
  });

  return promesse;
}

function Grille({ cle, ids, total }: { cle: string; ids: string[]; total: number }) {
  const produits = use(charger(cle, ids));

  // Un favori peut avoir disparu depuis : article retiré de la vente, ou
  // boutique dépubliée. On le dit plutôt que de faire comme si.
  const disparus = total - produits.length;

  return (
    <>
      <p className="text-sm text-muted-foreground tabular-nums">
        {produits.length} article{produits.length > 1 ? "s" : ""}
        {disparus > 0 ? ` — ${disparus} n'est plus en vente` : ""}
      </p>

      <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {produits.map((produit) => (
          <MarketplaceProductCard key={produit.id} product={produit} />
        ))}
      </ul>
    </>
  );
}

export function FavorisListe() {
  const { ids, nombre, vider } = useFavoris();
  const cle = ids.join(",");

  if (nombre === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-24 text-center">
        <Heart className="mx-auto size-6 text-muted-foreground" />
        <p className="pt-3 font-medium">Aucun article mis de côté</p>
        <p className="pt-1 text-sm text-muted-foreground">
          Touchez le cœur sur un article pour le retrouver ici.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/produits">Parcourir les produits</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Le compte se trouve dans la grille, qui seule sait combien d'articles
          sont encore en vente. Ici, seulement de quoi tout retirer. */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={vider}>
          Tout retirer
        </Button>
      </div>

      <Suspense fallback={<ProductGridSkeleton count={3} />}>
        <Grille cle={cle} ids={ids} total={nombre} />
      </Suspense>
    </div>
  );
}
