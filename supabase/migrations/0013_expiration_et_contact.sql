-- Watshop v2 — Expiration du Pro, et contact du vendeur
--
-- Delta idempotent, à appliquer après 0012. Deux sujets distincts, réunis parce
-- qu'ils touchent les mêmes objets.

-- Garde-fou.
--
-- Ce fichier s'appuie sur `is_pro_active`, créée par la migration 0012. Sans
-- elle, l'échec ne survenait qu'à la dernière ligne, et le message accusait la
-- 0013 alors que la 0012 était en cause — pire, l'éditeur SQL de Supabase
-- rejoue le tout dans une transaction, si bien que la colonne créée plus haut
-- disparaissait aussi. Autant s'arrêter tout de suite, en le disant.
do $garde$
begin
  if to_regprocedure('public.is_pro_active(uuid)') is null then
    raise exception
      'La migration 0012 doit être appliquée avant celle-ci (fonction is_pro_active absente).';
  end if;
end;
$garde$;

-- ============================================================
-- 1. Ce qu'on voit d'une boutique redescendue en gratuit
-- ============================================================

-- Un vendeur Pro peut publier autant d'articles qu'il veut. À l'échéance, son
-- catalogue ne disparaît pas — ce serait détruire son travail — mais il n'en
-- reste que sept en vitrine, jusqu'au réabonnement.
--
-- Une colonne dédiée, et non `is_active` : ce dernier appartient au vendeur,
-- qui range lui-même ses articles. Écraser son choix nous ferait rallumer à
-- tort, au réabonnement, des produits qu'il avait volontairement retirés.
alter table public.products
  add column if not exists hidden_by_plan boolean not null default false;

create index if not exists products_hidden_by_plan_idx
  on public.products (shop_id, hidden_by_plan);

-- La vitrine et le marketplace lisent tous deux par la RLS : la règle posée
-- ici s'applique donc partout, sans qu'aucune requête n'ait à la répéter.
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select
  using (
    is_active = true
    and hidden_by_plan = false
    and exists (
      select 1 from public.shops s
      where s.id = shop_id and s.is_active = true and s.published_at is not null
    )
  );

-- Combien d'articles restent visibles quand l'abonnement tombe.
create or replace function public.produits_visibles_gratuit()
returns integer
language sql
immutable
as $$ select 7; $$;

-- ============================================================
-- 2. Échéance : masquer au-delà, et rétablir au paiement
-- ============================================================

create or replace function public.expire_subscriptions()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  echus integer;
begin
  with termines as (
    update public.subscriptions
    set is_active = false, plan = 'free'
    where is_active = true
      and ends_at is not null
      and ends_at < now()
    returning user_id
  )
  select count(*) into echus from termines;

  update public.profiles p
  set is_pro = false
  where p.is_pro = true
    and not exists (
      select 1 from public.subscriptions s
      where s.user_id = p.id and s.is_active = true
        and (s.ends_at is null or s.ends_at > now())
    );

  update public.shops sh
  set is_sponsored = false
  where sh.is_sponsored = true
    and not exists (
      select 1 from public.subscriptions s
      where s.user_id = sh.user_id and s.is_active = true
        and (s.ends_at is null or s.ends_at > now())
    );

  -- Au-delà des sept plus récents, on masque. Les plus récents plutôt que les
  -- plus anciens : c'est le stock du moment, pas le premier catalogue.
  update public.products p
  set hidden_by_plan = true
  where p.hidden_by_plan = false
    and not public.is_pro_active((select user_id from public.shops where id = p.shop_id))
    and p.id not in (
      select id from public.products
      where shop_id = p.shop_id
      order by created_at desc
      limit public.produits_visibles_gratuit()
    );

  return echus;
end;
$$;

-- Le paiement rallume tout le catalogue.
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
    update public.shops set is_sponsored = true where user_id = new.user_id;

    -- Tout ce que l'échéance avait masqué revient en vitrine.
    update public.products
    set hidden_by_plan = false
    where hidden_by_plan = true
      and shop_id in (select id from public.shops where user_id = new.user_id);
  end if;

  return new;
end;
$$;

-- ============================================================
-- 3. Le numéro du vendeur n'est plus public
-- ============================================================

-- `shops_public_read` renvoyait la ligne entière : n'importe qui pouvait, avec
-- la clé anonyme, moissonner le numéro WhatsApp et le Mobile Money de tous les
-- commerçants publiés. C'est une fuite de données autant qu'une invitation à
-- court-circuiter Watshop — un acheteur qui écrit directement au vendeur passe
-- à côté de la commande, et nous n'en voyons jamais la trace.
--
-- La RLS ne sait pas filtrer colonne par colonne ; les privilèges de colonne,
-- si. Le rôle serveur, lui, garde l'accès : il en a besoin pour prévenir le
-- vendeur de ses commandes.
revoke select (whatsapp_number, mobile_money_number) on public.shops from anon;

-- Le retrait ne vise que le rôle anonyme, et c'est un choix, pas un oubli.
--
-- Un privilège de colonne se retire par rôle et non par ligne : le retirer à
-- `authenticated` empêcherait aussi le vendeur de lire son propre numéro depuis
-- son tableau de bord, où il doit pouvoir le corriger. Or les visiteurs du
-- marketplace sont anonymes — c'est là qu'est le moissonnage, et c'est là que
-- se joue le court-circuit.
--
-- Il reste donc qu'un compte connecté peut lire le numéro d'une boutique
-- publiée. Le fermer demanderait de faire passer la lecture du tableau de bord
-- par le rôle serveur ; c'est faisable, ce n'est pas fait ici, et mieux vaut
-- l'écrire que le laisser croire réglé.

-- ============================================================
-- 4. Remise à niveau de l'existant
-- ============================================================

select public.expire_subscriptions();
