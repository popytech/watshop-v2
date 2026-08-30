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
/**
 * Ce que l'offre gratuite laisse faire.
 *
 * Elle contenait tout le produit : boutique complète, produits et photos
 * illimités. Une offre gratuite qui suffit n'a aucune raison de devenir
 * payante, et c'est ce qui manquait pour que l'abonnement existe autrement que
 * sur la grille tarifaire.
 *
 * Le curseur est placé là où il ne gêne pas celui qui essaie, et se fait sentir
 * dès que le commerce tourne : dix articles laissent largement de quoi ouvrir
 * une boutique et encaisser ses premières commandes ; une seule photo suffit à
 * présenter un article, mais quatre le vendent mieux.
 *
 * Ce qui n'est PAS limité, et ne doit pas l'être : les commandes, les
 * visiteurs, les livreurs. Brider les ventes d'un commerçant, c'est brider son
 * revenu — et notre argument reste « aucune commission sur vos ventes ».
 *
 * Deux nombres à changer si le curseur est mal placé, et rien d'autre.
 */
export const LIMITES_GRATUIT = {
  produits: 10,
  photosParProduit: 1,
  /**
   * Ce qui reste en vitrine quand un abonnement Pro arrive à échéance.
   *
   * Moins que les dix d'un compte gratuit, et c'est voulu : un vendeur qui a
   * publié cinquante articles doit sentir ce qu'il perd, sans rien perdre pour
   * de bon. Le catalogue est masqué, jamais supprimé, et le réabonnement le
   * rallume en entier.
   *
   * La valeur vit aussi en base — `produits_visibles_gratuit()`, migration
   * 0013 — parce que c'est la RLS qui applique la règle. Les deux doivent
   * changer ensemble.
   */
  produitsApresExpiration: 7,
};

/** Le plafond de photos reste celui du stockage, quelle que soit la formule. */
export const PHOTOS_MAX_PRO = 4;

export const PLANS = [
  {
    id: "free" as const,
    nom: "Gratuit",
    prix: 0,
    accroche: "De quoi ouvrir votre boutique et encaisser vos premières commandes.",
    inclus: [
      "Boutique en ligne à votre nom",
      `Jusqu'à ${LIMITES_GRATUIT.produits} produits`,
      `${LIMITES_GRATUIT.photosParProduit} photo par produit`,
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
      "Produits illimités",
      `Jusqu'à ${PHOTOS_MAX_PRO} photos par produit`,
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
    accroche: "Pour importer, approvisionner et vendre à plusieurs.",
    // Les deux premières lignes ne sont pas des fonctionnalités de
    // l'application : ce sont des services rendus par l'équipe Watshop. Elles
    // ne figurent donc pas dans `aVenir` — un abonné Business y a droit dès le
    // premier jour, et c'est à nous de tenir, pas au code.
    inclus: [
      "Tout ce que contient l'offre Pro",
      "Mise en relation avec des fournisseurs en Chine",
      "Transitaires partenaires et suivi de vos colis",
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
