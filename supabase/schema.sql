-- Watshop v2 — schéma initial (Phase 0)
-- À exécuter dans l'éditeur SQL Supabase (ou via la CLI) sur un projet neuf.
--
-- Corrige les incohérences relevées dans l'audit du projet legacy :
--   - products.view_count : un seul nom (legacy avait view_count ET views_count)
--   - profiles.agent_id : toujours un uuid (legacy mélangeait uuid et code agent dans "referred_by")
--   - orders.customer_city : existe et est vraiment persistée (legacy la recevait sans la stocker)
--   - otp_codes : recentré sur le seul flux WhatsApp (l'email et Google passent par Supabase Auth natif)
--   - RLS activé partout : legacy contournait systématiquement RLS via la clé service_role

create extension if not exists "pgcrypto";

-- ============================================================
-- Rôles & profils (étend auth.users, géré par Supabase Auth)
-- ============================================================

create type user_role as enum ('user', 'agent', 'delivery', 'admin');
create type vehicle_type as enum ('moto', 'velo', 'voiture', 'a_pied');
create type subscription_plan as enum ('free', 'pro');
create type order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
create type affiliate_status as enum ('pending', 'confirmed', 'paid');
create type payout_status as enum ('pending', 'paid');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  name text,
  avatar_url text,
  country_code text not null default 'GN',
  role user_role not null default 'user',
  is_pro boolean not null default false,
  -- Programme Agents commerciaux (parrainage de vendeurs)
  agent_code text unique,
  agent_commission integer not null default 10000,
  agent_id uuid references public.profiles (id) on delete set null, -- l'agent qui a recruté ce vendeur
  -- Programme d'affiliation produit (distinct du programme Agents)
  affiliate_code text unique,
  created_at timestamptz not null default now()
);

create index profiles_agent_id_idx on public.profiles (agent_id);
create index profiles_phone_idx on public.profiles (phone);

-- ============================================================
-- Boutiques
-- ============================================================

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  whatsapp_number text not null,
  country_code text not null default 'GN',
  currency_symbol text not null default 'GNF',
  logo_url text,
  category text,
  is_active boolean not null default true,
  is_verified boolean not null default false,
  is_sponsored boolean not null default false,
  created_by_agent_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index shops_user_id_idx on public.shops (user_id);
create index shops_slug_idx on public.shops (slug);

-- ============================================================
-- Catalogue
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null,
  icon text
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text,
  price integer not null,
  promo_price integer,
  quantity integer not null default 0,
  sizes text[],
  is_active boolean not null default true,
  is_sponsored boolean not null default false,
  reseller_commission_pct integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index products_shop_id_idx on public.products (shop_id);
create index products_category_id_idx on public.products (category_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt_text text not null default '',
  position integer not null default 0
);

create index product_images_product_id_idx on public.product_images (product_id);

-- ============================================================
-- Livraison
-- ============================================================

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  zone_name text not null,
  price integer not null,
  estimated_delay text,
  free_above integer
);

create index delivery_zones_shop_id_idx on public.delivery_zones (shop_id);

create table public.delivery_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  whatsapp_number text not null,
  city text not null,
  vehicle_type vehicle_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index delivery_partners_shop_id_idx on public.delivery_partners (shop_id);

-- ============================================================
-- Commandes
-- ============================================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_address text not null,
  customer_city text,
  delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
  delivery_partner_id uuid references public.delivery_partners (id) on delete set null,
  delivery_fee integer not null default 0,
  total_amount integer not null,
  status order_status not null default 'pending',
  seller_notification_status text,
  seller_notification_phone text,
  seller_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index orders_shop_id_idx on public.orders (shop_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null, -- snapshot au moment de la commande
  unit_price integer not null,
  quantity integer not null,
  size text
);

create index order_items_order_id_idx on public.order_items (order_id);

-- ============================================================
-- Avis
-- ============================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index reviews_shop_id_idx on public.reviews (shop_id);
create index reviews_product_id_idx on public.reviews (product_id);

-- ============================================================
-- Abonnements (Free / Pro)
-- ============================================================

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan subscription_plan not null default 'free',
  is_active boolean not null default true,
  payment_reference text, -- rempli quand GNAKRYPAY sera branché (Phase 4)
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

