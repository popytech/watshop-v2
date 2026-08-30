import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

/*
 * Calculs de prix, sans accès à la base.
 *
 * Séparés de shop/public.ts, qui est `server-only` : les cartes produit sont
 * rendues côté client sur la page des favoris, et y importer le helper faisait
 * entrer tout le module serveur avec lui. Une multiplication n'a pas besoin
 * d'une connexion.
 */

/** Prix effectivement payé : le promo s'il est valide, sinon le prix normal. */
export function effectivePrice(product: Pick<Product, "price" | "promo_price">): number {
  return product.promo_price !== null && product.promo_price < product.price
    ? product.promo_price
    : product.price;
}

/** Trie les photos par position et renvoie la principale en premier. */
export function sortedImages<T extends { position: number }>(product: {
  product_images?: T[] | null;
}): T[] {
  return [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);
}
