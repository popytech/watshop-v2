"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, verifySession } from "@/lib/dal";
import { fieldErrors, normalizePhone, paymentDeclarationSchema } from "@/lib/network/schemas";
import { watshopMobileMoneyNumber } from "@/lib/payment/providers";
import { deviseDuPays } from "@/lib/payment/pricing";
import type { FormState } from "@/lib/shop/state";

/**
 * Le vendeur déclare le transfert Mobile Money qu'il vient de faire.
 *
 * Il n'accorde rien : la ligne est créée en 'pending'. Le passage en Pro est
 * déclenché en base quand un administrateur la confirme — un trigger refuse
 * qu'un utilisateur change lui-même le statut ou le montant.
 */
export async function declarePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = paymentDeclarationSchema.safeParse({
    amount: formData.get("amount") ?? "",
    reference: formData.get("reference") ?? "",
    payerPhone: formData.get("payerPhone") ?? "",
    countryCode: (formData.get("countryCode") as string) || undefined,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (!watshopMobileMoneyNumber()) {
    return { message: "Le paiement Mobile Money n'est pas encore ouvert." };
  }

  const phone = normalizePhone(parsed.data.payerPhone, parsed.data.countryCode);
  if (!phone) return { errors: { payerPhone: "Ce numéro ne semble pas valide." } };

  const session = await verifySession();
  const supabase = await createClient();

  // La devise suit le pays de la boutique. Le montant, lui, est celui que le
  // vendeur déclare avoir envoyé : c'est un virement déjà fait, pas un prix
  // qu'on lui impose — un administrateur le confrontera au relevé.
  const { data: boutique } = await supabase
    .from("shops")
    .select("country_code")
    .eq("user_id", session.userId)
    .maybeSingle();

  const devise = deviseDuPays(boutique?.country_code);

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", session.userId)
    .maybeSingle();

  const { error } = await supabase.from("payments").insert({
    user_id: session.userId,
    subscription_id: subscription?.id ?? null,
    provider: "manual",
    amount: parsed.data.amount,
    currency: devise,
    reference: parsed.data.reference,
    payer_phone: phone,
  });

  if (error) return { message: "Déclaration impossible. Réessayez." };

  revalidatePath("/dashboard/abonnement");
  return {
    ok: true,
    message: "Déclaration enregistrée. Un administrateur la confirme sous 24 h.",
  };
}

/**
 * Confirmation ou rejet par un administrateur.
 *
 * L'effet sur l'abonnement n'est pas écrit ici : le trigger
 * `payments_apply_confirmed` s'en charge en base. Un futur webhook GNAKRYPAY
 * produira donc exactement le même résultat sans repasser par ce code.
 */
export async function reviewPayment(formData: FormData): Promise<void> {
  const paymentId = String(formData.get("paymentId") ?? "");
  const decision = formData.get("decision");
  if (decision !== "confirmed" && decision !== "rejected") return;

  await requireRole("admin");
  const supabase = await createClient();

  await supabase.from("payments").update({ status: decision }).eq("id", paymentId);

  revalidatePath("/admin/paiements");
  revalidatePath("/admin");
}
