-- Watshop v2 — Phase 1 : Auth & rôles
--
-- Delta à appliquer sur une base où le schéma Phase 0 (supabase/schema.sql,
-- version initiale) a déjà été exécuté. Si la base est encore vide, exécuter
-- directement supabase/schema.sql : il intègre déjà tout ce fichier.
--
-- Ce que ça change :
--   1. profiles.email — l'email vit dans auth.users, mais on en garde une copie
--      lisible côté public pour l'admin et les futures listes vendeurs.
--   2. suppression de whatsapp_otp_codes — l'OTP WhatsApp passe désormais par
--      Supabase Auth (provider Phone + Send SMS Hook -> Fonnte). Plus de table
--      d'OTP maison, donc plus de rejeu/expiration/tentatives à gérer nous-mêmes.
--   3. is_admin() + policies admin — les écrans /admin lisent avec le client de
--      l'utilisateur (RLS appliquée) au lieu de la clé service_role.
--   4. blocage de l'escalade de privilèges : un utilisateur peut modifier son
--      profil, mais pas son rôle ni ses paramètres de commission.
--   5. trigger d'inscription enrichi (email, métadonnées Google) + abonnement
--      'free' créé d'office.

-- ============================================================
-- 1. profiles.email
-- ============================================================

alter table public.profiles add column if not exists email text unique;

-- ============================================================
-- 2. L'OTP WhatsApp passe par Supabase Auth
-- ============================================================

drop table if exists public.whatsapp_otp_codes;

-- ============================================================
-- 3. Rôle admin : is_admin() + policies
-- ============================================================

-- security definer : la fonction lit public.profiles en contournant la RLS,
-- ce qui évite la récursion infinie (une policy sur profiles qui interrogerait
-- profiles). search_path figé = protection contre le schema hijacking.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'shops', 'categories', 'products', 'product_images',
    'delivery_zones', 'delivery_partners', 'orders', 'order_items',
    'reviews', 'subscriptions', 'affiliate_referrals', 'affiliate_clicks',
    'agent_commission_payouts', 'push_tokens'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t
    );
  end loop;
end $$;

-- ============================================================
-- 4. Anti-escalade de privilèges sur profiles
-- ============================================================

-- La policy d'update Phase 0 n'avait pas de WITH CHECK : un vendeur pouvait
-- se promouvoir admin avec une simple requête depuis le navigateur.
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- auth.uid() est null côté serveur (clé service_role) : ces appels-là sont
  -- déjà passés par une vérification de rôle applicative, on les laisse faire.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.is_pro is distinct from old.is_pro
     or new.agent_code is distinct from old.agent_code
     or new.agent_commission is distinct from old.agent_commission
     or new.agent_id is distinct from old.agent_id then
    raise exception 'Champ réservé aux administrateurs';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- ============================================================
-- 5. Inscription : profil + abonnement créés d'office
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, name, avatar_url)
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
    )
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
