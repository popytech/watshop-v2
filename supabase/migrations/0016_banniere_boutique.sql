-- Watshop v2 — Bannière de boutique
--
-- Delta idempotent, à appliquer après 0015.
--
-- Le bandeau d'ouverture d'une vitrine n'avait que la couleur du vendeur pour
-- se distinguer. Une photo large — l'atelier, l'étal, une pièce phare — dit en
-- une seconde ce qu'une description met trois lignes à expliquer, et c'est ce
-- que voit d'abord le visiteur arrivé d'un lien WhatsApp.
--
-- Facultative : sans elle, le bandeau retombe sur la première photo du
-- catalogue, puis sur la couleur seule. Personne n'a de vitrine cassée parce
-- qu'il n'a pas encore téléversé de bannière.

alter table public.shops add column if not exists cover_url text;
