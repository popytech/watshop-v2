import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  estAbouti,
  estPerdu,
  verifierSignatureWebhook,
  type StatutPasserelle,
} from "@/lib/payment/gnakrypay/client";

/*
 * Retour de la passerelle GNAKRYPAY.
 *
 * Appelé de serveur à serveur, sans cookie : l'authenticité tient à la seule
 * signature de l'en-tête `X-Webhook-Signature`. C'est aussi pourquoi le corps
 * est lu en texte brut — un `await request.json()` suivi d'un ré-encodage
 * changerait les espaces et l'ordre des clés, et la signature ne
 * correspondrait plus.
 *
 * La suite est déjà en base : passer une ligne de `payments` à `confirmed`
 * déclenche `apply_confirmed_payment`, qui prolonge l'abonnement, pose le
 * drapeau Pro et met la boutique en avant. Cette route n'a donc qu'un statut à
 * écrire — et c'est très bien ainsi : le jour où l'écran admin, cette route ou
 * un autre chemin confirment un paiement, l'abonnement suit de la même façon.
 */

type Evenement = {
  eventType?: string;
  eventId?: string;
  data?: {
    transactionId?: string;
    status?: StatutPasserelle;
    paidAmount?: number;
    currency?: string;
    merchantPaymentReference?: string;
    providerReference?: string;
  };
};

/** Toujours 200 après vérification : un 500 ferait rejouer l'événement en boucle. */
const RECU = NextResponse.json({ received: true });

export async function POST(request: Request) {
  const brut = await request.text();

  if (!verifierSignatureWebhook(brut, request.headers.get("X-Webhook-Signature"))) {
    // 401 volontaire : la passerelle doit savoir que l'appel a été refusé, et
    // nous voulons le voir dans ses journaux si une clé est mal configurée.
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let evenement: Evenement;
  try {
    evenement = JSON.parse(brut) as Evenement;
  } catch {
    return NextResponse.json({ error: "Corps illisible" }, { status: 400 });
  }

  const donnees = evenement.data;
  const notreReference = donnees?.merchantPaymentReference;
  const statut = donnees?.status;

  // Sans notre propre référence, rien à rapprocher : on accuse réception pour
  // que la passerelle cesse de réessayer, et on s'arrête là.
  if (!notreReference || !statut) return RECU;

  const supabase = createAdminClient();

  const { data: paiement } = await supabase
    .from("payments")
    .select("id, amount, status")
    .eq("id", notreReference)
    .maybeSingle();

  if (!paiement) return RECU;

  // Déjà traité : les webhooks sont réémis, et confirmer deux fois
  // prolongerait l'abonnement deux fois.
  if (paiement.status === "confirmed") return RECU;

  if (estAbouti(statut)) {
    // Le montant est revérifié contre le nôtre. La signature prouve que
    // l'événement vient bien de la passerelle, pas que la somme est celle
    // attendue : un paiement partiel ne doit pas ouvrir un mois d'abonnement.
    if ((donnees.paidAmount ?? 0) < paiement.amount) {
      await supabase.from("payments").update({ status: "rejected" }).eq("id", paiement.id);
      return RECU;
    }

    await supabase
      .from("payments")
      .update({
        status: "confirmed",
        reference: donnees.providerReference ?? donnees.transactionId ?? null,
      })
      .eq("id", paiement.id);

    return RECU;
  }

  if (estPerdu(statut)) {
    await supabase.from("payments").update({ status: "rejected" }).eq("id", paiement.id);
  }

  // Les états intermédiaires (CREATED, PENDING, AUTHORIZED) ne changent rien :
  // la ligne est déjà en attente.
  return RECU;
}
