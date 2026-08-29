import "server-only";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { startOfToday } from "@/lib/shop/queries";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Shop = Database["public"]["Tables"]["shops"]["Row"];
type DeliveryPartner = Database["public"]["Tables"]["delivery_partners"]["Row"];
type DeliveryZone = Database["public"]["Tables"]["delivery_zones"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type Payout = Database["public"]["Tables"]["agent_commission_payouts"]["Row"];

// Lectures des espaces agent et livreur. Comme partout, elles passent par le
// client de l'utilisateur connecté : ce sont les policies qui décident de ce
// qui est visible, pas un filtre ajouté ici. Un agent qui interrogerait
// directement l'API ne verrait rien de plus que son écran.

// ============================================================
// Agent commercial
// ============================================================

export type RecruitedSeller = Profile & {
  shops: Pick<Shop, "id" | "name" | "slug" | "published_at" | "created_at">[];
};

export async function getRecruitedSellers(agentId: string): Promise<RecruitedSeller[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, shops(id, name, slug, published_at, created_at)")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as RecruitedSeller[];
}

export async function getAgentPayouts(agentId: string): Promise<Payout[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_commission_payouts")
    .select("*")
    .eq("agent_id", agentId)
    .order("period_month", { ascending: false })
    .limit(24);

  return data ?? [];
}

export type AgentStats = {
  recruited: number;
  published: number;
  pro: number;
  /** Ce que rapporterait le mois en cours si tout était versé aujourd'hui. */
  monthlyCommission: number;
  paidToDate: number;
  pendingPayout: number;
};

/**
 * La commission n'est due que pour un vendeur qui a réellement publié sa
 * boutique : recruter un compte vide ne rapporte rien, sinon le programme
 * récompenserait le volume plutôt que l'activité.
 */
export function computeAgentStats(
  sellers: RecruitedSeller[],
  payouts: Payout[],
  commissionParSeller: number,
): AgentStats {
  const published = sellers.filter((s) => s.shops?.some((shop) => shop.published_at)).length;

  return {
    recruited: sellers.length,
    published,
    pro: sellers.filter((s) => s.is_pro).length,
    monthlyCommission: published * commissionParSeller,
    paidToDate: payouts
      .filter((p) => p.status === "paid")
      .reduce((total, p) => total + p.amount, 0),
    pendingPayout: payouts
      .filter((p) => p.status === "pending")
      .reduce((total, p) => total + p.amount, 0),
  };
}

// ============================================================
// Livreur
// ============================================================

export type AssignedOrder = Order & {
  order_items: { id: string; product_name: string; quantity: number; size: string | null }[];
  shops: Pick<Shop, "name" | "whatsapp_number" | "currency_symbol"> | null;
};

export async function getMyDeliveryPartners(): Promise<DeliveryPartner[]> {
  const session = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("delivery_partners")
    .select("*")
    .eq("user_id", session.userId);

  return data ?? [];
}

export async function getAssignedOrders(partnerIds: string[]): Promise<AssignedOrder[]> {
  if (partnerIds.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "*, order_items(id, product_name, quantity, size), shops(name, whatsapp_number, currency_symbol)",
    )
    .in("delivery_partner_id", partnerIds)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []) as unknown as AssignedOrder[];
}

export function countDeliveredToday(orders: AssignedOrder[]): number {
  const since = startOfToday();
  return orders.filter((o) => o.status === "delivered" && o.created_at >= since).length;
}

// ============================================================
// Livraison, côté vendeur
// ============================================================

export async function getShopZones(shopId: string): Promise<DeliveryZone[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("shop_id", shopId)
    .order("price", { ascending: true });

  return data ?? [];
}

export async function getShopPartners(shopId: string): Promise<DeliveryPartner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_partners")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
