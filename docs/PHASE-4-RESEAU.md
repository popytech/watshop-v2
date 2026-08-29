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

**Attribuer un rôle** — il n'y a volontairement pas d'écran pour ça :

```sql
update public.profiles set role = 'agent'    where email = 'agent@exemple.com';
update public.profiles set role = 'delivery' where phone = '224622123456';
```

Le code agent (`AG` + 6 caractères) est attribué par un trigger dès le passage au
rôle `agent`. Il est dérivé de l'identifiant : stable, et sans tirage aléatoire à
réessayer en cas de collision.

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
