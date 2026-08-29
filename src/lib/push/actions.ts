"use server";

import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

// Abonnement et désabonnement aux notifications, depuis le navigateur du
// vendeur. L'abonnement appartient à l'utilisateur : la policy
// push_tokens_self_all suffit, aucune clé de service ici.

export async function savePushSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
): Promise<{ ok: boolean }> {
  const session = await verifySession();
  const supabase = await createClient();

  // L'endpoint est unique : se réabonner depuis le même appareil met à jour la
  // ligne au lieu d'en créer une seconde.
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: session.userId,
      token: endpoint,
      p256dh,
      auth,
      platform: "web",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );

  return { ok: !error };
}

export async function removePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  await verifySession();
  const supabase = await createClient();

  const { error } = await supabase.from("push_tokens").delete().eq("token", endpoint);
  return { ok: !error };
}
