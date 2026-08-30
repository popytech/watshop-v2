"use server";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

export type NewsletterState = { message: string | null; ok: boolean };

export const initialNewsletterState: NewsletterState = { message: null, ok: false };

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  // La case à cocher : le consentement est explicite, jamais présumé.
  consent: z.literal("on", { message: "Cochez la case pour vous inscrire." }),
  // Champ leurre, invisible à l'écran. Un humain ne le remplit jamais ; les
  // robots remplissent tout ce qu'ils trouvent.
  website: z.string().max(0).optional(),
});

/**
 * Inscription à l'infolettre.
 *
 * L'écriture passe par la clé de service et non par le client anonyme : la
 * table n'a aucune policy publique, sans quoi n'importe qui pourrait la remplir
 * depuis la console du navigateur, et une policy de lecture exposerait les
 * adresses de tous les inscrits.
 *
 * Une adresse déjà inscrite ne produit pas d'erreur. Répondre « vous êtes déjà
 * inscrit » transformerait ce formulaire en moyen de vérifier si une adresse
 * donnée est dans notre base — ce qui ne regarde pas celui qui la teste.
 */
export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    consent: formData.get("consent"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Vérifiez le formulaire." };
  }

  // Le leurre est rempli : on répond comme si tout allait bien, sans rien
  // écrire. Un robot à qui l'on dit non recommence.
  if (parsed.data.website) return { ok: true, message: "Merci, c'est noté." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      { email: parsed.data.email, source: "footer", unsubscribed_at: null },
      { onConflict: "email" },
    );

  if (error) {
    return { ok: false, message: "Inscription impossible pour le moment. Réessayez." };
  }

  return { ok: true, message: "Merci, c'est noté. Vous serez prévenu des nouveautés." };
}
