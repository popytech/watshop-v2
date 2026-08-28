# Phase 2 — Onboarding et tableau de bord vendeur

Ce que le code fait, et les **deux réglages Supabase** à faire avant de tester.

---

## 1. Réglages Supabase

### 1.1 Appliquer le schéma

- Base déjà en place (Phase 1 appliquée) → exécuter `supabase/migrations/0002_phase2_boutique.sql`.
- Base neuve → `supabase/schema.sql` contient déjà tout.

### 1.2 Vérifier le bucket d'images

La migration crée le bucket `shop-media` et ses policies. Vérifier dans **Storage** qu'il est
bien présent et **public** en lecture. Si l'insertion dans `storage.buckets` a échoué (droits),
le créer à la main : nom `shop-media`, public, puis relancer la fin du fichier de migration pour
les policies.

> **Stockage** : Cloudflare R2 reste la cible (ROADMAP, section 3), mais ses accès ne sont pas
> fournis. En attendant, les images passent par Supabase Storage — même projet, aucune clé
> supplémentaire. Un seul fichier changera le jour du basculement : `src/lib/storage.ts`.

---

## 2. Le parcours de création, en 6 étapes

| Étape | Route | Ce qu'on demande |
|---|---|---|
| 1 | *(Phase 1)* | Le compte, déjà créé à l'inscription |
| 2 | `/onboarding/boutique` | Nom, adresse (slug), catégorie, pays, description |
| 3 | `/onboarding/apparence` | Logo et couleur |
| 4 | `/onboarding/produits` | Au moins un produit |
| 5 | `/onboarding/whatsapp` | Numéro WhatsApp, et Mobile Money **facultatif** |
| 6 | `/onboarding/publication` | Récapitulatif, puis publication |

L'avancement est stocké en base (`shops.onboarding_step`) : on peut fermer l'onglet et reprendre
où on s'était arrêté. `/onboarding` redirige tout seul vers la bonne étape.

**Mobile Money** est facultatif, volontairement : GNAKRYPAY n'a pas encore donné ses accès API,
et une étape bloquante sur un service indisponible empêcherait de publier une boutique. Le champ
sert pour l'instant à indiquer où les clients peuvent envoyer l'argent.

**Publication** : une boutique n'est visible du public qu'une fois `published_at` renseigné. Trois
conditions sont vérifiées côté serveur avant : un nom et une adresse, au moins un produit, un
numéro WhatsApp.

---

## 3. Le tableau de bord

`/dashboard` affiche les quatre chiffres du jour, puis les commandes récentes :

- **Commandes** — commandes du jour, annulées exclues
- **Ventes** — somme des montants du jour, en format court (`4,85 M GNF`)
- **Visiteurs** — visites du jour, table `shop_visits`
- **Commandes WhatsApp** — celles dont `source = 'whatsapp'`

> ⚠️ **Visiteurs et commandes WhatsApp resteront à 0** tant que la Phase 3 n'existe pas : c'est la
> boutique publique qui enregistrera les visites et créera les commandes. Les colonnes et la table
> sont en place pour qu'elle n'ait qu'à écrire dedans.

Le reste : `/dashboard/produits` (liste, création, modification, masquage, suppression),
`/dashboard/commandes` (liste, détail, changement de statut, lien WhatsApp vers le client) et
`/dashboard/boutique` (réglages et partage).

**Partage** : WhatsApp et Facebook ouvrent une vraie fenêtre de partage. Instagram et TikTok n'en
proposent pas depuis le web : ces deux boutons copient le message tout prêt, à coller dans une bio
ou une story.

---

## 4. Choix de conception à connaître

- **Adresse des boutiques** : `watshop.africa/<slug>`, un segment de chemin à la racine. Les slugs
  partagent donc l'espace de noms des routes de l'app, d'où la liste de segments réservés dans
  `src/lib/tenant.ts` — et la même règle rappelée en contrainte SQL.
- **Provenance des commandes** : nouvelle colonne `orders.source` (`storefront` / `whatsapp` /
  `manual`). Sans elle, « commandes » et « commandes WhatsApp » afficheraient le même chiffre.
- **Journée de référence** : la Guinée est à UTC+0, la journée civile et la journée UTC coïncident.
  À revoir si Watshop s'étend à un pays qui n'est pas sur GMT (`startOfToday()`).
- **Écritures** : toutes passent par le client de l'utilisateur connecté. La RLS refuse une
  écriture sur une boutique qui n'est pas la sienne, même si un identifiant était falsifié dans un
  formulaire. Aucune clé `service_role` dans ce parcours.

---

## 5. Vérifier que ça marche

```bash
npm run dev
```

1. Créer un compte neuf → on arrive sur `/onboarding/boutique` (pas sur le tableau de bord).
2. Dérouler les 6 étapes. Vérifier qu'un slug réservé (`dashboard`, `admin`) est refusé.
3. À l'étape 4, ajouter un produit avec une photo → il apparaît dans la liste au-dessus du
   formulaire.
4. Publier → redirection vers `/dashboard?bienvenue=1`, avec le panneau de partage.
5. Fermer l'onglet à l'étape 3, revenir sur `/onboarding` → on repart à l'étape 3.
6. `/dashboard/produits` → modifier un prix, masquer un produit, en supprimer un (confirmation).
7. `/dashboard/boutique` → changer la couleur et le logo, vérifier que le lien de partage se copie.
