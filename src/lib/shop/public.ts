import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Shop = Database["public"]["Tables"]["shops"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type DeliveryZone = Database["public"]["Tables"]["delivery_zones"]["Row"];

// Lectures de la boutique publique, faites avec le client anonyme.
//
// Aucune vérification d'autorisation applicative ici : ce sont les policies
// RLS qui décident de ce qui est visible (boutique publiée et active, produits
// actifs). Une boutique en brouillon est donc introuvable même en connaissant
// son adresse, sans qu'aucune condition n'ait à être répétée dans le code.

export type PublicProduct = Product & {
  product_images: { url: string; alt_text: string; position: number }[];
};

/**
 * Les colonnes d'une boutique que le public a le droit de lire.
 *
 * Le rôle anonyme n'a plus le SELECT sur toute la table (migration 0017) : son
 * numéro WhatsApp et son Mobile Money lui sont retirés, pour qu'un robot ne
 * puisse pas les moissonner et qu'un acheteur ne traite pas en direct, hors de
 * toute commande.
 *
 * Il faut donc nommer les colonnes : un `select("*")` échoue dès qu'une seule
 * manque au lot. C'est une contrainte utile — la liste dit noir sur blanc ce que
 * la vitrine expose.
 */
/**
 * La boutique telle que le public la voit — sans les coordonnées du vendeur ni
 * notre cuisine interne.
 *
 * Le type dit ce que la base applique : ces colonnes ne sont pas seulement
 * omises de la requête, elles sont hors de portée du rôle anonyme. Un code qui
 * essaierait d'y lire un numéro de téléphone ne compile plus.
 */
export type PublicShop = Omit<
  Shop,
  "whatsapp_number" | "mobile_money_number" | "onboarding_step" | "created_by_agent_id"
>;

export const COLONNES_PUBLIQUES =
  "id, user_id, name, slug, description, country_code, currency_symbol, logo_url, cover_url, primary_color, category, published_at, is_active, is_verified, is_sponsored, created_at";

export const getPublicShop = cache(async (slug: string): Promise<PublicShop | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select(COLONNES_PUBLIQUES)
    .eq("slug", slug)
    .maybeSingle();

  return data ?? null;
});

export async function getPublicProducts(shopId: string): Promise<PublicProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, alt_text, position)")
    .eq("shop_id", shopId)
    .order("is_sponsored", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as PublicProduct[];
}

export async function getPublicProduct(
  shopId: string,
  slug: string,
): Promise<PublicProduct | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, alt_text, position)")
    .eq("shop_id", shopId)
    .eq("slug", slug)
    .maybeSingle();

  return (data as unknown as PublicProduct) ?? null;
}

export async function getDeliveryZones(shopId: string): Promise<DeliveryZone[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("shop_id", shopId)
    .order("price", { ascending: true });

  return data ?? [];
}

/** Boutiques publiées, pour le sitemap. */
export async function getPublishedShops(): Promise<Pick<Shop, "slug" | "created_at">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select("slug, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  return data ?? [];
}

export { effectivePrice, sortedImages } from "@/lib/shop/price";

/**
 * La boutique appartient-elle à un vendeur Pro ?
 *
 * Sert à retirer la mention « propulsée par Watshop » du pied de page, une des
 * contreparties de l'offre. La question passe par une fonction `security
 * definer` : un visiteur anonyme n'a aucun droit sur la table des abonnements,
 * et ne doit pas en avoir — elle ne regarde que son propriétaire.
 */
export const isShopPro = cache(async (userId: string): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_pro_active", { uid: userId });
  return data === true;
});
