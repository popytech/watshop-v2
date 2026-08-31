-- Watshop v2 — Le numéro du vendeur, vraiment retiré au public
--
-- Delta idempotent, à appliquer après 0016.
--
-- La migration 0013 croyait fermer cette porte :
--
--     revoke select (whatsapp_number, mobile_money_number) on public.shops from anon;
--
-- Elle n'a rien fait. Postgres ne retire pas un privilège de colonne à un rôle
-- qui détient le SELECT sur la table entière : le privilège large l'emporte, et
-- la commande passe sans erreur. Vérification faite avec la clé anonyme, le
-- numéro WhatsApp de tous les commerçants publiés restait lisible.
--
-- L'ordre correct est l'inverse : retirer le SELECT global, puis rendre une à
-- une les colonnes que le public a le droit de lire.

revoke select on public.shops from anon;

grant select (
  id,
  user_id,
  name,
  slug,
  description,
  country_code,
  currency_symbol,
  logo_url,
  cover_url,
  primary_color,
  category,
  published_at,
  is_active,
  is_verified,
  is_sponsored,
  created_at
) on public.shops to anon;

-- Restent hors de portée du rôle anonyme :
--
--   whatsapp_number, mobile_money_number  les coordonnées du commerçant, qu'un
--       robot pouvait moissonner d'un seul appel — et par lesquelles un acheteur
--       pouvait traiter en direct, hors de toute commande ;
--   onboarding_step, created_by_agent_id  notre cuisine interne, qui n'apprend
--       rien à un visiteur et renseigne un concurrent sur notre fonctionnement.
--
-- Conséquence à ne pas manquer : `select("*")` échoue désormais pour le rôle
-- anonyme, Postgres refusant la requête dès qu'une colonne manque au lot. Les
-- deux lectures publiques concernées — la vitrine et l'annuaire du marketplace —
-- nomment leurs colonnes (voir COLONNES_PUBLIQUES dans src/lib/shop/public.ts).
--
-- Le rôle `authenticated` garde l'accès complet : le vendeur lit et corrige son
-- propre numéro depuis son tableau de bord, et c'est la policy `shops_owner_all`
-- qui limite cette lecture à sa boutique. Un compte connecté peut donc encore
-- lire le numéro d'une boutique publiée — pour le fermer il faudrait faire
-- passer le tableau de bord par le rôle serveur, ce qui n'est pas fait ici.
