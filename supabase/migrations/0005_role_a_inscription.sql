-- Watshop v2 — choix du rôle à l'inscription, et rôle revendeur
--
-- Delta idempotent, à appliquer après 0004.
--
--   1. nouveau rôle 'reseller' — le programme d'affiliation produit existait en
--      base (affiliate_code, affiliate_referrals, products.reseller_commission_pct)
--      mais aucun rôle ne permettait de s'en servir
--   2. le rôle est choisi à l'inscription, et filtré : 'admin' n'est jamais
--      accordable par ce chemin
--   3. code d'affiliation attribué automatiquement, comme le code agent

-- Postgres refuse qu'une valeur d'enum ajoutée dans une transaction soit
-- utilisée avant que celle-ci soit validée (« unsafe use of new value »). Or
-- l'éditeur SQL de Supabase exécute tout le fichier dans une seule transaction.
--
-- Précaution appliquée partout ci-dessous : là où ce fichier doit comparer un
-- rôle à 'reseller', il compare role::text plutôt que la valeur d'enum. La
-- comparaison porte alors sur du texte et n'exige plus que la nouvelle valeur
-- soit déjà validée. Aucune ligne à exécuter séparément.
alter type user_role add value if not exists 'reseller';

-- ============================================================
-- Code d'affiliation
-- ============================================================

create or replace function public.build_affiliate_code(p_id uuid)
returns text
language sql
immutable
as $$
  select 'RV' || upper(substr(replace(p_id::text, '-', ''), 1, 6));
$$;

-- Un agent reçoit un code agent, un revendeur un code d'affiliation. Les deux
-- programmes sont distincts : l'agent recrute des vendeurs et touche au mois,
-- le revendeur pousse des produits et touche à la vente.
create or replace function public.assign_agent_code()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role = 'agent' and new.agent_code is null then
    new.agent_code := public.build_agent_code(new.id);
  end if;

  if new.role::text = 'reseller' and new.affiliate_code is null then
    new.affiliate_code := public.build_affiliate_code(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_assign_agent_code on public.profiles;
create trigger profiles_assign_agent_code
  before insert or update of role on public.profiles
  for each row execute function public.assign_agent_code();

update public.profiles
set affiliate_code = public.build_affiliate_code(id)
where role::text = 'reseller' and affiliate_code is null;

-- ============================================================
-- Rôle choisi à l'inscription
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
    where agent_code = upper(v_code) and role = 'agent';
  end if;

  -- Liste blanche : le rôle vient du formulaire d'inscription, donc du client.
  -- 'admin' n'y figure pas et n'y figurera jamais — sans ce filtre, n'importe
  -- qui obtiendrait les droits d'administration en modifiant une requête.
  -- Le rôle est choisi en texte puis converti : la conversion n'a lieu qu'à
  -- l'exécution du trigger, donc bien après la validation de la transaction
  -- qui a ajouté 'reseller' à l'enum.
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

-- ============================================================
-- Ce qu'un revendeur a le droit de voir
-- ============================================================

-- Les produits qui offrent une commission sont déjà lisibles publiquement
-- (policy products_public_read) : rien à ouvrir de plus. Le revendeur lit ses
-- propres gains, et c'est tout — les policies affiliate_*_self_read existent
-- depuis la Phase 0.

-- L'enregistrement d'un clic et la création d'une commission se font côté
-- serveur : le visiteur qui clique n'est pas authentifié, et le revendeur ne
-- doit pas pouvoir s'attribuer une vente lui-même.
