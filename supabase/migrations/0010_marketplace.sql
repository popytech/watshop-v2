-- Watshop v2 — Marketplace
--
-- Delta idempotent, à appliquer après 0009. Une base neuve peut partir de
-- supabase/schema.sql, qui contient déjà tout ceci.
--
-- Rien n'est ouvert en lecture au passage : les policies publiques posées en
-- Phase 3 suffisaient déjà, et le commentaire du schéma les annonçait pour cet
-- usage — « Lecture publique du catalogue actif (boutique publique,
-- marketplace) ». Une boutique non publiée ou désactivée reste invisible, un
-- produit inactif aussi, sans qu'aucune condition n'ait à être répétée dans le
-- code du marketplace.
--
-- Ce fichier ne fait donc que rendre le catalogue triable et cherchable à
-- l'échelle de la plateforme, ce que la boutique seule ne demandait pas.

-- ============================================================
-- Prix effectif
-- ============================================================

-- Trier par prix demande la valeur réellement affichée, promo comprise. La
-- calculer côté application ne suffit pas : le tri se fait en SQL, sur des
-- pages de 24 produits tirées d'un catalogue entier. Une colonne générée garde
-- la règle en base, là où le tri s'exécute, et elle ne peut pas diverger de
-- effectivePrice() côté TypeScript puisqu'elle n'est jamais écrite à la main.
alter table public.products
  add column if not exists effective_price integer
  generated always as (
    case
      when promo_price is not null and promo_price < price then promo_price
      else price
    end
  ) stored;

create index if not exists products_effective_price_idx
  on public.products (effective_price);

-- ============================================================
-- Index de listing
-- ============================================================

-- Le marketplace trie par date décroissante et met les mis en avant devant.
create index if not exists products_created_at_idx
  on public.products (created_at desc);
create index if not exists products_sponsored_idx
  on public.products (is_sponsored desc, created_at desc);

-- Et filtre les boutiques par catégorie et par pays.
create index if not exists shops_category_idx on public.shops (category);
create index if not exists shops_country_code_idx on public.shops (country_code);
create index if not exists shops_published_at_idx on public.shops (published_at desc);

-- ============================================================
-- Recherche texte
-- ============================================================

-- La recherche est un `ilike '%terme%'`, qu'aucun index B-tree ne peut servir :
-- le motif ne commence pas par une constante. pg_trgm sait le faire.
--
-- C'est volontairement du `ilike` et non de la recherche plein texte : nos
-- vendeurs écrivent « bazin », « wax », « telephone » sans accent, et une
-- recherche plein texte française lemmatiserait des mots qu'elle ne connaît
-- pas. La sous-chaîne est plus bête et plus juste ici.
create extension if not exists pg_trgm;

create index if not exists shops_name_trgm_idx
  on public.shops using gin (name gin_trgm_ops);
create index if not exists products_name_trgm_idx
  on public.products using gin (name gin_trgm_ops);
