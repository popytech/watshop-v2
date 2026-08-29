# Phase 4 — Réseau et paiements

Les rôles qui font vivre la plateforme autour du vendeur, et le module qui
attend GNAKRYPAY.

---

## 1. Réglages

**Migration** : `supabase/migrations/0004_phase4_reseau_paiements.sql`
(base neuve → `supabase/schema.sql` contient déjà tout).

**Variable** : `WATSHOP_MOBILE_MONEY_NUMBER` — le numéro vers lequel les vendeurs
transfèrent pour passer en Pro. Tant qu'il est vide, l'écran d'abonnement le dit
au lieu d'afficher un numéro faux.

**Le rôle se choisit à l'inscription** : vendeur, revendeur, agent ou livreur.
La migration `0005` ajoute le rôle `reseller` et fait porter ce choix par les
métadonnées d'inscription.

> ⚠️ Ce choix vient du navigateur. Le trigger applique donc une **liste blanche**
> côté base : `admin` n'y figure pas et ne peut pas être obtenu en modifiant la
> requête. Et une fois le compte créé, le rôle ne se change plus tout seul — le
> trigger anti-escalade de la Phase 1 le refuse.

Pour corriger un rôle après coup, ou nommer un administrateur :

```sql
update public.profiles set role = 'admin' where email = 'vous@exemple.com';
```

Les codes (`AG…` pour l'agent, `RV…` pour le revendeur) sont attribués par un
trigger dès le passage au rôle. Ils sont dérivés de l'identifiant : stables, et
sans tirage aléatoire à réessayer en cas de collision.

### Un point à trancher côté métier

Un compte peut se déclarer **agent** tout seul, donc générer un code de
parrainage et recruter. Le garde-fou financier existe déjà en aval — les
versements passent par `agent_commission_payouts`, créés par un administrateur,
jamais automatiquement. Rien n'est donc payé sans validation humaine. Si tu
préfères filtrer en amont, il faudra un écran de validation des agents.

---

## 2. Agents commerciaux — `/agent`

L'agent partage `watshop.africa/register?agent=AG123456`. Tout vendeur inscrit
par ce lien lui est rattaché **à l'inscription, en base** : le trigger
`handle_new_user` résout le code et pose `profiles.agent_id`. Le faire côté
application aurait laissé la porte ouverte à un vendeur qui se réattribuerait un
parrain après coup.

Son écran affiche les vendeurs recrutés, ceux dont la boutique est publiée, ceux
passés en Pro, et les commissions.

> **La commission n'est due que pour une boutique publiée.** Recruter un compte
> vide ne rapporte rien — sinon le programme récompenserait le volume
> d'inscriptions plutôt que l'activité réelle. Le montant par vendeur est dans
> `profiles.agent_commission` (10 000 GNF par défaut), réglable agent par agent.

**Ce qu'un agent ne voit pas** : les commandes, les clients, le chiffre
d'affaires, les autres boutiques. Deux policies seulement l'autorisent à lire les
profils dont il est l'`agent_id` et leurs boutiques. Un agent n'est pas un
demi-admin.

---

## 3. Livreurs partenaires — `/livreur`

Le vendeur ajoute ses livreurs dans **Livraison**, avec leur numéro WhatsApp. Si
un compte Watshop existe déjà avec ce numéro, il est rattaché automatiquement et
le livreur voit ses courses dans son espace ; sinon la fiche reste un simple
contact.

Le vendeur confie une commande depuis sa fiche. Le livreur voit alors l'adresse,
le téléphone du client, le montant à encaisser, et peut marquer la commande
« en route » puis « livrée ».

> **Un livreur ne peut qu'avancer une commande.** Ni l'annuler, ni la remettre en
> attente, ni toucher au montant, au client ou à la boutique. La policy `UPDATE`
> ne sait pas comparer l'ancienne et la nouvelle ligne : c'est un trigger
> (`guard_delivery_order_update`) qui l'impose, comme pour l'escalade de
> privilèges des profils.

---

## 4. Paiements — `/dashboard/abonnement`

Deux fournisseurs déclarés, un seul opérationnel :

| | |
|---|---|
| **Mobile Money** | Le vendeur transfère, puis déclare la référence. Un admin confirme depuis `/admin/paiements`. |
| **GNAKRYPAY** | Affiché, grisé, avec la raison : accès API non fournis. |

**Le point de conception** : le passage en Pro ne dépend d'aucun fournisseur. Il
est déclenché **en base**, par le trigger `payments_apply_confirmed`, dès qu'une
ligne de `payments` passe à `confirmed`. Que la confirmation vienne de l'écran
admin d'aujourd'hui ou d'un webhook GNAKRYPAY demain, l'abonnement suit — sans
que la règle soit réécrite.

Brancher l'agrégateur consistera donc à écrire une implémentation dans
`src/lib/payment/` et une route de webhook. Ni le schéma, ni la logique
d'abonnement ne bougeront.

> Un vendeur déclare son paiement, il ne le confirme pas : un trigger refuse
> qu'il change lui-même le statut ou le montant.

---

## 4 bis. Revendeurs — `/revendeur`

Le programme d'affiliation produit existait en base depuis la Phase 0
(`affiliate_code`, `affiliate_referrals`, `products.reseller_commission_pct`)
sans qu'aucun rôle ne permette de s'en servir. C'est maintenant le cas.

Le vendeur fixe une **commission revendeur** par produit, dans le formulaire
produit (0 % par défaut = produit non proposé). Le revendeur voit dans son
espace tous les produits qui en offrent une, avec le gain correspondant, et
copie son lien : `/<boutique>/produit/<produit>?ref=RV123456`.

Le code est mémorisé dans le navigateur de l'acheteur **par boutique, pendant
7 jours** : sans ça, un visiteur qui arrive par le lien puis navigue avant de
commander ferait perdre sa commission au revendeur. Une durée plus longue
reviendrait à payer pour une vente qu'il n'a pas provoquée.

À la commande, la commission est calculée avec le pourcentage **relu en base**,
produit par produit — jamais celui transmis par le client — et créée en
`pending`. Elle ne devient acquise que lorsque la commande est livrée : sinon
une commande annulée paierait quand même.

L'enregistrement des clics passe par le serveur (`/api/affiliation`) :
`affiliate_clicks` n'a aucune policy d'insertion, un revendeur ne peut donc pas
gonfler ses propres chiffres depuis son compte.

---

## 5. Vérifier que ça marche

1. Passer un compte en `agent` par SQL, se connecter → on atterrit sur `/agent`,
   le code `AG…` est affiché.
2. Ouvrir le lien de parrainage en navigation privée, créer un compte → il
   apparaît dans « Vendeurs recrutés », marqué « En cours » tant que sa boutique
   n'est pas publiée.
3. Ajouter un livreur avec le numéro d'un compte existant → « Compte lié ».
4. Confier une commande à ce livreur, se connecter avec son compte → la course
   apparaît. La marquer livrée ; le statut change côté vendeur.
5. Tenter depuis ce compte livreur de passer une commande à `cancelled` (via
   l'API) → refusé par le trigger.
6. Déclarer un paiement, le confirmer depuis `/admin/paiements` → le vendeur
   passe en Pro et `subscriptions.ends_at` avance d'un mois.
7. S'inscrire en choisissant « Revendeur » → on atterrit sur `/revendeur` avec un
   code `RV…`. Mettre une commission sur un produit côté vendeur, copier le lien,
   l'ouvrir en navigation privée, commander → la commission apparaît en attente.
8. Tenter de s'inscrire en forçant `role=admin` dans la requête → le compte est
   créé en `user`.
