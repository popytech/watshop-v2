import { categoryFromSlug, categorySlug } from "@/lib/shop/categories";
import { COUNTRIES } from "@/lib/phone";

/** 24 : divisible par 2, 3 et 4, donc une dernière ligne jamais bancale. */
export const PAGE_SIZE = 24;

export const TRIS = [
  { valeur: "recent", label: "Plus récents" },
  { valeur: "prix-croissant", label: "Prix croissant" },
  { valeur: "prix-decroissant", label: "Prix décroissant" },
] as const;

export type Tri = (typeof TRIS)[number]["valeur"];

/**
 * Ce que le marketplace lit dans l'URL. Une seule définition, partagée par les
 * pages, le formulaire de filtres et la pagination : c'est ce qui garantit
 * qu'un lien de pagination ne perde pas le filtre en cours.
 */
export type MarketplaceParams = {
  q: string;
  categorie: string | null;
  pays: string | null;
  tri: Tri;
  page: number;
};

/** Next passe des `string | string[] | undefined` : on ne garde que le premier. */
function premier(valeur: string | string[] | undefined): string | undefined {
  return Array.isArray(valeur) ? valeur[0] : valeur;
}

export function parseParams(
  raw: Record<string, string | string[] | undefined>,
): MarketplaceParams {
  const page = Number.parseInt(premier(raw.page) ?? "1", 10);
  const tri = premier(raw.tri);

  return {
    q: (premier(raw.q) ?? "").trim().slice(0, 60),
    // On garde le libellé exact, ou rien : un slug inconnu est ignoré plutôt
    // que passé tel quel à la requête, où il ne trouverait rien.
    categorie: categoryFromSlug(premier(raw.categorie)),
    pays: COUNTRIES.some((p) => p.code === premier(raw.pays)) ? (premier(raw.pays) ?? null) : null,
    tri: TRIS.some((t) => t.valeur === tri) ? (tri as Tri) : "recent",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 500) : 1,
  };
}

/**
 * Reconstruit la query string. Les valeurs par défaut sont omises : l'adresse
 * d'une page sans filtre reste `/boutiques`, et non `/boutiques?q=&tri=recent`,
 * ce qui évite d'indexer deux URL pour la même page.
 */
export function toQueryString(params: Partial<MarketplaceParams>): string {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.categorie) search.set("categorie", categorySlug(params.categorie));
  if (params.pays) search.set("pays", params.pays);
  if (params.tri && params.tri !== "recent") search.set("tri", params.tri);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const rendu = search.toString();
  return rendu ? `?${rendu}` : "";
}

export function nombreDePages(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}
