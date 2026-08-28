"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/fonnte";
import { toE164, toFonnteTarget } from "@/lib/phone";
import { formatMoney } from "@/lib/format";
import { checkoutSchema, fieldErrors, parseCartField } from "@/lib/order/schemas";
import type { CheckoutState } from "@/lib/order/state";

// Création d'une commande par un acheteur non authentifié.
//
// C'est le seul endroit de l'application qui utilise la clé service_role dans
// un parcours public — et pour cause : l'acheteur n'a pas de compte, aucune
// policy RLS ne peut donc l'autoriser à écrire. Contrepartie, tout est
// revérifié ici :
//   - la boutique doit exister, être active et publiée
//   - chaque produit doit appartenir à cette boutique et être actif
//   - les prix sont relus en base, jamais repris du panier envoyé par le client
// Sans ça, un acheteur pourrait se fixer ses propres prix.

export async function createOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    shopSlug: formData.get("shopSlug") ?? "",
    source: (formData.get("source") as string) || undefined,
    customerName: formData.get("customerName") ?? "",
    customerPhone: formData.get("customerPhone") ?? "",
    customerAddress: formData.get("customerAddress") ?? "",
    customerCity: (formData.get("customerCity") as string) || undefined,
    deliveryZoneId: (formData.get("deliveryZoneId") as string) || null,
    note: (formData.get("note") as string) || undefined,
    countryCode: (formData.get("countryCode") as string) || undefined,
    items: parseCartField(formData.get("items")),
  });

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const input = parsed.data;
  const admin = createAdminClient();

  const { data: shop } = await admin
    .from("shops")
    .select("id, name, slug, currency_symbol, whatsapp_number, is_active, published_at")
    .eq("slug", input.shopSlug)
    .maybeSingle();

  if (!shop || !shop.is_active || !shop.published_at) {
    return { message: "Cette boutique n'est plus disponible." };
  }

  const { data: products } = await admin
    .from("products")
    .select("id, name, price, promo_price, is_active, shop_id")
    .in(
      "id",
      input.items.map((item) => item.productId),
    );

  const catalogue = new Map((products ?? []).map((product) => [product.id, product]));

  const lines = [];
  for (const item of input.items) {
    const product = catalogue.get(item.productId);
    if (!product || product.shop_id !== shop.id || !product.is_active) {
      return {
        message:
          "Un produit de votre panier n'est plus disponible. Retirez-le pour continuer.",
      };
    }

    const unitPrice =
      product.promo_price !== null && product.promo_price < product.price
        ? product.promo_price
        : product.price;

    lines.push({
      product_id: product.id,
      product_name: product.name,
      unit_price: unitPrice,
      quantity: item.quantity,
      size: item.size,
    });
  }

  const subtotal = lines.reduce((total, line) => total + line.unit_price * line.quantity, 0);

  // La zone de livraison, si elle est fournie, doit appartenir à cette boutique.
  let deliveryFee = 0;
  let zoneName: string | null = null;
  if (input.deliveryZoneId) {
    const { data: zone } = await admin
      .from("delivery_zones")
      .select("id, zone_name, price, free_above, shop_id")
      .eq("id", input.deliveryZoneId)
      .maybeSingle();

    if (!zone || zone.shop_id !== shop.id) {
      return { message: "Zone de livraison inconnue." };
    }

    zoneName = zone.zone_name;
    deliveryFee =
      zone.free_above !== null && subtotal >= zone.free_above ? 0 : zone.price;
  }

  const orderId = crypto.randomUUID();
  const customerPhone = toE164(input.customerPhone, input.countryCode)!;

  const { error: orderError } = await admin.from("orders").insert({
    id: orderId,
    shop_id: shop.id,
    customer_name: input.customerName,
    customer_phone: customerPhone,
    customer_address: input.customerAddress,
    customer_city: input.customerCity ?? null,
    delivery_zone_id: input.deliveryZoneId,
    delivery_fee: deliveryFee,
    total_amount: subtotal + deliveryFee,
    source: input.source,
  });

  if (orderError) {
    return { message: "Impossible d'enregistrer la commande. Réessayez." };
  }

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(lines.map((line) => ({ ...line, order_id: orderId })));

  if (itemsError) {
    // La commande sans ses lignes n'a aucun sens : on la retire plutôt que de
    // laisser le vendeur avec un montant sans détail.
    await admin.from("orders").delete().eq("id", orderId);
    return { message: "Impossible d'enregistrer la commande. Réessayez." };
  }

  await notifySeller({
    shopName: shop.name,
    sellerPhone: shop.whatsapp_number,
    currency: shop.currency_symbol,
    customerName: input.customerName,
    customerPhone,
    address: [input.customerAddress, input.customerCity].filter(Boolean).join(", "),
    zoneName,
    note: input.note ?? null,
    lines,
    total: subtotal + deliveryFee,
    orderId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/commandes");

  redirect(`/${shop.slug}/commande/${orderId}`);
}

/**
 * Prévient le vendeur sur WhatsApp. Volontairement "best effort" : la commande
 * est déjà enregistrée, un échec d'envoi ne doit pas la faire disparaître —
 * le vendeur la verra dans son tableau de bord, et le statut d'envoi y est
 * conservé.
 */
async function notifySeller(params: {
  shopName: string;
  sellerPhone: string | null;
  currency: string;
  customerName: string;
  customerPhone: string;
  address: string;
  zoneName: string | null;
  note: string | null;
  lines: { product_name: string; unit_price: number; quantity: number; size: string | null }[];
  total: number;
  orderId: string;
}): Promise<void> {
  const admin = createAdminClient();

  if (!params.sellerPhone) {
    await admin
      .from("orders")
      .update({ seller_notification_status: "no_number" })
      .eq("id", params.orderId);
    return;
  }

  const detail = params.lines
    .map(
      (line) =>
        `• ${line.quantity} × ${line.product_name}${line.size ? ` (${line.size})` : ""} — ${formatMoney(line.unit_price * line.quantity, params.currency)}`,
    )
    .join("\n");

  const message = [
    `*Nouvelle commande — ${params.shopName}*`,
    "",
    detail,
    "",
    `Total : *${formatMoney(params.total, params.currency)}*`,
    params.zoneName ? `Livraison : ${params.zoneName}` : null,
    "",
    `Client : ${params.customerName}`,
    `Téléphone : ${params.customerPhone}`,
    `Adresse : ${params.address}`,
    params.note ? `Note : ${params.note}` : null,
  ]
    .filter((part) => part !== null)
    .join("\n");

  const result = await sendWhatsAppMessage(toFonnteTarget(params.sellerPhone), message);

  await admin
    .from("orders")
    .update({
      seller_notification_status: result.ok ? "sent" : "failed",
      seller_notification_phone: params.sellerPhone,
      seller_notified_at: new Date().toISOString(),
    })
    .eq("id", params.orderId);
}
