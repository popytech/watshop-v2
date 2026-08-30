/**
 * État du formulaire d'infolettre.
 *
 * Dans son propre fichier, et non à côté de l'action : un module marqué
 * `"use server"` ne peut exporter que des fonctions asynchrones. Y laisser cet
 * objet faisait échouer l'action à l'exécution — « A "use server" file can only
 * export async functions, found object » — avec une erreur 500 et aucune
 * inscription enregistrée.
 *
 * C'est la convention déjà suivie ailleurs dans le projet (voir
 * src/lib/shop/state.ts).
 */
export type NewsletterState = { message: string | null; ok: boolean };

export const initialNewsletterState: NewsletterState = { message: null, ok: false };
