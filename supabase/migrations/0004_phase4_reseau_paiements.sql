-- Watshop v2 — Phase 4 : réseau (agents, livreurs) et paiements
--
-- Delta idempotent, à appliquer après 0003. Une base neuve peut partir de
-- supabase/schema.sql, qui contient déjà tout ceci.
--
--   1. code agent attribué automatiquement, et parrainage capté à l'inscription
--   2. l'agent voit les vendeurs qu'il a recrutés — et rien d'autre
--   3. le livreur voit les commandes qui lui sont confiées, et peut les avancer
--   4. table payments : le module paiement, prêt à recevoir GNAKRYPAY

-- ============================================================
-- 1. Code agent et parrainage
-- ============================================================

-- Code lisible et court, dérivé de l'identifiant : pas de tirage aléatoire à
-- réessayer en cas de collision, et il reste stable pour l'agent.
create or replace function public.build_agent_code(p_id uuid)
returns text
language sql
immutable
as $$
  select 'AG' || upper(substr(replace(p_id::text, '-', ''), 1, 6));
$$;

-- Attribué dès qu'un profil passe au rôle 'agent' — l'agent n'a rien à demander.
create or replace function public.assign_agent_code()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role = 'agent' and new.agent_code is null then
    new.agent_code := public.build_agent_code(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_assign_agent_code on public.profiles;
create trigger profiles_assign_agent_code
  before insert or update of role on public.profiles
  for each row execute function public.assign_agent_code();

-- Rattrapage pour les agents déjà en base.
update public.profiles
set agent_code = public.build_agent_code(id)
where role = 'agent' and agent_code is null;

-- Le code de parrainage voyage dans les métadonnées d'inscription
-- (?agent=AG123456 sur la page d'inscription) : le trigger le résout ici, une
-- fois pour toutes. Le faire côté application laisserait la porte ouverte à un
-- vendeur qui réattribuerait son parrain après coup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_agent_id uuid;
  v_code text;
begin
  v_code := nullif(trim(new.raw_user_meta_data ->> 'agent_code'), '');
  if v_code is not null then
    select id into v_agent_id
    from public.profiles
    where agent_code = upper(v_code) and role = 'agent';
  end if;

  insert into public.profiles (id, email, phone, name, avatar_url, agent_id)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    v_agent_id
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, is_active)
  values (new.id, 'free', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. Ce que l'agent a le droit de voir
-- ============================================================

-- Strictement les vendeurs qu'il a recrutés. Un agent n'est pas un demi-admin :
-- il ne voit ni les commandes, ni les clients, ni les autres boutiques.
drop policy if exists "profiles_agent_read" on public.profiles;
create policy "profiles_agent_read" on public.profiles for select
  using (agent_id = auth.uid());

drop policy if exists "shops_agent_read" on public.shops;
create policy "shops_agent_read" on public.shops for select
  using (exists (
    select 1 from public.profiles p
    where p.id = shops.user_id and p.agent_id = auth.uid()
  ));

-- ============================================================
-- 3. Ce que le livreur a le droit de voir
-- ============================================================

drop policy if exists "delivery_partners_self_read" on public.delivery_partners;
create policy "delivery_partners_self_read" on public.delivery_partners for select
  using (user_id = auth.uid());

-- Les commandes qui lui sont confiées, et rien de plus.
drop policy if exists "orders_delivery_read" on public.orders;
create policy "orders_delivery_read" on public.orders for select
  using (exists (
    select 1 from public.delivery_partners d
    where d.id = orders.delivery_partner_id and d.user_id = auth.uid()
  ));

drop policy if exists "orders_delivery_update" on public.orders;
create policy "orders_delivery_update" on public.orders for update
  using (exists (
    select 1 from public.delivery_partners d
    where d.id = orders.delivery_partner_id and d.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.delivery_partners d
    where d.id = orders.delivery_partner_id and d.user_id = auth.uid()
  ));

drop policy if exists "order_items_delivery_read" on public.order_items;
create policy "order_items_delivery_read" on public.order_items for select
  using (exists (
    select 1 from public.orders o
    join public.delivery_partners d on d.id = o.delivery_partner_id
    where o.id = order_items.order_id and d.user_id = auth.uid()
  ));

-- Un livreur ne peut pas faire n'importe quoi d'une commande : il l'avance
-- (expédiée, livrée) mais ne peut ni l'annuler ni la remettre en attente, ni
-- toucher au montant. La policy UPDATE ne sait pas comparer NEW et OLD, d'où
-- ce trigger — même raisonnement que pour l'escalade de privilèges.
create or replace function public.guard_delivery_order_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_est_livreur boolean;
begin
  select exists (
    select 1 from public.delivery_partners d
    where d.id = new.delivery_partner_id and d.user_id = auth.uid()
  ) into v_est_livreur;

  -- Ni le vendeur, ni l'admin, ni le serveur : rien à contrôler ici.
  if auth.uid() is null or not v_est_livreur or public.is_admin() then
    return new;
  end if;

  if exists (
    select 1 from public.shops s where s.id = new.shop_id and s.user_id = auth.uid()
  ) then
    return new;
  end if;

  if new.status not in ('shipped', 'delivered') then
    raise exception 'Un livreur ne peut que marquer une commande expédiée ou livrée';
  end if;

  if new.total_amount is distinct from old.total_amount
     or new.shop_id is distinct from old.shop_id
     or new.delivery_partner_id is distinct from old.delivery_partner_id
     or new.customer_phone is distinct from old.customer_phone then
    raise exception 'Champ non modifiable par un livreur';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_guard_delivery_update on public.orders;
create trigger orders_guard_delivery_update
  before update on public.orders
  for each row execute function public.guard_delivery_order_update();

-- ============================================================
-- 4. Paiements
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_provider') then
    -- 'manual' = virement Mobile Money déclaré par le vendeur puis confirmé par
    -- un admin. 'gnakrypay' existe dès maintenant pour que le jour où ses accès
    -- arrivent, seule l'implémentation soit à écrire — pas le schéma.
    create type payment_provider as enum ('manual', 'gnakrypay');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending', 'confirmed', 'rejected');
  end if;
end $$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  provider payment_provider not null default 'manual',
  amount integer not null check (amount >= 0),
  currency text not null default 'GNF',
  -- Référence du transfert Mobile Money, ou identifiant de transaction rendu
  -- par l'agrégateur.
  reference text,
  payer_phone text,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_status_idx on public.payments (status, created_at desc);

alter table public.payments enable row level security;

drop policy if exists "payments_self_read" on public.payments;
create policy "payments_self_read" on public.payments for select
  using (auth.uid() = user_id);

drop policy if exists "payments_self_insert" on public.payments;
create policy "payments_self_insert" on public.payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all" on public.payments for all
  using (public.is_admin()) with check (public.is_admin());

-- Le vendeur déclare son paiement, il ne le confirme pas : seul un admin (ou
-- l'agrégateur, plus tard, via la clé service_role) peut faire passer un
-- paiement à 'confirmed' et déclencher le passage en Pro.
create or replace function public.guard_payment_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.amount is distinct from old.amount then
    raise exception 'Seul un administrateur peut confirmer un paiement';
  end if;

  return new;
end;
$$;

drop trigger if exists payments_guard_status on public.payments;
create trigger payments_guard_status
  before update on public.payments
  for each row execute function public.guard_payment_status();

-- Un paiement confirmé fait passer l'abonnement en Pro. La règle vit en base :
-- quel que soit le chemin qui confirme le paiement — écran admin aujourd'hui,
-- webhook GNAKRYPAY demain — l'abonnement suit.
create or replace function public.apply_confirmed_payment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'confirmed' and (old.status is null or old.status <> 'confirmed') then
    new.confirmed_at := coalesce(new.confirmed_at, now());

    update public.subscriptions
    set plan = 'pro',
        is_active = true,
        payment_reference = new.reference,
        ends_at = greatest(coalesce(ends_at, now()), now()) + interval '1 month'
    where user_id = new.user_id;

    update public.profiles set is_pro = true where id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists payments_apply_confirmed on public.payments;
create trigger payments_apply_confirmed
  before update on public.payments
  for each row execute function public.apply_confirmed_payment();
