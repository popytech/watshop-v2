import type { PaymentProvider } from "@/lib/supabase/types";

// Module paiement.
//
// Un seul contrat, deux implémentations : le virement Mobile Money déclaré à la
// main (ce qui marche aujourd'hui en Guinée sans aucune intégration), et
// GNAKRYPAY, dont les accès API ne sont pas encore fournis.
//
// Le point important : le passage en Pro ne dépend d'aucun de ces fournisseurs.
// Il est déclenché en base par un trigger, dès qu'une ligne de `payments`
// passe à 'confirmed' — que la confirmation vienne de l'écran admin
// d'aujourd'hui ou du webhook GNAKRYPAY de demain. Brancher l'agrégateur
// consistera donc à écrire une implémentation ici et une route de webhook,
// sans toucher à la logique d'abonnement.

export const PRO_PRICE = 50_000;
export const PRO_CURRENCY = "GNF";

export type ProviderInfo = {
  id: PaymentProvider;
  label: string;
  description: string;
  /** Un fournisseur indisponible est affiché, mais grisé et non sélectionnable. */
  available: boolean;
  unavailableReason?: string;
};

/**
 * Numéro Mobile Money de Watshop, vers lequel les vendeurs transfèrent.
 * Renseigné par `WATSHOP_MOBILE_MONEY_NUMBER` ; à défaut, l'écran le dit au
 * lieu d'afficher un numéro faux.
 */
export function watshopMobileMoneyNumber(): string | null {
  return process.env.WATSHOP_MOBILE_MONEY_NUMBER?.trim() || null;
}

export function listProviders(): ProviderInfo[] {
  return [
    {
      id: "manual",
      label: "Mobile Money",
      description:
        "Vous envoyez le montant sur le numéro Watshop, puis vous déclarez la référence du transfert. Un administrateur confirme sous 24 h.",
      available: watshopMobileMoneyNumber() !== null,
      unavailableReason:
        "Le numéro Mobile Money de Watshop n'est pas encore renseigné (WATSHOP_MOBILE_MONEY_NUMBER).",
    },
    {
      id: "gnakrypay",
      label: "GNAKRYPAY",
      description:
        "Paiement en ligne immédiat, sans déclaration ni attente de confirmation.",
      available: Boolean(process.env.GNAKRYPAY_API_KEY?.trim()),
      unavailableReason:
        "Intégration en attente des accès API. Le schéma et l'abonnement sont déjà prêts à la recevoir.",
    },
  ];
}
