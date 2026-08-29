-- Watshop v2 — Phase 5 : notifications push
--
-- Delta idempotent, à appliquer après 0007.
--
-- push_tokens datait de la Phase 0, pensée pour Firebase Cloud Messaging : une
-- colonne `token` suffisait. On passe au Web Push standard (VAPID), qui n'a
-- besoin d'aucun compte tiers — mais qui exige trois éléments par abonnement :
-- l'endpoint du navigateur, et deux clés de chiffrement.

alter table public.push_tokens add column if not exists p256dh text;
alter table public.push_tokens add column if not exists auth text;

comment on column public.push_tokens.token is
  'Endpoint Web Push renvoyé par le navigateur. Unique : un même appareil ne
   s''abonne qu''une fois.';

-- Un abonnement expire, ou est révoqué par le navigateur. Savoir quand il a
-- servi pour la dernière fois permet de faire le ménage.
alter table public.push_tokens add column if not exists last_used_at timestamptz;

-- La diffusion se fait côté serveur, avec la clé service_role : elle doit lire
-- les abonnements de tout le monde, et supprimer ceux que le navigateur rejette.
-- Les policies existantes (push_tokens_self_all, push_tokens_admin_all) suffisent
-- pour le reste.
