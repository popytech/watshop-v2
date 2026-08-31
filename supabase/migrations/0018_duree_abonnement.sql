-- Watshop v2 — Payer plusieurs mois d'avance
--
-- Delta idempotent, à appliquer après 0017.
--
-- La confirmation d'un paiement ajoutait un mois, toujours un, quel que soit le
-- montant reçu. Un vendeur qui voulait régler son année n'avait aucun moyen de
-- le faire — et nous aucun moyen de le lui accorder.
--
-- La durée achetée est désormais portée par la ligne de paiement elle-même. Elle
-- doit l'être : la période s'accorde au moment où le paiement est confirmé, et
-- ce moment peut survenir des jours plus tard, par un webhook ou par un
-- administrateur. Rien d'autre ne se souviendrait alors de ce qui a été acheté.

alter table public.payments
  add column if not exists months smallint not null default 1
  check (months between 1 and 12);

comment on column public.payments.months is
  'Nombre de mois achetés par ce paiement. La confirmation les ajoute à l''échéance.';

-- La confirmation ajoute la durée achetée, et non plus un mois forfaitaire.
create or replace function public.apply_confirmed_payment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'confirmed' and (old.status is null or old.status <> 'confirmed') then
    new.confirmed_at := coalesce(new.confirmed_at, now());

    -- `greatest` fait que payer d'avance prolonge au lieu de remettre à zéro :
    -- un vendeur qui renouvelle trois jours avant l'échéance ne perd pas ces
    -- trois jours. Cela vaut d'autant plus pour une année entière.
    update public.subscriptions
    set plan = 'pro',
        is_active = true,
        payment_reference = new.reference,
        ends_at = greatest(coalesce(ends_at, now()), now())
                  + make_interval(months => greatest(new.months, 1))
    where user_id = new.user_id;

    update public.profiles set is_pro = true where id = new.user_id;
    update public.shops set is_sponsored = true where user_id = new.user_id;

    update public.products
    set hidden_by_plan = false
    where hidden_by_plan = true
      and shop_id in (select id from public.shops where user_id = new.user_id);
  end if;

  return new;
end;
$$;
