-- Watshop v2 — dossier de candidature des agents
--
-- Delta idempotent, à appliquer après 0006.
--
-- Valider un agent sur son seul nom n'a pas de sens : l'écran d'administration
-- montrait un code et une date. Il lui faut un dossier — photo, identité, ville,
-- activité — pour décider en connaissance de cause.
--
-- ⚠️ Ces pièces ne vont PAS dans le bucket shop-media, qui est public : une
-- photo de carte d'identité accessible par URL serait une fuite de données
-- personnelles. Un bucket privé est créé pour ça, lisible seulement par son
-- propriétaire et les administrateurs.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'agent_application_status') then
    create type agent_application_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.agent_applications (
  -- Un dossier par compte : re-candidater met à jour le même, avec l'historique
  -- du refus précédent sous les yeux.
  user_id uuid primary key references public.profiles (id) on delete cascade,
  photo_url text not null,
  id_document_url text,
  city text not null,
  neighborhood text,
  occupation text,
  motivation text,
  status agent_application_status not null default 'pending',
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists agent_applications_status_idx
  on public.agent_applications (status, submitted_at desc);

alter table public.agent_applications enable row level security;

drop policy if exists "agent_applications_self_read" on public.agent_applications;
create policy "agent_applications_self_read" on public.agent_applications for select
  using (auth.uid() = user_id);

drop policy if exists "agent_applications_self_write" on public.agent_applications;
create policy "agent_applications_self_write" on public.agent_applications for insert
  with check (auth.uid() = user_id);

drop policy if exists "agent_applications_self_update" on public.agent_applications;
create policy "agent_applications_self_update" on public.agent_applications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "agent_applications_admin_all" on public.agent_applications;
create policy "agent_applications_admin_all" on public.agent_applications for all
  using (public.is_admin()) with check (public.is_admin());

-- Un candidat renseigne son dossier, il ne s'accorde pas le statut.
create or replace function public.guard_agent_application_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.rejection_reason is distinct from old.rejection_reason
     or new.reviewed_at is distinct from old.reviewed_at then
    raise exception 'Statut réservé aux administrateurs';
  end if;

  return new;
end;
$$;

drop trigger if exists agent_applications_guard_status on public.agent_applications;
create trigger agent_applications_guard_status
  before update on public.agent_applications
  for each row execute function public.guard_agent_application_status();

-- ============================================================
-- Bucket privé pour les pièces
-- ============================================================

do $$
begin
  insert into storage.buckets (id, name, public)
  values ('agent-documents', 'agent-documents', false)
  on conflict (id) do nothing;

  -- Chemin : <user_id>/<fichier>. Le candidat écrit et relit son dossier, un
  -- administrateur lit tous les dossiers. Personne d'autre, et jamais par URL
  -- publique — la lecture passe par une URL signée à durée limitée.
  execute $p$
    drop policy if exists "agent_docs_owner_read" on storage.objects
  $p$;
  execute $p$
    create policy "agent_docs_owner_read" on storage.objects for select to authenticated
      using (
        bucket_id = 'agent-documents'
        and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
      )
  $p$;

  execute $p$
    drop policy if exists "agent_docs_owner_insert" on storage.objects
  $p$;
  execute $p$
    create policy "agent_docs_owner_insert" on storage.objects for insert to authenticated
      with check (
        bucket_id = 'agent-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
  $p$;

  execute $p$
    drop policy if exists "agent_docs_owner_update" on storage.objects
  $p$;
  execute $p$
    create policy "agent_docs_owner_update" on storage.objects for update to authenticated
      using (
        bucket_id = 'agent-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
  $p$;

exception
  when duplicate_object then
    raise notice 'Policies du bucket agent-documents déjà en place.';
  when insufficient_privilege then
    raise notice 'Droits insuffisants sur storage.objects : créer le bucket PRIVÉ « agent-documents » dans Storage, puis ses policies depuis l''interface. Le reste de la migration est appliqué.';
end $$;
