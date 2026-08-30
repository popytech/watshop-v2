import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerRappels } from "@/lib/payment/reminders";

/*
 * Tâche quotidienne des abonnements.
 *
 * Deux choses, dans cet ordre : les rappels dus, puis la fermeture de ce qui a
 * dépassé le délai de grâce. Envoyer avant de fermer garantit que le dernier
 * rappel part toujours avant la coupure — l'inverse fermerait le compte le
 * matin et le préviendrait l'après-midi.
 *
 * Pourquoi une route et non pg_cron : la base sait fermer un abonnement, elle
 * ne sait pas envoyer un message WhatsApp ni une notification. Tout tient donc
 * ici, en un seul endroit, plutôt qu'à moitié dans Postgres et à moitié
 * ailleurs.
 *
 * Déclenchée par le planificateur de Vercel (voir vercel.json). L'appel est
 * public par nature : il est protégé par un secret partagé, sans quoi n'importe
 * qui pourrait déclencher les envois en boucle et faire bannir notre compte
 * WhatsApp.
 */

export const maxDuration = 60;

function autorise(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  // Sans secret configuré, la route reste fermée. Un défaut ouvert serait pire
  // qu'une tâche qui ne tourne pas : on s'en apercevrait trop tard.
  if (!secret) return false;

  const entete = request.headers.get("authorization");
  return entete === `Bearer ${secret}`;
}

async function executer() {
  const rappels = await envoyerRappels();

  const admin = createAdminClient();
  const { data: fermes } = await admin.rpc("expire_subscriptions");

  return { ...rappels, fermes: fermes ?? 0 };
}

export async function GET(request: Request) {
  if (!autorise(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    return NextResponse.json({ ok: true, ...(await executer()) });
  } catch (erreur) {
    // Le détail part dans les journaux, pas dans la réponse : elle est publique.
    console.error("[cron abonnements]", erreur);
    return NextResponse.json({ error: "Échec de la tâche" }, { status: 500 });
  }
}

// Le planificateur de Vercel appelle en GET ; POST est accepté pour pouvoir
// déclencher la tâche à la main, avec le même secret.
export const POST = GET;
