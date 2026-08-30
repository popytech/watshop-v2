"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/network/schemas";
import { PRO_CURRENCY, PRO_PRICE } from "@/lib/payment/providers";
import { demanderPaiement, estConfiguree, METHODES } from "@/lib/payment/gnakrypay/client";
import { getSiteUrl } from "@/lib/site-url";
import type { PaiementState } from "@/lib/payment/gnakrypay/state";

const schema = z.object({
  methode: z.enum(METHODES.map((m) => m.id) as [string, ...string[]], {
    message: "Choisissez un moyen de paiement.",
  }),
  telephone: z.string().trim().min(6, "Numéro trop court."),
  countryCode: z.string().trim().optional(),
});

/**
 * Lance un paiement GNAKRYPAY pour l'abonnement Pro.
 *
 * Le montant n'est pas lu dans le formulaire mais dans la grille tarifaire :
 * un prix qui vient du navigateur est un prix que l'acheteur choisit.
 *
 * La ligne de `payments` est créée **avant** l'appel à la passerelle, en
 * 'pending'. C'est son identifiant qui part comme référence marchand : le
 * webhook peut ainsi retrouver la ligne même s'il arrive avant que la réponse
 * de la passerelle ne nous soit revenue — ce qui se produit sur les paiements
 * validés en quelques secondes.
 */
export async function lancerPaiement(
  _prev: PaiementState,
  formData: FormData,
): Promise<PaiementState> {
  if (!estConfiguree()) {
    return { message: "Le paiement en ligne n'est pas encore ouvert.", ok: false };
  }

  const parsed = schema.safeParse({
    methode: formData.get("methode"),
    telephone: formData.get("telephone"),
    countryCode: (formData.get("countryCode") as string) || undefined,
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Vérifiez le formulaire.", ok: false };
  }

  // La Guinée par défaut : c'est le pays de la quasi-totalité de nos vendeurs,
  // et le sélecteur du formulaire le propose de toute façon en premier.
  const pays = parsed.data.countryCode ?? "GN";
  const telephone = normalizePhone(parsed.data.telephone, pays);
  if (!telephone) return { message: "Ce numéro ne semble pas valide.", ok: false };

  const session = await verifySession();
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", session.userId)
    .maybeSingle();

  // Insertion avec la clé de service : le déclencheur qui protège le statut
  // laisse passer les écritures serveur, et la ligne naît de toute façon en
  // 'pending' — elle n'accorde rien.
  const admin = createAdminClient();
  const { data: paiement, error } = await admin
    .from("payments")
    .insert({
      user_id: session.userId,
      subscription_id: subscription?.id ?? null,
      provider: "gnakrypay",
      amount: PRO_PRICE,
      currency: PRO_CURRENCY,
      payer_phone: telephone,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !paiement) {
    return { message: "Impossible d'ouvrir le paiement. Réessayez.", ok: false };
  }

  const siteUrl = await getSiteUrl();

  try {
    const cree = await demanderPaiement({
      montant: PRO_PRICE,
      // La passerelle attend le numéro sans le « + ».
      telephone: telephone.replace(/^\+/, ""),
      methode: parsed.data.methode as (typeof METHODES)[number]["id"],
      reference: paiement.id,
      description: "Abonnement Watshop Pro",
      paysISO2: pays,
      retourUrl: `${siteUrl}/dashboard/abonnement`,
      annulationUrl: `${siteUrl}/dashboard/abonnement`,
    });

    revalidatePath("/dashboard/abonnement");

    return {
      ok: true,
      message:
        "Demande envoyée. Validez le paiement sur votre téléphone : votre abonnement s'active tout seul dès la confirmation.",
      paiementUrl: cree.paymentUrl,
    };
  } catch {
    // La ligne créée plus haut resterait en attente pour rien : on la ferme,
    // sinon l'écran afficherait un paiement qui n'a jamais existé.
    await admin.from("payments").update({ status: "rejected" }).eq("id", paiement.id);
    return { message: "Le paiement n'a pas pu être lancé. Réessayez dans un instant.", ok: false };
  }
}
