import "server-only";
import webpush from "web-push";

import { createAdminClient } from "@/lib/supabase/admin";

// Envoi de notifications Web Push.
//
// Le ROADMAP prévoyait Firebase Cloud Messaging. On s'en passe : le Web Push
// standard (VAPID) fait la même chose sans compte tiers, sans SDK côté client
// et sans clé de service à gérer — une paire de clés générée une fois suffit.
// Un compte Firebase de moins à administrer, et une dépendance de moins.

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

function configure(): boolean {
  const publique = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privee = process.env.VAPID_PRIVATE_KEY;
  const sujet = process.env.VAPID_SUBJECT ?? "mailto:contact@watshop.africa";

  if (!publique || !privee) return false;

  webpush.setVapidDetails(sujet, publique, privee);
  return true;
}

export type PushResult = { sent: number; removed: number; failed: number };

/**
 * Envoie une notification aux abonnements des utilisateurs donnés.
 *
 * Les abonnements que le navigateur rejette définitivement (404/410) sont
 * supprimés au passage : sans ce ménage, la table se remplit d'appareils
 * désinstallés et chaque diffusion devient plus lente pour rien.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<PushResult> {
  if (userIds.length === 0 || !configure()) return { sent: 0, removed: 0, failed: 0 };

  const admin = createAdminClient();
  const { data: abonnements } = await admin
    .from("push_tokens")
    .select("id, token, p256dh, auth")
    .in("user_id", userIds);

  if (!abonnements?.length) return { sent: 0, removed: 0, failed: 0 };

  const corps = JSON.stringify(payload);
  const aSupprimer: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const abonnement of abonnements) {
    if (!abonnement.p256dh || !abonnement.auth) {
      aSupprimer.push(abonnement.id);
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: abonnement.token,
          keys: { p256dh: abonnement.p256dh, auth: abonnement.auth },
        },
        corps,
      );
      sent += 1;
    } catch (error) {
      const statut = (error as { statusCode?: number }).statusCode;
      if (statut === 404 || statut === 410) aSupprimer.push(abonnement.id);
      else failed += 1;
    }
  }

  if (aSupprimer.length > 0) {
    await admin.from("push_tokens").delete().in("id", aSupprimer);
  }

  return { sent, removed: aSupprimer.length, failed };
}
