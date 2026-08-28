-- Watshop v2 — Phase 3 : boutique publique
--
-- Delta idempotent, à appliquer après 0002. Une base neuve peut partir de
-- supabase/schema.sql, qui contient déjà tout ceci.
--
-- Une seule modification de schéma : les liens produits sont partagés sur
-- WhatsApp, ils doivent être lisibles.
--   /chez-mariama/produit/robe-africaine-a3f9c1
--
-- Rien n'est ouvert en lecture publique au passage. Un acheteur n'a pas de
-- compte : la création de sa commande et la relecture de sa confirmation se
-- font côté serveur, avec la clé service_role, sur l'identifiant exact tiré de
-- l'URL. Une policy "select using (true)" sur orders donnerait accès au nom,
-- au téléphone et à l'adresse de tous les clients de toutes les boutiques.

alter table public.products add column if not exists slug text;

-- Suffixe court tiré de l'identifiant : garantit l'unicité sans logique de
-- collision, tout en gardant le nom lisible dans l'URL.
update public.products
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
           || '-' || substr(id::text, 1, 6)
where slug is null or slug = '';

alter table public.products alter column slug set not null;

create unique index if not exists products_shop_slug_idx on public.products (shop_id, slug);
