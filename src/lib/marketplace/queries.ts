import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type MarketplaceParams } from "@/lib/marketplace/params";
import type { MarketplaceProduct, MarketplaceShop, Page } from "@/lib/marketplace/types";

/*
 * Lectures du marketplace, faites avec le client anonyme.
 *
 * Aucune condition de visibilité n'est écrite ici : les policies posées en
 * Phase 3 ne laissent sortir que les boutiques publiées et actives, et les
 * produits actifs qui en dépendent. Répéter `published_at is not null` dans
 * chaque requête donnerait deux endroits où se tromper — et le jour où l'un des
 * deux oublie la condition, c'est la RLS qui tient.
 */

export type { MarketplaceShop, MarketplaceProduct, Page } from "@/lib/marketplace/types";

/**
 * PostgREST refuse une plage qui commence après la dernière ligne : demander
 * `?page=2` sur un résultat qui tient en une page renvoie l'erreur PGRST103, et
 * non une liste vide. Une URL tapée à la main ne doit pas rendre un 500, donc on
 * la traite pour ce qu'elle est — une page sans résultat — en gardant le total
 * réel pour que l'appelant puisse en faire un 404.
 */
const PLAGE_HORS_LIMITES = "PGRST103";

/**
 * Prépare un terme pour un filtre PostgREST.
 *
 * `.or()` reçoit une chaîne dont la virgule sépare les conditions et la
 * parenthèse les groupes : un terme qui en contient casserait la requête, ou
 * pire, y ajouterait une condition. Ces caractères sont retirés plutôt
 * qu'échappés — personne ne cherche « robe, wax » — et `%` avec eux, sans quoi
 * une recherche sur `%` seul retournerait le catalogue entier.
 */
