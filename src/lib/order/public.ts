import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Relecture d'une commande par l'acheteur, qui n'a pas de compte.
//
// La lecture se fait côté serveur avec la clé service_role, sur l'identifiant
// exact tiré de l'URL, et seule cette commande-là est renvoyée. C'est
// volontairement *pas* une policy RLS publique : "select using (true)" sur
// orders exposerait le nom, le téléphone et l'adresse de tous les clients de
// toutes les boutiques. L'identifiant est un uuid v4, non énumérable.

export type PublicOrder = {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string | null;
  delivery_fee: number;
  total_amount: number;
  status: string;
  source: string;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    size: string | null;
  }[];
};

export async function getPublicOrder(
  orderId: string,
  shopId: string,
): Promise<PublicOrder | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("orders")
    .select(
      "id, shop_id, customer_name, customer_phone, customer_address, customer_city, delivery_fee, total_amount, status, source, created_at, order_items(id, product_name, unit_price, quantity, size)",
    )
    .eq("id", orderId)
    .maybeSingle();

  // La commande doit appartenir à la boutique de l'URL : sinon un identifiant
  // valide permettrait de lire une commande depuis n'importe quelle boutique.
  if (!data || data.shop_id !== shopId) return null;

  return data as unknown as PublicOrder;
}
