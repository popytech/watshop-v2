import "server-only";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/*
 * Qui a droit à quoi.
 *
 * Une seule fonction décide, et elle lit l'échéance de l'abonnement plutôt que
 * le drapeau `profiles.is_pro`. La nuance compte : le drapeau est posé au
 * paiement mais ne retombe qu'au passage d'une tâche planifiée. S'y fier
 * laisserait un accès Pro ouvert entre l'échéance et ce passage — d'autant plus
 * longtemps qu'aucun ordonnanceur n'est encore branché.
 *
 * L'échéance, elle, est vraie à la seconde près.
 */

export type AccesPro = {
  actif: boolean;
  /** Date de fin, pour l'afficher et prévenir avant l'échéance. */
  finLe: string | null;
  /** Vrai dans les sept jours qui précèdent la fin : de quoi relancer à temps. */
  bientotExpire: boolean;
};

const JOURS_DE_RELANCE = 7;

export const getAccesPro = cache(async (userId: string): Promise<AccesPro> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, is_active, ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data || !data.is_active || data.plan === "free") {
    return { actif: false, finLe: null, bientotExpire: false };
  }

  // Sans échéance, l'abonnement ne s'arrête pas : c'est le cas d'un compte
  // ouvert à la main par un administrateur.
  if (!data.ends_at) return { actif: true, finLe: null, bientotExpire: false };

  const fin = new Date(data.ends_at).getTime();
  const restant = fin - Date.now();

  return {
    actif: restant > 0,
    finLe: data.ends_at,
    bientotExpire: restant > 0 && restant < JOURS_DE_RELANCE * 24 * 60 * 60 * 1000,
  };
});
