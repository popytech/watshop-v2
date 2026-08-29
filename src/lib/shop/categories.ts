import { slugify } from "@/lib/tenant";

/**
 * Catégories de boutique.
 *
 * Choisies à l'étape 2 de l'onboarding et stockées telles quelles dans
 * `shops.category`. Elles servent aussi de filtre au marketplace, d'où leur
 * sortie du formulaire d'onboarding où elles vivaient : deux listes qui
 * divergent, et un filtre ne trouve plus rien.
 *
 * À ne pas confondre avec la table `categories`, prévue pour classer les
 * produits un par un. Elle est vide et aucun écran ne l'alimente : le
 * marketplace classe donc un produit par la catégorie de sa boutique.
 */
export const SHOP_CATEGORIES = [
  "Mode & vêtements",
  "Beauté & cosmétiques",
  "Alimentation",
  "Électronique",
  "Maison & décoration",
  "Enfants & bébé",
  "Services",
  "Autre",
] as const;

/**
 * Forme utilisée dans l'URL : `?categorie=mode-vetements`.
 *
 * Le libellé lui-même y serait illisible une fois encodé (`Mode%20%26%20v%C3%AAtements`),
 * et un `&` dans une valeur de query string est un piège inutile.
 */
export function categorySlug(label: string): string {
  return slugify(label);
}

/** Retrouve le libellé exact à partir du slug d'URL, ou null s'il est inconnu. */
export function categoryFromSlug(slug: string | undefined): string | null {
  if (!slug) return null;
  return SHOP_CATEGORIES.find((label) => categorySlug(label) === slug) ?? null;
}
