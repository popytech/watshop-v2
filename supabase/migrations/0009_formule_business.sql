-- Watshop v2 — troisième formule d'abonnement
--
-- Delta idempotent, à appliquer après 0008.
--
-- Le schéma ne connaissait que 'free' et 'pro'. La grille tarifaire en propose
-- trois : la valeur manquante est ajoutée ici pour que la base et la page
-- publique disent la même chose.

-- Même précaution que pour 'reseller' (migration 0005) : la nouvelle valeur
-- n'est comparée nulle part dans ce fichier, donc rien n'exige qu'elle soit
-- déjà validée.
alter type subscription_plan add value if not exists 'business';
