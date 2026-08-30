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

/**
 * Le numéro WhatsApp du vendeur, pour une commande précise.
 *
 * Il n'est plus lisible par le rôle anonyme : la colonne lui a été retirée, un
 * numéro de commerçant n'ayant rien à faire dans une réponse publique où
 * n'importe qui pouvait le moissonner. La lecture passe donc par le rôle
 * serveur — et seulement ici, sur une page attachée à une commande réelle, dont
 * l'identifiant a été vérifié juste avant.
 *
 * C'est la nuance qui compte : l'acheteur peut toujours joindre son vendeur,
 * mais après avoir passé commande, pas à la place.
 */
export async function getSellerWhatsApp(shopId: string, orderId: string): Promise<string | null> {
  const admin = createAdminClient();

  // La commande doit exister et appartenir à cette boutique. Sans ce contrôle,
  // l'identifiant d'une boutique suffirait à obtenir son numéro.
  const { data: commande } = await admin
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (!commande) return null;

  const { data: shop } = await admin
    .from("shops")
    .select("whatsapp_number")
    .eq("id", shopId)
    .maybeSingle();

  return shop?.whatsapp_number ?? null;
}