-- ============================================================
-- Programme d'affiliation produit
-- ============================================================

create table public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  affiliate_code text not null,
  commission_amount integer not null default 0,
  commission_pct integer not null default 0,
  status affiliate_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index affiliate_referrals_referrer_id_idx on public.affiliate_referrals (referrer_id);

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  affiliate_code text not null,
  created_at timestamptz not null default now()
);

create index affiliate_clicks_referrer_id_idx on public.affiliate_clicks (referrer_id);

-- ============================================================
-- Commissions Agents commerciaux
-- ============================================================

create table public.agent_commission_payouts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  period_month date not null, -- premier jour du mois concerné
  amount integer not null,
  status payout_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index agent_commission_payouts_agent_id_idx on public.agent_commission_payouts (agent_id);

-- ============================================================
-- Notifications push
-- ============================================================

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  platform text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

-- ============================================================
-- OTP WhatsApp (seul canal qui ne passe pas par Supabase Auth natif)
-- ============================================================

create table public.whatsapp_otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index whatsapp_otp_codes_phone_idx on public.whatsapp_otp_codes (phone);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.subscriptions enable row level security;
alter table public.affiliate_referrals enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.agent_commission_payouts enable row level security;
alter table public.push_tokens enable row level security;
alter table public.whatsapp_otp_codes enable row level security;

-- Lecture publique du catalogue actif (boutique publique, marketplace)
create policy "shops_public_read" on public.shops for select using (is_active = true);
create policy "categories_public_read" on public.categories for select using (true);
create policy "products_public_read" on public.products for select using (is_active = true);
create policy "product_images_public_read" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active = true));
create policy "delivery_zones_public_read" on public.delivery_zones for select using (true);
create policy "reviews_public_read" on public.reviews for select using (true);

-- Un vendeur gère sa propre boutique et ce qui en dépend
create policy "profiles_self_read" on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);

create policy "shops_owner_all" on public.shops for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "products_owner_all" on public.products for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()));

create policy "product_images_owner_all" on public.product_images for all
  using (exists (
    select 1 from public.products p join public.shops s on s.id = p.shop_id
    where p.id = product_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.products p join public.shops s on s.id = p.shop_id
    where p.id = product_id and s.user_id = auth.uid()
  ));

create policy "delivery_zones_owner_all" on public.delivery_zones for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()));

create policy "delivery_partners_owner_all" on public.delivery_partners for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()));

create policy "orders_owner_read" on public.orders for select
  using (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()));
create policy "orders_owner_update" on public.orders for update
  using (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()));
-- La création de commande se fait côté serveur (route handler avec la clé service_role),
-- car le client (l'acheteur) n'est pas authentifié — pas de policy insert publique ici.

create policy "order_items_owner_read" on public.order_items for select
  using (exists (
    select 1 from public.orders o join public.shops s on s.id = o.shop_id
    where o.id = order_id and s.user_id = auth.uid()
  ));

create policy "subscriptions_self_read" on public.subscriptions for select using (auth.uid() = user_id);
create policy "push_tokens_self_all" on public.push_tokens for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "affiliate_referrals_self_read" on public.affiliate_referrals for select
  using (auth.uid() = referrer_id);
create policy "affiliate_clicks_self_read" on public.affiliate_clicks for select
  using (auth.uid() = referrer_id);
create policy "agent_commission_payouts_self_read" on public.agent_commission_payouts for select
  using (auth.uid() = agent_id);

-- Aucune policy sur whatsapp_otp_codes : ce flux tourne exclusivement côté serveur
-- (route handler avec la clé service_role, avant même qu'une session existe).

-- Les tables ci-dessus n'ont pas de policy "admin" explicite : les routes /api/admin/*
-- utilisent la clé service_role (qui contourne RLS par nature) après vérification du
-- rôle 'admin' en base — voir Phase 1 pour le remplacement du secret admin en dur.

-- ============================================================
-- Création automatique du profil à l'inscription (auth.users -> public.profiles)
-- ============================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone, name, avatar_url)
  values (
    new.id,
    new.phone,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
