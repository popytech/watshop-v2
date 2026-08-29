# Phase 3 — Boutique publique

Le storefront vu par les acheteurs. C'est aussi ce qui rend vivants les
compteurs du tableau de bord vendeur.

---

## 1. Réglage Supabase

Une seule migration : `supabase/migrations/0003_phase3_boutique_publique.sql`
(base neuve → `supabase/schema.sql` contient déjà tout).

Elle ajoute `products.slug` et remplit les produits existants. **Aucune policy
RLS n'est ouverte au public au passage** — voir la section 4.

---

## 2. Les pages

| Route | Rôle |
|---|---|
| `/<boutique>` | Catalogue, description, bouton « Contacter », partage |
| `/<boutique>/produit/<produit>` | Fiche produit, photos, taille, quantité |
| `/<boutique>/panier` | Panier et formulaire de commande |
| `/<boutique>/commande/<id>` | Confirmation, avec le numéro de commande |

Les adresses produits sont lisibles : `/chez-mariama/produit/robe-africaine-a3f9c1`.
Le suffixe court vient de l'identifiant — il garantit l'unicité sans logique de
collision. **Le slug est figé à la création** : renommer un produit ne casse pas
les liens déjà partagés sur WhatsApp.

La couleur choisie par le vendeur est injectée dans le token `--primary` du
layout de boutique. Tous les composants `ui/` en héritent sans qu'aucun d'eux
n'ait à connaître la boutique — c'est exactement ce que le legacy faisait en
codant `#25d366` en dur 87 fois dans une seule page.

---

## 3. Le parcours d'achat

Le panier vit dans le navigateur de l'acheteur (`localStorage`, une clé par
boutique) : il n'a pas de compte, rien à créer côté serveur avant la commande.
Il est lu via `useSyncExternalStore`, donc le bouton panier de l'en-tête et la
page panier partagent le même état sans contexte React.

Deux chemins mènent à la commande, et c'est ce qui alimente **les deux
compteurs distincts** du tableau de bord :

- **« Ajouter au panier »** puis le panier → commande enregistrée en
  `source = 'storefront'`
- **« Commander sur WhatsApp »** depuis une fiche produit → même formulaire,
  mais commande enregistrée en `source = 'whatsapp'`

Dans les deux cas le vendeur reçoit la commande sur WhatsApp via Fonnte, avec
le détail, le total et les coordonnées du client. L'envoi est « best effort » :
la commande est déjà enregistrée, un échec d'envoi ne la fait pas disparaître,
et son statut est conservé dans `orders.seller_notification_status`.

---

## 4. Sécurité : ce qui n'a pas été fait, et pourquoi

L'acheteur n'a pas de compte. Deux opérations lui sont pourtant nécessaires :
créer sa commande, et relire sa confirmation. La solution facile aurait été
d'ouvrir `orders` en lecture publique (`select using (true)`) — **c'est un vol
de données** : le nom, le téléphone et l'adresse de tous les clients de toutes
les boutiques deviendraient lisibles par n'importe qui.

Les deux opérations passent donc par le serveur avec la clé `service_role`, sur
l'identifiant exact tiré de l'URL (un uuid v4, non énumérable), et rien d'autre
n'est renvoyé. Une commande est de plus vérifiée comme appartenant bien à la
boutique de l'URL.

La création de commande revérifie tout côté serveur :

- la boutique existe, est active et publiée ;
- chaque produit appartient à cette boutique et est actif ;
- **les prix sont relus en base**, jamais repris du panier envoyé par le client ;
- la zone de livraison, si elle est fournie, appartient bien à cette boutique.

Sans cela, un acheteur pourrait se fixer ses propres prix depuis la console de
son navigateur.

---

## 4 bis. Quand la notification WhatsApp n'arrive pas

`orders.seller_notification_status` passe à `failed` et la raison exacte est
journalisée côté serveur. Le premier réflexe est de vérifier l'état de
l'appareil Fonnte, qui se déconnecte dès que la session WhatsApp du téléphone
lié expire :

```bash
curl -X POST https://api.fonnte.com/device -H "Authorization: $FONNTE_TOKEN"
```

`device_status: "disconnect"` signifie que le token est valide mais qu'aucun
téléphone n'est relié : reconnecter l'appareil dans le tableau de bord Fonnte
(scan du QR code). La réponse donne aussi le quota restant du forfait.

---

## 5. Visiteurs et vie privée

Le compteur de visiteurs est alimenté par `POST /api/visites`, appelé depuis le
navigateur une fois la page affichée — compter pendant le rendu serveur
gonflerait le chiffre à chaque préchargement de lien.

**Aucune adresse IP n'est conservée.** Seule une empreinte SHA-256 de
(IP + user agent + sel) sert à distinguer deux visiteurs, et un même visiteur
n'est compté qu'une fois par demi-heure et par boutique. Le sel se règle avec
`VISIT_HASH_SALT` — mettre une valeur aléatoire en production.

---

## 6. SEO

`generateMetadata` par boutique et par produit (titre, description, Open Graph
avec le logo ou la photo du produit), données structurées JSON-LD `Store` et
`Product` (prix, disponibilité, vendeur), plus `robots.txt` et `sitemap.xml`
qui ne listent que les boutiques publiées. Panier et confirmation sont en
`noindex`.

---

## 7. Vérifier que ça marche

```bash
npm run dev
```

1. Publier une boutique, puis ouvrir `/<slug>` en navigation privée : le
   catalogue s'affiche sans être connecté.
2. Dépublier la boutique (`published_at` à `null` en base) → la page renvoie
   « Boutique introuvable ». Un produit masqué disparaît du catalogue.
3. Ajouter un produit au panier, recharger la page : le panier est conservé.
4. Passer une commande → confirmation avec le numéro, panier vidé, et la
   commande apparaît dans `/dashboard/commandes`.
5. Vérifier le compteur « Commandes WhatsApp » : il n'augmente que si on est
   passé par « Commander sur WhatsApp » depuis une fiche produit.
6. Ouvrir `/sitemap.xml` : seules les boutiques publiées y figurent.
7. Dans la console du navigateur, tenter de modifier un prix du panier avant
   d'envoyer : le total enregistré doit rester celui de la base.
