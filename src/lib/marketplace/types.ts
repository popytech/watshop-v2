import type { Database } from "@/lib/supabase/types";

/*
 * Formes renvoyées par les requêtes du marketplace.
 *
 * Elles vivent ici, et non dans queries.ts, parce que ce dernier est
 * `server-only` : la page des favoris est rendue côté client, et importer un
 * type depuis un module serveur y ferait entrer tout le module — d'où l'erreur
 * « vous importez un module qui dépend de next/headers ». Un type n'a besoin de
 * rien pour exister ; il n'a donc rien à faire dans un fichier qui ouvre une
 * connexion.
 */

type Shop = Database["public"]["Tables"]["shops"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

export type MarketplaceShop = Shop & {
  /** Compte des produits visibles, remonté par la jointure. */
  products: { count: number }[];
};

export type MarketplaceProduct = Product & {
  product_images: { url: string; alt_text: string; position: number }[];
  shops: Pick<Shop, "slug" | "name" | "currency_symbol" | "category">;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
};
