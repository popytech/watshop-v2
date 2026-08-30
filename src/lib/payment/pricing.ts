import { COUNTRIES } from "@/lib/phone";

/*
 * Le prix de l'abonnement, par pays.
 *
 * Watshop sert six pays et facturait tout le monde en francs guinéens. Un
 * vendeur sénégalais lisait « 50 000 GNF » — soit environ 3 400 FCFA — et son
 * opérateur Mobile Money, qui ne connaît que le franc CFA, n'aurait de toute
 * façon pas su débiter ce montant.
 *
 * Les prix ci-dessous ne sont pas une conversion calculée à la volée : un tarif
 * qui bouge avec le cours du jour est impossible à annoncer et impossible à
 * comparer. Ce sont des montants ronds, arrêtés une fois, à réviser à la main.
 */

/** Devise d'un pays, telle que la connaissent les opérateurs Mobile Money. */
const DEVISE_PAR_PAYS: Record<string, string> = {
  GN: "GNF", // franc guinéen
  SN: "FCFA", // franc CFA (UEMOA)
  ML: "FCFA",
  CI: "FCFA",
  SL: "SLE", // leone sierra-léonais
  LR: "LRD", // dollar libérien
};

/**
 * Grille mensuelle, par devise.
 *
 * Les montants FCFA, SLE et LRD sont partis d'une conversion approximative des
 * prix guinéens, puis arrondis à un chiffre qui se dit et se retient. Ils sont
 * à confirmer par Watshop : je peux convertir, je ne peux pas décider d'un
 * positionnement commercial dans un pays que je ne connais pas.
 */
export const TARIFS: Record<string, { pro: number; business: number }> = {
  GNF: { pro: 50_000, business: 150_000 },
  FCFA: { pro: 3_500, business: 10_000 },
  SLE: { pro: 150, business: 450 },
  LRD: { pro: 1_200, business: 3_500 },
};

/** Devise de référence, celle de la page d'accueil et des comptes sans pays. */
export const DEVISE_PAR_DEFAUT = "GNF";

export function deviseDuPays(codePays: string | null | undefined): string {
  return (codePays && DEVISE_PAR_PAYS[codePays]) || DEVISE_PAR_DEFAUT;
}

export function tarifPro(devise: string): number {
  return (TARIFS[devise] ?? TARIFS[DEVISE_PAR_DEFAUT]).pro;
}

export function tarifBusiness(devise: string): number {
  return (TARIFS[devise] ?? TARIFS[DEVISE_PAR_DEFAUT]).business;
}

/**
 * Devises que la passerelle sait encaisser.
 *
 * Sa documentation n'en déclare que quatre — GNF, FCFA, Dollar, Leones — et le
 * dollar libérien n'en fait pas partie. Un vendeur du Liberia ne peut donc pas
 * payer en ligne aujourd'hui : il lui reste la déclaration Mobile Money manuelle,
 * et l'écran d'abonnement le lui dit plutôt que de lui présenter un bouton qui
 * échouera.
 */
const DEVISES_ENCAISSABLES = new Set(["GNF", "FCFA", "SLE"]);

export function passerellePeutEncaisser(devise: string): boolean {
  return DEVISES_ENCAISSABLES.has(devise);
}

/** Pays couverts, pour les textes qui les énumèrent. */
export const PAYS_SERVIS = COUNTRIES.map((pays) => pays.name);
