-- Watshop v2 — Infolettre
--
-- Delta idempotent, à appliquer après 0010. Une base neuve peut partir de
-- supabase/schema.sql, qui contient déjà tout ceci.
--
-- Le pied de page propose de laisser son adresse pour être prévenu des
-- nouveautés. Sans table, le champ ne serait qu'un décor — et un champ qui fait
-- semblant de collecter une adresse est pire qu'un champ absent.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  -- D'où vient l'inscription : pied de page, accueil, autre. Utile le jour où
  -- on voudra savoir ce qui convertit, sans avoir à le deviner après coup.
  source text not null default 'footer',
  -- Le consentement est explicite (case à cocher) : on garde le moment où il a
  -- été donné, c'est ce qui le rend démontrable.
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);

alter table public.newsletter_subscribers enable row level security;

-- Personne ne lit cette table depuis le navigateur.
--
-- L'inscription passe par une action serveur qui écrit avec la clé de service :
-- ouvrir un `insert` au public laisserait n'importe qui la remplir depuis la
-- console, et un `select` exposerait les adresses de tous les inscrits. Seul un
-- admin lit, et c'est déjà ce que fait is_admin().
drop policy if exists "newsletter_admin_all" on public.newsletter_subscribers;
create policy "newsletter_admin_all" on public.newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());
