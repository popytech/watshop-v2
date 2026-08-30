-- Watshop v2 — Rendre l'abonnement effectif
--
-- Delta idempotent, à appliquer après 0011.
--
-- Constat qui a motivé cette migration : un vendeur qui payait ne recevait
-- rien. Le déclencheur posait bien `is_pro` et prolongeait l'abonnement, mais
--
--   1. `shops.is_sponsored` n'était jamais activé. Or c'est la seule promesse
--      de l'offre Pro qui soit déjà branchée côté lecture : le marketplace trie
--      dessus depuis sa création. « Boutique mise en avant » était donc vendu
--      sans être livré.
--
--   2. Rien ne redescendait jamais. Un mois payé valait un accès à vie : ni
--      `is_pro`, ni `is_active`, ni la mise en avant ne retombaient à
--      l'échéance. Sans renouvellement, il n'y a pas d'abonnement.

-- ============================================================
-- Confirmation d'un paiement
-- ============================================================

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

    -- La mise en avant, enfin livrée. Le marketplace la lisait déjà.
    update public.shops set is_sponsored = true where user_id = new.user_id;
  end if;

  return new;
end;
$$;

-- ============================================================
-- Échéance
-- ============================================================

-- Retire l'accès Pro des abonnements arrivés à terme.
--
-- Écrite pour être rejouée sans dommage et à n'importe quelle fréquence : elle
-- ne touche que les lignes réellement échues, et ne remonte jamais un accès.
-- À appeler par une tâche planifiée (pg_cron, ou l'ordonnanceur de Supabase) ;
-- en attendant, l'application ne se fie pas à ce drapeau pour décider, elle
-- relit `subscriptions.ends_at` (voir src/lib/payment/access.ts).
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
      where s.user_id = p.id
        and s.is_active = true
        and (s.ends_at is null or s.ends_at > now())
    );

  update public.shops sh
  set is_sponsored = false
  where sh.is_sponsored = true
    and not exists (
      select 1 from public.subscriptions s
      where s.user_id = sh.user_id
        and s.is_active = true
        and (s.ends_at is null or s.ends_at > now())
    );

  return echus;
end;
$$;

-- Lecture seule, sans effet de bord : dit si un compte est Pro à l'instant T.
-- Sert de référence unique, pour que l'application et la base ne puissent pas
-- répondre différemment à la même question.
create or replace function public.is_pro_active(uid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.is_active = true
      and s.plan <> 'free'
      and (s.ends_at is null or s.ends_at > now())
  );
$$;

-- ============================================================
-- Remise à niveau de l'existant
-- ============================================================

-- Les boutiques dont le vendeur est déjà Pro n'avaient jamais été mises en
-- avant, faute de déclencheur qui le fasse.
update public.shops sh
set is_sponsored = true
where sh.is_sponsored = false
  and public.is_pro_active(sh.user_id);

-- Et l'inverse : ce qui traînait en avant sans abonnement valide.
select public.expire_subscriptions();
