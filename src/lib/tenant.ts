// Résolution du "tenant" (la boutique) courant.
//
// Aujourd'hui : le tenant vient du chemin d'URL (/shop/[slug]), résolu
// nativement par le routeur de fichiers Next.js — cette fonction ne fait que
// centraliser l'accès pour que rien d'autre dans l'app ne présuppose la forme
// de l'URL.
//
// Demain (Phase 6, sous-domaines *.watshop.africa) : proxy.ts détectera le
// sous-domaine et réécrira la requête vers ce même /shop/[slug] en interne
// (voir le commentaire dans proxy.ts) — cette fonction et les pages qui
// l'utilisent n'auront pas besoin de changer.
export function getTenantSlugFromParams(params: { slug?: string }): string | null {
  return params.slug ?? null;
}
