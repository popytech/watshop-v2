"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/network/schemas";
import { DUREES, deviseDuPays, dureeValide, montantPour } from "@/lib/payment/pricing";
import { demanderPaiement, estConfiguree, METHODES } from "@/lib/payment/gnakrypay/client";
import { getSiteUrl } from "@/lib/site-url";
import type { PaiementState } from "@/lib/payment/gnakrypay/state";

const schema = z.object({
  methode: z.enum(METHODES.map((m) => m.id) as [string, ...string[]], {
    message: "Choisissez un moyen de paiement.",
  }),
  telephone: z.string().trim().min(6, "Numéro trop court."),
  // La durée vient du formulaire mais n'est jamais crue sur parole : elle est
  // confrontée à la liste des durées offertes, et le montant en est déduit
  // côté serveur. Un prix qui vient du navigateur est un prix que l'acheteur
  // choisit.
  mois: z.coerce.number().int().refine((m) => DUREES.some((d) => d.mois === m), {
    message: "Durée inconnue.",
  }),
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
    mois: formData.get("mois") ?? 1,
    countryCode: (formData.get("countryCode") as string) || undefined,
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Vérifiez le formulaire.", ok: false };
  }

  // La Guinée par défaut : c'est le pays de la quasi-totalité de nos vendeurs,
  // et le sélecteur du formulaire le propose de toute façon en premier.
  const pays = parsed.data.countryCode ?? "GN";

  // Le prix suit le pays du vendeur : son opérateur Mobile Money ne sait pas
  // débiter une devise étrangère, et un montant affiché dans une monnaie
  // qu'on ne manipule pas ne veut rien dire.
  const devise = deviseDuPays(pays);
  const duree = dureeValide(parsed.data.mois);
  const montant = montantPour(devise, duree.mois);
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
      amount: montant,
      currency: devise,
      payer_phone: telephone,
      // La durée voyage avec le paiement : la période est accordée à la
      // confirmation, qui peut survenir des jours plus tard par le webhook.
      // Rien d'autre ne se souviendrait alors de ce qui a été acheté.
      months: duree.mois,
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
      montant,
      // La passerelle attend le numéro sans le « + ».
      telephone: telephone.replace(/^\+/, ""),
      methode: parsed.data.methode as (typeof METHODES)[number]["id"],
      reference: paiement.id,
      description: `Abonnement Watshop Pro — ${duree.libelle}`,
      paysISO2: pays,
      retourUrl: `${siteUrl}/dashboard/abonnement`,
      annulationUrl: `${siteUrl}/dashboard/abonnement`,
    });

    revalidatePath("/dashboard/abonnement");

    return {
      ok: true,
      message:
        `Demande envoyée. Validez le paiement sur votre téléphone : vos ${duree.libelle} s'activent tout seuls dès la confirmation.`,
      paiementUrl: cree.paymentUrl,
    };
  } catch (erreur) {
    // Le détail part dans les journaux du serveur et jamais à l'écran : il peut
    // contenir la réponse brute de la passerelle. Sans cette trace, un échec
    // ne laissait qu'un message poli et rien à diagnostiquer.
    console.error("[gnakrypay] paiement non lancé :", erreur);

    // La ligne créée plus haut resterait en attente pour rien : on la ferme,
    // sinon l'écran afficherait un paiement qui n'a jamais existé.
    await admin.from("payments").update({ status: "rejected" }).eq("id", paiement.id);
    return { message: "Le paiement n'a pas pu être lancé. Réessayez dans un instant.", ok: false };
  }
}
