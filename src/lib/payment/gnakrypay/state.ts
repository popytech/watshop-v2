/**
 * État du formulaire de paiement GNAKRYPAY.
 *
 * Dans son propre module : un fichier « use server » ne peut exporter que des
 * fonctions asynchrones, et l'objet initial d'un `useActionState` n'en est pas
 * une. Même règle que shop/state.ts et order/state.ts.
 */
export type PaiementState = {
  message: string | null;
  ok: boolean;
  /** Renseignée quand la passerelle demande de finir sur une page hébergée. */
  paiementUrl?: string | null;
};

export const initialPaiementState: PaiementState = { message: null, ok: false };
