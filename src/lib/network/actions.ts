"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, verifySession } from "@/lib/dal";
import { requireShop } from "@/lib/shop/queries";
import type { FormState } from "@/lib/shop/state";
import {
  assignPartnerSchema,
  deliveryPartnerSchema,
  deliveryStatusSchema,
  deliveryZoneSchema,
  fieldErrors,
  normalizePhone,
} from "@/lib/network/schemas";

// Écritures des écrans livraison. Toutes passent par le client de
// l'utilisateur : la RLS refuse une zone ou un livreur rattaché à une boutique
// qui n'est pas la sienne, même si l'identifiant était falsifié.

// ============================================================
// Validation des agents (admin)
// ============================================================

/**
 * Le rôle agent se choisit à l'inscription : n'importe quel compte peut le
 * demander. Tant qu'il n'est pas validé, son code ne rattache aucun vendeur —
 * c'est le trigger d'inscription qui l'ignore, pas l'application.
 *
 * Retirer la validation arrête les futurs rattachements sans défaire ceux déjà
 * acquis : les vendeurs restent rattachés, et les commissions déjà dues aussi.
 */
export async function reviewAgent(formData: FormData): Promise<void> {
  const agentId = String(formData.get("agentId") ?? "");
  const decision = formData.get("decision");
  if (decision !== "approve" && decision !== "revoke") return;

  await requireRole("admin");
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ agent_verified_at: decision === "approve" ? new Date().toISOString() : null })
    .eq("id", agentId)
    .eq("role", "agent");

  revalidatePath("/admin/agents");
  revalidatePath("/agent");
}

// ============================================================
// Zones de livraison (vendeur)
// ============================================================

export async function saveDeliveryZone(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = deliveryZoneSchema.safeParse({
    zoneId: (formData.get("zoneId") as string) || undefined,
    zoneName: formData.get("zoneName") ?? "",
    price: formData.get("price") ?? "",
    estimatedDelay: (formData.get("estimatedDelay") as string) || undefined,
    freeAbove: (formData.get("freeAbove") as string) ?? "",
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const shop = await requireShop();
  const supabase = await createClient();

  const valeurs = {
    shop_id: shop.id,
    zone_name: parsed.data.zoneName,
    price: parsed.data.price,
    estimated_delay: parsed.data.estimatedDelay ?? null,
    free_above: parsed.data.freeAbove,
  };

  const { error } = parsed.data.zoneId
    ? await supabase
        .from("delivery_zones")
        .update(valeurs)
        .eq("id", parsed.data.zoneId)
        .eq("shop_id", shop.id)
    : await supabase.from("delivery_zones").insert(valeurs);

  if (error) return { message: "Enregistrement impossible. Réessayez." };

  revalidatePath("/dashboard/livraison");
  return { ok: true, message: "Zone enregistrée." };
}

export async function deleteDeliveryZone(formData: FormData): Promise<void> {
  const zoneId = String(formData.get("zoneId") ?? "");
  const shop = await requireShop();
  const supabase = await createClient();

  // Les commandes qui référencent la zone gardent leur montant : la clé
  // étrangère est en "on delete set null", l'historique n'est pas réécrit.
  await supabase.from("delivery_zones").delete().eq("id", zoneId).eq("shop_id", shop.id);

  revalidatePath("/dashboard/livraison");
}

// ============================================================
// Livreurs partenaires (vendeur)
// ============================================================

export async function saveDeliveryPartner(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = deliveryPartnerSchema.safeParse({
    partnerId: (formData.get("partnerId") as string) || undefined,
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    city: formData.get("city") ?? "",
    vehicleType: formData.get("vehicleType") ?? "moto",
    countryCode: (formData.get("countryCode") as string) || undefined,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const phone = normalizePhone(parsed.data.phone, parsed.data.countryCode);
  if (!phone) return { errors: { phone: "Ce numéro ne semble pas valide." } };

  const shop = await requireShop();
  const supabase = await createClient();

  // Si un compte Watshop existe déjà avec ce numéro, on le rattache : le
  // livreur verra ses courses dans son propre espace. Sinon la fiche reste un
  // simple contact, et le rattachement se fera à sa première connexion.
  const { data: compte } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", phone.replace("+", ""))
    .maybeSingle();

  const valeurs = {
    shop_id: shop.id,
    user_id: compte?.id ?? null,
    name: parsed.data.name,
    whatsapp_number: phone,
    city: parsed.data.city,
    vehicle_type: parsed.data.vehicleType,
  };

  const { error } = parsed.data.partnerId
    ? await supabase
        .from("delivery_partners")
        .update(valeurs)
        .eq("id", parsed.data.partnerId)
        .eq("shop_id", shop.id)
    : await supabase.from("delivery_partners").insert(valeurs);

  if (error) return { message: "Enregistrement impossible. Réessayez." };

  revalidatePath("/dashboard/livraison");
  return { ok: true, message: "Livreur enregistré." };
}

export async function toggleDeliveryPartner(formData: FormData): Promise<void> {
  const partnerId = String(formData.get("partnerId") ?? "");
  const shop = await requireShop();
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("delivery_partners")
    .select("is_active")
    .eq("id", partnerId)
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (!partner) return;

  await supabase
    .from("delivery_partners")
    .update({ is_active: !partner.is_active })
    .eq("id", partnerId)
    .eq("shop_id", shop.id);

  revalidatePath("/dashboard/livraison");
}

// ============================================================
// Affectation d'une commande à un livreur (vendeur)
// ============================================================

export async function assignDeliveryPartner(formData: FormData): Promise<void> {
  const parsed = assignPartnerSchema.safeParse({
    orderId: formData.get("orderId") ?? "",
    partnerId: (formData.get("partnerId") as string) ?? "",
  });

  if (!parsed.success) return;

  const shop = await requireShop();
  const supabase = await createClient();

  await supabase
    .from("orders")
    .update({ delivery_partner_id: parsed.data.partnerId || null })
    .eq("id", parsed.data.orderId)
    .eq("shop_id", shop.id);

  revalidatePath(`/dashboard/commandes/${parsed.data.orderId}`);
  revalidatePath("/livreur");
}

// ============================================================
// Avancement d'une course (livreur)
// ============================================================

export async function updateDeliveryStatus(formData: FormData): Promise<void> {
  const parsed = deliveryStatusSchema.safeParse({
    orderId: formData.get("orderId") ?? "",
    status: formData.get("status") ?? "",
  });

  if (!parsed.success) return;

  await verifySession();
  const supabase = await createClient();

  // Aucun filtre sur le livreur ici : la policy et le trigger s'en chargent,
  // et refuseront la mise à jour d'une commande qui ne lui est pas confiée.
  await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.orderId);

  revalidatePath("/livreur");
  revalidatePath("/dashboard/commandes");
}
