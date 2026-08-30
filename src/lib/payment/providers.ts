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

export const PRO_CURRENCY = "GNF";

/**
 * Grille tarifaire, en un seul endroit : la page d'accueil, l'écran
 * d'abonnement et le montant à payer y puisent tous. Un prix changé ici l'est
 * partout.
 *
 * Prix mensuels, en francs guinéens, sans commission sur les ventes — c'est
 * l'argument commercial, et il n'a de valeur que s'il reste vrai.
 */
export const PLANS = [
  {
    id: "free" as const,
    nom: "Gratuit",
    prix: 0,
    accroche: "De quoi ouvrir votre boutique et encaisser vos premières commandes.",
    inclus: [
      "Boutique en ligne à votre nom",
      "Produits et photos illimités",
      "Commandes reçues sur WhatsApp",
      "Zones de livraison et livreurs",
      "Aucune commission sur vos ventes",
    ],
    aVenir: [] as string[],
  },
  {
    id: "pro" as const,
    nom: "Pro",
    prix: 50_000,
    accroche: "Pour les boutiques qui vendent toutes les semaines.",
    // Chaque ligne doit correspondre à quelque chose que le compte reçoit le
    // jour du paiement. Ce n'était le cas d'aucune : la mise en avant n'était
    // jamais activée, le programme revendeurs était ouvert à tous, et « support
    // prioritaire » ne recouvrait aucun mécanisme. Vendre ce qu'on ne livre pas
    // coûte plus cher que de ne pas vendre.
    inclus: [
      "Tout ce que contient l'offre gratuite",
      "Boutique mise en avant dans le marketplace",
      "Programme revendeurs : d'autres vendent pour vous",
      "Votre boutique sans la mention Watshop",
      "Support WhatsApp direct",
      "Statistiques détaillées",
    ],
    aVenir: ["Statistiques détaillées"] as string[],
  },
  {
    id: "business" as const,
    nom: "Business",
    prix: 150_000,
    accroche: "Pour plusieurs points de vente ou une équipe.",
    inclus: [
      "Tout ce que contient l'offre Pro",
      "Plusieurs boutiques sur un même compte",
      "Comptes vendeurs pour votre équipe",
      "Nom de domaine personnalisé",
      "Accompagnement à la mise en place",
    ],
    // Annoncé comme à venir sur la page plutôt que laissé découvrir après
    // paiement : ces trois-là ne sont pas encore construits.
    aVenir: [
      "Plusieurs boutiques sur un même compte",
      "Comptes vendeurs pour votre équipe",
      "Nom de domaine personnalisé",
    ] as string[],
  },
];

/** Formule mise en avant sur la grille. */
export const PLAN_RECOMMANDE = "pro";

export const PRO_PRICE = PLANS.find((plan) => plan.id === "pro")!.prix;

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
