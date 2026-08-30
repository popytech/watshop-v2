import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/fonnte";
import { sendPushToUsers } from "@/lib/push/send";
import { formatMoney } from "@/lib/format";
import { PRO_CURRENCY, PRO_PRICE, LIMITES_GRATUIT } from "@/lib/payment/providers";
import { getSiteUrl } from "@/lib/site-url";

/*
 * Rappels de réabonnement.
 *
 * Cinq messages avant la coupure, puis trois jours de grâce pendant lesquels
 * l'accès continue. Un commerçant qui perd sa vitrine sans avoir été prévenu ne
 * se réabonne pas : il s'en va, et il le raconte.
 *
 * Les paliers sont exprimés en jours par rapport à `ends_at`, la fin de la
 * période payée. Négatif = avant l'échéance, positif = pendant la grâce.
 *
 * Le ton se resserre à mesure : on informe, puis on rappelle, puis on avertit.
 * Le dernier message dit ce qui va concrètement disparaître, parce que c'est
 * cela qui décide — pas le mot « expiration ».
 */

const JOURS_DE_GRACE = 3;

export type Palier = {
  /** Jours par rapport à l'échéance. */
  jours: number;
  titre: string;
  /** `restants` = jours avant la coupure effective. */
  message: (params: { boutique: string; restants: number; url: string }) => string;
};

export const PALIERS: Palier[] = [
  {
    jours: -7,
    titre: "Votre abonnement Pro se termine dans une semaine",
    message: ({ boutique, url }) =>
      `Bonjour ! L'abonnement Pro de ${boutique} se termine dans 7 jours.\n\n` +
      `Renouvelez pour ${formatMoney(PRO_PRICE, PRO_CURRENCY)} et gardez vos produits illimités, ` +
      `votre mise en avant et votre programme revendeurs.\n\n${url}`,
  },
  {
    jours: -3,
    titre: "Plus que 3 jours d'abonnement Pro",
    message: ({ boutique, url }) =>
      `L'abonnement Pro de ${boutique} se termine dans 3 jours.\n\n` +
      `Un renouvellement prend deux minutes depuis votre espace : ${url}`,
  },
  {
    jours: -1,
    titre: "Votre abonnement Pro se termine demain",
    message: ({ boutique, url }) =>
      `L'abonnement Pro de ${boutique} se termine demain.\n\n` +
      `Après cette date vous gardez ${JOURS_DE_GRACE} jours pour renouveler sans rien perdre.\n\n${url}`,
  },
  {
    jours: 0,
    titre: "Votre abonnement Pro se termine aujourd'hui",
    message: ({ boutique, restants, url }) =>
      `L'abonnement Pro de ${boutique} se termine aujourd'hui.\n\n` +
      `Votre boutique reste complète pendant encore ${restants} jours. ` +
      `Passé ce délai, seuls ${LIMITES_GRATUIT.produitsApresExpiration} produits resteront visibles ` +
      `— les autres seront masqués, pas supprimés.\n\n${url}`,
  },
  {
    jours: 2,
    titre: "Dernier rappel avant la coupure",
    message: ({ boutique, restants, url }) =>
      `Dernier rappel : sans renouvellement, ${boutique} repasse en offre gratuite ` +
      `${restants <= 1 ? "demain" : `dans ${restants} jours`}.\n\n` +
      `Il ne restera que ${LIMITES_GRATUIT.produitsApresExpiration} produits en vitrine, ` +
      `votre boutique perdra sa mise en avant et le programme revendeurs sera suspendu. ` +
      `Rien n'est supprimé : tout revient au réabonnement.\n\n${url}`,
  },
];

/** Combien de jours séparent deux dates, en jours pleins. */
function ecartEnJours(de: Date, a: Date): number {
  return Math.round((a.getTime() - de.getTime()) / 86_400_000);
}

export type Bilan = {
  examines: number;
  envoyes: number;
  echecs: number;
  fermes: number;
};

/**
 * Passe en revue les abonnements et envoie le rappel dû, le cas échéant.
 *
 * Idempotent par construction : chaque envoi est tracé sur le triplet
 * (compte, palier, échéance visée), et la contrainte d'unicité de la table
 * refuse le doublon. La tâche peut donc tourner plusieurs fois par jour, ou
 * rattraper un jour manqué, sans jamais renvoyer deux fois le même message.
 *
 * L'échéance fait partie de la clé : au réabonnement suivant, une nouvelle
 * `ends_at` permet de rejouer toute la série sans rien purger.
 */
export async function envoyerRappels(): Promise<Bilan> {
  const admin = createAdminClient();
  const siteUrl = await getSiteUrl();
  const url = `${siteUrl}/dashboard/abonnement`;

  const bilan: Bilan = { examines: 0, envoyes: 0, echecs: 0, fermes: 0 };

  // Seuls les abonnements payants encore ouverts et datés nous intéressent.
  const { data: abonnements } = await admin
    .from("subscriptions")
    .select("user_id, ends_at")
    .eq("is_active", true)
    .neq("plan", "free")
    .not("ends_at", "is", null);

  if (!abonnements?.length) return bilan;

  const maintenant = new Date();

  for (const abonnement of abonnements) {
    bilan.examines += 1;

    const fin = new Date(abonnement.ends_at as string);
    const ecart = ecartEnJours(maintenant, fin); // > 0 : l'échéance est devant

    // Le palier dû est le plus avancé qui soit franchi. Prendre le plus avancé
    // plutôt que le premier rattrape une journée manquée sans envoyer la série
    // entière d'un coup.
    const palier = [...PALIERS].reverse().find((p) => -ecart >= p.jours);
    if (!palier) continue;

    const { data: shop } = await admin
      .from("shops")
      .select("name, whatsapp_number")
      .eq("user_id", abonnement.user_id)
      .maybeSingle();

    if (!shop) continue;

    const restants = JOURS_DE_GRACE + ecart; // jours avant la coupure réelle
    const texte = palier.message({ boutique: shop.name, restants: Math.max(restants, 0), url });
    const canaux: string[] = [];

    // La trace est écrite d'abord : si deux exécutions se chevauchent, la
    // seconde bute sur la contrainte d'unicité et n'envoie rien. L'inverse —
    // envoyer puis tracer — laisserait passer un doublon.
    const { error: dejaEnvoye } = await admin.from("subscription_reminders").insert({
      user_id: abonnement.user_id,
      palier: palier.jours,
      ends_at: abonnement.ends_at,
      channels: [],
    });

    if (dejaEnvoye) continue; // déjà parti, ou course perdue : les deux se taisent

    if (shop.whatsapp_number) {
      const envoi = await sendWhatsAppMessage(shop.whatsapp_number, texte);
      if (envoi.ok) canaux.push("whatsapp");
      else bilan.echecs += 1;
    }

    const push = await sendPushToUsers([abonnement.user_id], {
      title: palier.titre,
      body: `${shop.name} — ${formatMoney(PRO_PRICE, PRO_CURRENCY)} pour renouveler`,
      url: "/dashboard/abonnement",
    });
    if (push.sent > 0) canaux.push("push");

    await admin
      .from("subscription_reminders")
      .update({ channels: canaux })
      .eq("user_id", abonnement.user_id)
      .eq("palier", palier.jours)
      .eq("ends_at", abonnement.ends_at);

    if (canaux.length > 0) bilan.envoyes += 1;
  }

  return bilan;
}
