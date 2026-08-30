"use server";

import { createClient } from "@/lib/supabase/server";
import type { MarketplaceProduct } from "@/lib/marketplace/types";

/** Au-delà, la liste n'est plus une liste d'envies mais un catalogue. */
const MAX_FAVORIS = 100;

/**
 * Relit en base les articles mis de côté.
 *
 * Les favoris ne vivent que dans le navigateur de l'acheteur : le serveur ne
 * sait rien de lui et reçoit simplement une liste d'identifiants. Il n'y a donc
 * rien à autoriser — la RLS ne laisse sortir que les produits actifs de
 * boutiques publiées, et un identifiant de produit retiré de la vente ne
 * ressort tout simplement pas.
 *
 * C'est aussi pourquoi seuls les identifiants sont conservés côté navigateur :
 * un article mis de côté il y a deux semaines s'affiche à son prix
 * d'aujourd'hui.
 */
export async function getFavoris(ids: string[]): Promise<MarketplaceProduct[]> {
  const propres = ids
    .filter((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id))
    .slice(0, MAX_FAVORIS);

  if (propres.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, product_images(url, alt_text, position), shops!inner(slug, name, currency_symbol, category)",
    )
    .in("id", propres);

  if (error) return [];

  // L'ordre de `in()` n'est pas garanti : on rend celui du navigateur, qui est
  // l'ordre dans lequel l'acheteur a ajouté ses articles.
  const parId = new Map((data ?? []).map((p) => [(p as { id: string }).id, p]));
  return propres
    .map((id) => parId.get(id))
    .filter(Boolean) as unknown as MarketplaceProduct[];
}
