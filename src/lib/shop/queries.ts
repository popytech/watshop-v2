import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import type { Database } from "@/lib/supabase/types";

type Shop = Database["public"]["Tables"]["shops"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];

// Lectures du tableau de bord vendeur. Toutes passent par le client de
// l'utilisateur connecté : c'est la RLS qui garantit qu'on ne voit que sa
// propre boutique, pas un filtre applicatif qu'on pourrait oublier.

/**
 * Début de la journée en cours, en UTC. La Guinée est à UTC+0 toute l'année :
 * la journée civile locale et la journée UTC coïncident. À revoir si Watshop
 * s'étend à un pays qui ne serait pas sur GMT.
 */
export function startOfToday(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

export const getMyShop = cache(async (): Promise<Shop | null> => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ?? null;
});

/** Exige une boutique : sans elle, l'utilisateur est renvoyé dans l'onboarding. */
export async function requireShop(): Promise<Shop> {
  const shop = await getMyShop();
  if (!shop) redirect("/onboarding/boutique");
  return shop;
}

/** Exige une boutique *publiée* : le tableau de bord n'a pas de sens avant. */
export async function requirePublishedShop(): Promise<Shop> {
  const shop = await requireShop();
  if (!shop.published_at) redirect(onboardingPath(shop.onboarding_step));
  return shop;
}

export function onboardingPath(step: number): string {
  switch (step) {
    case 2:
      return "/onboarding/boutique";
    case 3:
      return "/onboarding/apparence";
    case 4:
      return "/onboarding/produits";
    case 5:
      return "/onboarding/whatsapp";
    default:
      return "/onboarding/publication";
  }
}

export type DashboardStats = {
  orders: number;
  sales: number;
  visitors: number;
  whatsappOrders: number;
};

/** Les quatre chiffres du jour affichés en haut du tableau de bord. */
export async function getDashboardStats(shopId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const since = startOfToday();

  const [ordersToday, visits] = await Promise.all([
    supabase
      .from("orders")
      .select("total_amount, status, source")
      .eq("shop_id", shopId)
      .gte("created_at", since),
    supabase
      .from("shop_visits")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .gte("created_at", since),
  ]);

  const rows = ordersToday.data ?? [];
  // Une commande annulée n'est ni une vente ni une commande du jour à afficher.
  const retenues = rows.filter((row) => row.status !== "cancelled");

  return {
    orders: retenues.length,
    sales: retenues.reduce((total, row) => total + row.total_amount, 0),
    visitors: visits.count ?? 0,
    whatsappOrders: retenues.filter((row) => row.source === "whatsapp").length,
  };
}

export type ProductWithImage = Product & { product_images: { url: string; alt_text: string }[] };

export async function getProducts(shopId: string): Promise<ProductWithImage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, alt_text, position)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as ProductWithImage[];
}

export async function getProduct(shopId: string, productId: string): Promise<ProductWithImage | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, alt_text, position)")
    .eq("shop_id", shopId)
    .eq("id", productId)
    .maybeSingle();

  return (data as unknown as ProductWithImage) ?? null;
}

export type OrderWithItems = Order & {
  order_items: {
    id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    size: string | null;
  }[];
};

/** Les dernières commandes, avec leurs lignes : la liste en affiche le résumé. */
export async function getRecentOrders(shopId: string, limit = 5): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(id, product_name, unit_price, quantity, size)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as OrderWithItems[];
}

export async function getOrders(shopId: string, limit = 50): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(id, product_name, unit_price, quantity, size)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as OrderWithItems[];
}

export async function getOrder(shopId: string, orderId: string): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(id, product_name, unit_price, quantity, size)")
    .eq("shop_id", shopId)
    .eq("id", orderId)
    .maybeSingle();

  return (data as unknown as OrderWithItems) ?? null;
}

/**
 * Un slug est-il déjà pris ? Contrôle indicatif seulement : la RLS ne laisse
 * voir que les boutiques publiées et la sienne, donc un slug réservé par une
 * boutique encore en brouillon passera au travers. La garantie réelle reste la
 * contrainte d'unicité en base, dont l'erreur est traduite dans les actions.
 */
export async function isSlugTaken(slug: string, exceptShopId?: string): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("shops").select("id").eq("slug", slug).limit(1);
  if (exceptShopId) query = query.neq("id", exceptShopId);

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}
