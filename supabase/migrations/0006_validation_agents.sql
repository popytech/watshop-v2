-- Watshop v2 — validation des agents commerciaux
--
-- Delta idempotent, à appliquer après 0005.
--
-- Le rôle agent se choisit à l'inscription : n'importe quel compte pouvait donc
-- générer un code de parrainage et se rattacher des vendeurs. Le versement
-- restait sous contrôle humain (les payouts sont créés par un admin), mais le
-- rattachement, lui, était déjà acquis — et le discuter après coup, vendeur par
-- vendeur, est ingérable.
--
-- Un agent doit désormais être validé avant que son code ne rattache quoi que
-- ce soit.

alter table public.profiles
  add column if not exists agent_verified_at timestamptz;

comment on column public.profiles.agent_verified_at is
  'Null = agent non validé : son code de parrainage ne rattache aucun vendeur.';

-- ============================================================
-- Un agent ne se valide pas lui-même
-- ============================================================

-- profiles_self_update autorise un utilisateur à modifier sa propre ligne :
-- sans ce garde-fou, un agent se validerait d'un appel à l'API.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.is_pro is distinct from old.is_pro
     or new.agent_code is distinct from old.agent_code
     or new.agent_commission is distinct from old.agent_commission
     or new.agent_id is distinct from old.agent_id
     or new.agent_verified_at is distinct from old.agent_verified_at
     or new.affiliate_code is distinct from old.affiliate_code then
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
-- Le code d'un agent non validé ne rattache rien
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_agent_id uuid;
  v_code text;
  v_role user_role;
begin
  v_code := nullif(trim(new.raw_user_meta_data ->> 'agent_code'), '');
  if v_code is not null then
    select id into v_agent_id
    from public.profiles
    where agent_code = upper(v_code)
      and role = 'agent'
      -- Un agent en attente de validation ne se rattache personne : le lien
      -- fonctionne, l'inscription aboutit, mais le parrainage n'est pas compté.
      and agent_verified_at is not null;
  end if;

  -- Même précaution que dans la migration 0005 : le rôle est choisi en texte
  -- puis converti, pour le cas où ce fichier serait exécuté dans la même
  -- transaction que l'ajout de 'reseller' à l'enum.
  v_role := (
    case new.raw_user_meta_data ->> 'role'
      when 'agent' then 'agent'
      when 'delivery' then 'delivery'
      when 'reseller' then 'reseller'
      else 'user'
    end
  )::user_role;

  insert into public.profiles (id, email, phone, name, avatar_url, agent_id, role)
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
    v_agent_id,
    v_role
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

-- Les agents déjà en base précèdent cette règle : les valider d'office plutôt
-- que de suspendre des parrainages en cours.
update public.profiles
set agent_verified_at = now()
where role = 'agent' and agent_verified_at is null;
