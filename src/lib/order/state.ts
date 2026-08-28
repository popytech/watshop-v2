// État renvoyé par l'action de commande au formulaire. Dans son propre module :
// un fichier "use server" ne peut exporter que des fonctions asynchrones.

export type CheckoutState = {
  message?: string;
  errors?: Record<string, string>;
};

export const initialCheckoutState: CheckoutState = {};
