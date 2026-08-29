// Code revendeur porté par un lien d'affiliation (?ref=RV123456).
//
// Il est mémorisé dans le navigateur de l'acheteur, par boutique : sans ça, un
// visiteur qui arrive par le lien d'un revendeur puis navigue dans la boutique
// avant de commander ferait perdre sa commission au revendeur.
//
// La durée est volontairement courte. Une attribution de plusieurs semaines
// reviendrait à payer un revendeur pour une vente qu'il n'a pas provoquée.

const PREFIX = "watshop:ref:";
const DUREE_MS = 7 * 24 * 60 * 60 * 1000;

type Stocke = { code: string; at: number };

export function rememberAffiliateRef(shopSlug: string, code: string): void {
  try {
    const valeur: Stocke = { code: code.toUpperCase(), at: Date.now() };
    window.localStorage.setItem(PREFIX + shopSlug, JSON.stringify(valeur));
  } catch {
    // Navigation privée ou stockage bloqué : la commission ne sera pas
    // attribuée, mais la commande passe normalement.
  }
}

export function readAffiliateRef(shopSlug: string): string | null {
  try {
    const brut = window.localStorage.getItem(PREFIX + shopSlug);
    if (!brut) return null;

    const valeur = JSON.parse(brut) as Stocke;
    if (!valeur?.code || Date.now() - valeur.at > DUREE_MS) return null;

    return valeur.code;
  } catch {
    return null;
  }
}
