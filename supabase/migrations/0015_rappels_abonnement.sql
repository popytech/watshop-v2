-- Watshop v2 — Rappels de réabonnement et délai de grâce
--
-- Delta idempotent, à appliquer après 0014.
--
-- Jusqu'ici l'accès tombait à la seconde où l'abonnement expirait, sans que le
-- vendeur ait été prévenu une seule fois. Un commerçant qui perd sa vitrine du
-- jour au lendemain ne se réabonne pas : il s'en va, et il le raconte.
--
-- Désormais cinq rappels sont envoyés avant la coupure, et l'accès se poursuit
-- trois jours au-delà de l'échéance payée. Ces trois jours ne sont pas un
-- cadeau : en Guinée, on recharge son Mobile Money quand on peut, et une
-- coupure au jour près punit un problème de trésorerie plutôt qu'un abandon.

-- ============================================================
-- Le délai de grâce
-- ============================================================

-- Combien de jours l'accès survit à l'échéance payée. Le cinquième rappel part
-- l'avant-veille de la coupure, il faut donc au moins trois jours ici.
create or replace function public.jours_de_grace()
returns integer
language sql
immutable
as $$ select 3; $$;

-- L'accès court jusqu'à l'échéance **plus** la grâce. `ends_at` garde son sens :
-- la fin de la période payée, celle à laquelle les rappels se rapportent.
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
      and (
        s.ends_at is null
        or s.ends_at + make_interval(days => public.jours_de_grace()) > now()
      )
  );
$$;

-- La fermeture attend elle aussi la fin de la grâce.
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
      and ends_at + make_interval(days => public.jours_de_grace()) < now()
    returning user_id
  )
  select count(*) into echus from termines;

  update public.profiles p
  set is_pro = false
  where p.is_pro = true and not public.is_pro_active(p.id);

  update public.shops sh
  set is_sponsored = false
  where sh.is_sponsored = true and not public.is_pro_active(sh.user_id);

  update public.products p
  set hidden_by_plan = true
  where p.hidden_by_plan = false
    and exists (
      select 1
      from public.shops sh
      join public.subscriptions s on s.user_id = sh.user_id
      where sh.id = p.shop_id
        and s.ends_at is not null
        and not public.is_pro_active(sh.user_id)
    )
    and p.id not in (
      select id from public.products
      where shop_id = p.shop_id
      order by created_at desc
      limit public.produits_visibles_gratuit()
    );

  return echus;
end;
$$;

-- ============================================================
-- Trace des rappels envoyés
-- ============================================================

-- Sans elle, la tâche quotidienne renverrait le même rappel chaque jour tant
-- que le palier reste franchi. Cinq rappels utiles valent mieux que trente
-- messages qu'on finit par bloquer.
create table if not exists public.subscription_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Palier atteint, en jours par rapport à l'échéance : -7, -3, -1, 0, +2.
  palier smallint not null,
  -- L'échéance visée. Elle fait partie de la clé : au réabonnement suivant,
  -- une nouvelle échéance permet de renvoyer la série sans purger la table.
  ends_at timestamptz not null,
  channels text[] not null default '{}',
  sent_at timestamptz not null default now(),
  unique (user_id, palier, ends_at)
);

create index if not exists subscription_reminders_user_idx
  on public.subscription_reminders (user_id, ends_at desc);

alter table public.subscription_reminders enable row level security;

-- Écrit par le rôle serveur, lu par les administrateurs. Un vendeur n'a rien à
-- y faire : ce sont nos traces d'envoi, pas ses données.
drop policy if exists "subscription_reminders_admin_all" on public.subscription_reminders;
create policy "subscription_reminders_admin_all" on public.subscription_reminders
  for all using (public.is_admin()) with check (public.is_admin());
