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

export const getPublicShop = cache(async (slug: string): Promise<Shop | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("shops").select("*").eq("slug", slug).maybeSingle();

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

/** Trie les images par position et renvoie la principale en premier. */
export function sortedImages(product: PublicProduct) {
  return [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);
}

/** Prix effectivement payé : le promo s'il est valide, sinon le prix normal. */
export function effectivePrice(product: Pick<Product, "price" | "promo_price">): number {
  return product.promo_price !== null && product.promo_price < product.price
    ? product.promo_price
    : product.price;
}