function termeRecherche(q: string): string | null {
  const nettoye = q.replace(/[,()%*\\"]/g, " ").trim();
  return nettoye.length >= 2 ? nettoye : null;
}

// Les filtres sont appliqués par une fonction à part parce qu'ils servent deux
// fois : à la requête paginée, et au recomptage quand la page demandée est hors
// limites. Les dupliquer, c'est se garantir un total qui ne correspond pas à la
// liste affichée.
type Filtrable = {
  eq: (colonne: string, valeur: string) => Filtrable;
  or: (filtre: string) => Filtrable;
};

function filtrerBoutiques<T extends Filtrable>(requete: T, params: MarketplaceParams): T {
  let sortie = requete;
  if (params.categorie) sortie = sortie.eq("category", params.categorie) as T;
  if (params.pays) sortie = sortie.eq("country_code", params.pays) as T;

  const terme = termeRecherche(params.q);
  if (terme) sortie = sortie.or(`name.ilike.%${terme}%,description.ilike.%${terme}%`) as T;

  return sortie;
}

function filtrerProduits<T extends Filtrable>(requete: T, params: MarketplaceParams): T {
  let sortie = requete;
  if (params.categorie) sortie = sortie.eq("shops.category", params.categorie) as T;
  if (params.pays) sortie = sortie.eq("shops.country_code", params.pays) as T;

  const terme = termeRecherche(params.q);
  if (terme) sortie = sortie.or(`name.ilike.%${terme}%,description.ilike.%${terme}%`) as T;

  return sortie;
}

export async function listShops(params: MarketplaceParams): Promise<Page<MarketplaceShop>> {
  const supabase = await createClient();
  const debut = (params.page - 1) * PAGE_SIZE;

  const requete = filtrerBoutiques(
    supabase.from("shops").select("*, products(count)", { count: "exact" }),
    params,
  )
    // Les boutiques mises en avant d'abord, les vérifiées ensuite, puis les plus
    // récemment publiées. Pas de tri par prix ici : une boutique n'en a pas.
    .order("is_sponsored", { ascending: false })
    .order("is_verified", { ascending: false })
    .order("published_at", { ascending: false })
    .range(debut, debut + PAGE_SIZE - 1);

  const { data, count, error } = await requete;

  if (error?.code === PLAGE_HORS_LIMITES) {
    const { count: total } = await filtrerBoutiques(
      supabase.from("shops").select("id", { count: "exact", head: true }),
      params,
    );
    return { items: [], total: total ?? 0, page: params.page };
  }
  if (error) throw error;

  return {
    items: (data ?? []) as unknown as MarketplaceShop[],
    total: count ?? 0,
    page: params.page,
  };
}

const SELECT_PRODUITS =
  "*, product_images(url, alt_text, position), shops!inner(slug, name, currency_symbol, category)";

export async function listProducts(params: MarketplaceParams): Promise<Page<MarketplaceProduct>> {
  const supabase = await createClient();
  const debut = (params.page - 1) * PAGE_SIZE;

  // `!inner` : sans lui, filtrer sur la catégorie de la boutique laisserait
  // passer les produits dont la jointure est vide au lieu de les écarter.
  let requete = filtrerProduits(
    supabase.from("products").select(SELECT_PRODUITS, { count: "exact" }),
    params,
  );

  if (params.tri === "prix-croissant") {
    requete = requete.order("effective_price", { ascending: true });
  } else if (params.tri === "prix-decroissant") {
    requete = requete.order("effective_price", { ascending: false });
  } else {
    // Les produits mis en avant ne remontent que sur le tri par défaut : les
    // faire passer devant un tri par prix afficherait une liste qui contredit
    // son propre en-tête.
    requete = requete
      .order("is_sponsored", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, count, error } = await requete.range(debut, debut + PAGE_SIZE - 1);

  if (error?.code === PLAGE_HORS_LIMITES) {
    const { count: total } = await filtrerProduits(
      supabase.from("products").select("id, shops!inner(category)", { count: "exact", head: true }),
      params,
    );
    return { items: [], total: total ?? 0, page: params.page };
  }
  if (error) throw error;

  return {
    items: (data ?? []) as unknown as MarketplaceProduct[],
    total: count ?? 0,
    page: params.page,
  };
}

/** Nombre de produits visibles d'une boutique, tel que remonté par la jointure. */
export function productCount(shop: MarketplaceShop): number {
  return shop.products?.[0]?.count ?? 0;
}

/**
 * Les deux chiffres du bandeau du marketplace.
 *
 * Aucune condition à écrire : la RLS ne laisse compter que les boutiques
 * publiées et actives, et les produits actifs qui en dépendent. Le chiffre
 * affiché est donc exactement ce que le visiteur peut voir.
 */
export async function getMarketplaceCounts(): Promise<{ produits: number; boutiques: number }> {
  const supabase = await createClient();

  const [produits, boutiques] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("shops").select("id", { count: "exact", head: true }),
  ]);

  return { produits: produits.count ?? 0, boutiques: boutiques.count ?? 0 };
}

/**
 * Quelques produits pour le bandeau de la page d'accueil.
 *
 * Les mis en avant d'abord, les plus récents ensuite — le même ordre que le
 * marketplace, pour qu'un vendeur mis en avant le soit partout.
 */
export async function getLandingProducts(limite = 12): Promise<MarketplaceProduct[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(SELECT_PRODUITS)
    .order("is_sponsored", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) throw error;
  return (data ?? []) as unknown as MarketplaceProduct[];
}

export type CategoryTile = {
  /** Libellé exact, tel qu'il est stocké dans `shops.category`. */
  nom: string;
  boutiques: number;
  /** Première photo trouvée dans la catégorie, ou null si personne n'en a mis. */
  image: { url: string; alt: string } | null;
};

/**
 * Tuiles « Parcourir par catégorie ».
 *
 * Rien n'est inventé : le visuel de chaque tuile est une vraie photo produit
 * d'une boutique de la catégorie, et une catégorie sans boutique publiée n'est
 * pas rendue du tout. Avec une seule boutique en base, il y a donc une tuile et
 * non huit tuiles vides.
 *
 * Deux requêtes plutôt qu'une par catégorie : la première compte, la seconde
 * ramène de quoi illustrer. La limite de 500 produits suffit largement à
 * couvrir les huit catégories tant que le catalogue tient dans cet ordre de
 * grandeur ; au-delà, une vue agrégée en base serait à écrire.
 */
export async function getCategoryTiles(): Promise<CategoryTile[]> {
  const supabase = await createClient();

  const [{ data: boutiques }, { data: produits }] = await Promise.all([
    supabase.from("shops").select("category"),
    supabase
      .from("products")
      .select("shops!inner(category), product_images(url, alt_text, position)")
      .order("is_sponsored", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const comptes = new Map<string, number>();
  for (const boutique of boutiques ?? []) {
    if (!boutique.category) continue;
    comptes.set(boutique.category, (comptes.get(boutique.category) ?? 0) + 1);
  }

  const images = new Map<string, { url: string; alt: string }>();
  for (const produit of (produits ?? []) as unknown as {
    shops: { category: string | null };
    product_images: { url: string; alt_text: string; position: number }[];
  }[]) {
    const categorie = produit.shops?.category;
    if (!categorie || images.has(categorie)) continue;

    const photo = [...(produit.product_images ?? [])].sort((a, b) => a.position - b.position)[0];
    if (photo) images.set(categorie, { url: photo.url, alt: photo.alt_text });
  }

  return [...comptes.entries()]
    .map(([nom, boutiquesCount]) => ({
      nom,
      boutiques: boutiquesCount,
      image: images.get(nom) ?? null,
    }))
    .sort((a, b) => b.boutiques - a.boutiques || a.nom.localeCompare(b.nom, "fr"));
}

/*
 * Comptes seuls, sans ramener une ligne.
 *
 * Ils servent à valider le numéro de page avant que le rendu ne commence. La
 * liste, elle, est suspendue : une fois le flux ouvert, le code HTTP est déjà
 * parti, et un notFound() déclenché plus tard afficherait la page 404 sous un
 * statut 200. Or `?page=999` doit répondre 404, sans quoi un moteur de
 * recherche indexe une page qui n'existe pas.
 *
 * Le coût est nul sur le chemin courant : les pages n'appellent ces fonctions
 * que lorsque `page > 1`.
 */
export async function countShops(params: MarketplaceParams): Promise<number> {
  const supabase = await createClient();
  const { count } = await filtrerBoutiques(
    supabase.from("shops").select("id", { count: "exact", head: true }),
    params,
  );
  return count ?? 0;
}

export async function countProducts(params: MarketplaceParams): Promise<number> {
  const supabase = await createClient();
  const { count } = await filtrerProduits(
    supabase.from("products").select("id, shops!inner(category)", { count: "exact", head: true }),
    params,
  );
  return count ?? 0;
}
