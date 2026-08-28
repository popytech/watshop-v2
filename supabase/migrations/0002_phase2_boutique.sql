-- Watshop v2 — Phase 2 : onboarding, boutique, produits, commandes
--
-- Delta idempotent, à appliquer après 0001. Une base neuve peut aussi partir de
-- supabase/schema.sql, qui contient déjà tout ceci.
--
-- Ce que ça ajoute :
--   1. état d'avancement de l'onboarding + publication explicite d'une boutique
--   2. apparence (couleur) et Mobile Money (optionnel, GNAKRYPAY plus tard)
--   3. provenance des commandes, pour distinguer les commandes WhatsApp
--   4. table shop_visits, qui alimente le compteur de visiteurs du tableau de bord
--   5. bucket de stockage des images + policies

-- ============================================================
-- 1. Onboarding et publication
-- ============================================================

-- Le numéro WhatsApp est demandé à l'étape 5, pas à la création de la boutique
-- (étape 2) : il ne peut donc pas être obligatoire en base. L'obligation est
-- vérifiée au moment de publier.
alter table public.shops alter column whatsapp_number drop not null;

-- Étape suivante à compléter (2 = boutique … 6 = publication).
alter table public.shops add column if not exists onboarding_step smallint not null default 2;

-- Null tant que la boutique n'a pas été publiée : c'est ce qui la rend visible
-- du public, indépendamment de is_active (qu'un admin peut retirer).
alter table public.shops add column if not exists published_at timestamptz;

alter table public.shops add column if not exists primary_color text not null default '#128c4a';
alter table public.shops add column if not exists mobile_money_number text;

-- Le slug est un segment de chemin sous watshop.africa/ : même règle qu'en
-- TypeScript (src/lib/tenant.ts), rappelée ici pour que la base ne puisse pas
-- contenir une adresse injoignable.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shops_slug_format'
  ) then
    alter table public.shops
      add constraint shops_slug_format
      check (slug ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$');
  end if;
end $$;

-- Une boutique n'est publique qu'une fois publiée.
drop policy if exists "shops_public_read" on public.shops;
create policy "shops_public_read" on public.shops for select
  using (is_active = true and published_at is not null);

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select
  using (
    is_active = true
    and exists (
      select 1 from public.shops s
      where s.id = shop_id and s.is_active = true and s.published_at is not null
    )
  );

-- ============================================================
-- 2. Provenance des commandes
-- ============================================================

-- Le tableau de bord affiche "commandes" et "commandes WhatsApp" comme deux
-- chiffres distincts : il faut donc savoir d'où vient chaque commande.
--   storefront = tunnel de la boutique en ligne
--   whatsapp   = bouton "Commander sur WhatsApp", sans passer par le panier
--   manual     = saisie par le vendeur lui-même
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_source') then
    create type order_source as enum ('storefront', 'whatsapp', 'manual');
  end if;
end $$;

alter table public.orders add column if not exists source order_source not null default 'storefront';

-- ============================================================
-- 3. Visiteurs
-- ============================================================

create table if not exists public.shop_visits (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  -- empreinte non réversible (IP + user agent + sel) : compter des visiteurs
  -- distincts sans conserver d'adresse IP en clair.
  visitor_hash text,
  created_at timestamptz not null default now()
);

create index if not exists shop_visits_shop_created_idx
  on public.shop_visits (shop_id, created_at desc);

alter table public.shop_visits enable row level security;

drop policy if exists "shop_visits_owner_read" on public.shop_visits;
create policy "shop_visits_owner_read" on public.shop_visits for select
  using (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()));

drop policy if exists "shop_visits_admin_all" on public.shop_visits;
create policy "shop_visits_admin_all" on public.shop_visits for all
  using (public.is_admin()) with check (public.is_admin());

-- Pas de policy d'insertion : les visites sont enregistrées côté serveur depuis
-- la boutique publique (Phase 3), où le visiteur n'est pas authentifié.

-- ============================================================
-- 4. Stockage des images (logos, photos produits)
-- ============================================================

-- Cloudflare R2 reste la cible (ROADMAP, section 3). En attendant ses accès, le
-- stockage passe par Supabase Storage : même projet, aucune clé supplémentaire.
-- Côté code, un seul fichier à changer le jour du basculement (src/lib/storage.ts).
insert into storage.buckets (id, name, public)
values ('shop-media', 'shop-media', true)
on conflict (id) do nothing;

-- Convention de chemin : <user_id>/<shop_id>/<fichier>. La policy s'appuie
-- dessus pour qu'un vendeur ne puisse écrire que dans son propre dossier.
drop policy if exists "shop_media_public_read" on storage.objects;
create policy "shop_media_public_read" on storage.objects for select
  using (bucket_id = 'shop-media');

drop policy if exists "shop_media_owner_insert" on storage.objects;
create policy "shop_media_owner_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'shop-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "shop_media_owner_update" on storage.objects;
create policy "shop_media_owner_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'shop-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "shop_media_owner_delete" on storage.objects;
create policy "shop_media_owner_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'shop-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
