-- Watshop v2 — Le masquage ne vise que les abonnements échus
--
-- Delta idempotent, à appliquer après 0013.
--
-- Défaut corrigé ici : `expire_subscriptions()` masquait tout ce qui dépassait
-- sept articles chez **n'importe quel** compte non-Pro, y compris un vendeur
-- gratuit qui n'a jamais payé. Or l'offre gratuite en autorise dix. Un nouveau
-- vendeur qui en publiait huit, neuf ou dix en voyait donc trois disparaître au
-- premier passage de la tâche planifiée, sans avoir rien perdu ni rien dû.
--
-- La règle voulue est autre : la réduction à sept est ce que coûte un
-- abonnement qu'on laisse tomber, pas l'ordinaire du gratuit.
--
--   jamais payé      → dix articles, tous visibles
--   Pro en cours     → illimité, tous visibles
--   Pro échu         → sept visibles, le reste masqué jusqu'au réabonnement
--
-- `subscriptions.ends_at` distingue les deux : elle n'est renseignée que par la
-- confirmation d'un paiement. Non nulle, elle signe un abonnement qui a existé.

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
    and not public.is_pro_active(p.id);

  update public.shops sh
  set is_sponsored = false
  where sh.is_sponsored = true
    and not public.is_pro_active(sh.user_id);

  -- Masquage réservé aux comptes qui ont payé puis laissé filer.
  update public.products p
  set hidden_by_plan = true
  where p.hidden_by_plan = false
    and exists (
      select 1
      from public.shops sh
      join public.subscriptions s on s.user_id = sh.user_id
      where sh.id = p.shop_id
        and s.ends_at is not null
        and s.ends_at < now()
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

-- Rend leur vitrine aux comptes masqués à tort : ceux qui n'ont jamais eu
-- d'abonnement, donc jamais rien perdu.
update public.products p
set hidden_by_plan = false
where p.hidden_by_plan = true
  and not exists (
    select 1
    from public.shops sh
    join public.subscriptions s on s.user_id = sh.user_id
    where sh.id = p.shop_id and s.ends_at is not null
  );
