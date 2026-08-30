// Résolution du "tenant" (la boutique) courant.
//
// Décision actée : pas de sous-domaines. Une boutique vit sous le premier
// segment de chemin du domaine principal — watshop.africa/maboutique — ce qui
// évite le wildcard DNS, le plan Vercel qui va avec, et les cookies de session
// à partager entre sous-domaines.
//
// Conséquence : le segment de boutique partage l'espace de noms avec les routes
// de l'application. D'où RESERVED_SLUGS ci-dessous, à respecter à la création
// d'une boutique (Phase 2). Next.js donne la priorité aux routes statiques sur
// le segment dynamique, donc /login continuera de fonctionner même si un slug
// interdit passait entre les mailles — mais la boutique, elle, serait
// injoignable.

/**
 * Segments réservés à l'application : aucune boutique ne peut les prendre.
 * Volontairement large — mieux vaut refuser un slug aujourd'hui que casser une
 * boutique le jour où la route est ajoutée.
 */
export const RESERVED_SLUGS = new Set([
  // routes existantes
  "login",
  "register",
  "dashboard",
  "admin",
  "auth",
  "api",
  "acces-refuse",
  // fichiers et conventions
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
  "sw.js",
  "public",
  "static",
  // routes probables des phases suivantes
  "onboarding",
  "compte",
  "parametres",
  "aide",
  "support",
  "contact",
  "tarifs",
  "cgu",
  "confidentialite",
  "agent",
  "agents",
  "livreur",
  "livreurs",
  "boutiques",
  "recherche",
  "favoris",
  "panier",
  "commande",
  "commandes",
  "produit",
  "produits",
  "p",
  "shop",
  "s",
  "www",
  "app",
]);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Un slug valide : 3 à 32 caractères, minuscules, chiffres et tirets, ne
 * commence ni ne finit par un tiret, et n'empiète pas sur les routes de l'app.
 */
export function isValidShopSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !isReservedSlug(slug);
}

/** Fabrique un slug à partir du nom de boutique saisi ("Chez Mariama" -> "chez-mariama"). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");
}

/**
 * Adresse publique d'un produit : le nom, plus un suffixe court tiré de son
 * identifiant. Le suffixe garantit l'unicité sans logique de collision, et le
 * slug est figé à la création — renommer un produit ne doit pas casser les
 * liens déjà partagés sur WhatsApp.
 */
export function productSlug(name: string, id: string): string {
  const base = slugify(name) || "produit";
  return `${base}-${id.replace(/-/g, "").slice(0, 6)}`;
}

/** Le tenant courant, tel que le routeur de fichiers l'a extrait de l'URL. */
export function getTenantSlugFromParams(params: { slug?: string }): string | null {
  return params.slug ?? null;
}

/**
 * Seul endroit qui fabrique l'adresse publique d'une boutique. Tout ce qui
 * partage un lien (onboarding, boutons de partage, QR code, message WhatsApp)
 * passe par ici.
 */
export function shopPath(slug: string): string {
  return `/${slug}`;
}

export function shopUrl(slug: string, siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""): string {
  return `${siteUrl.replace(/\/$/, "")}${shopPath(slug)}`;
}
