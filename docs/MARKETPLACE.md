# Marketplace

Jusqu'ici, une boutique Watshop ne se trouvait qu'en connaissant son adresse :
`watshop.africa/gnakryshop`, partagée sur WhatsApp par le vendeur lui-même. Un
acheteur qui arrivait sur `watshop.africa` voyait une page qui lui proposait de
créer une boutique — pas d'en visiter une.

Le marketplace ajoute les deux pages qui manquaient.

| Page | Ce qu'elle liste |
|---|---|
| `/boutiques` | Les boutiques publiées, avec leur catégorie, leur pays et leur nombre de produits |
| `/produits` | Le catalogue de toutes les boutiques, avec le nom du vendeur sur chaque carte |

Les deux segments étaient réservés depuis la Phase 0 dans `RESERVED_SLUGS` :
aucune boutique existante ne peut les avoir pris.

## D'où vient la mise en page

De [Your Next Store](https://github.com/yournextstore/yournextstore) (MIT), qui
tourne sur exactement notre pile — Next 16.3.2, React 19.2.8. Repris de leur
page `/products` :

| Élément | Fichier chez eux | Chez nous |
|---|---|---|
| Grille pleine largeur en trois colonnes, texte centré sous le visuel | leur démo hébergée | les pages `/produits` et `/boutiques` |
| Carte sans bordure, visuel carré arrondi sur fond `secondary` | `components/product-card.tsx` | `marketplace/product-card.tsx` |
| Tri en haut à droite, filtres derrière un bouton | leur démo hébergée | `marketplace/sort.tsx` + `filters-mobile.tsx` |
| Filtres dans un panneau coulissant | `components/sections/product-filters.tsx` | `marketplace/filters.tsx` + `filters-mobile.tsx` |
| Pagination numérotée avec ellipse | `components/listing-pagination.tsx` | `marketplace/listing-pagination.tsx` |
| Squelette aux proportions de la carte | `components/product-grid-skeleton.tsx` | `marketplace/product-grid-skeleton.tsx` |

> Attention en lisant leur dépôt : leur page `/products` met les filtres dans une
> colonne à gauche, alors que leur démo hébergée présente une grille pleine
> largeur avec le tri en haut à droite. C'est cette seconde disposition qui a
> été retenue — la colonne prenait un quart de la largeur pour deux filtres, au
> détriment des visuels, qui sont ce qui fait vendre.

Trois écarts assumés :

- **Leurs filtres poussent par le routeur côté client ; les nôtres sont de vrais
  liens et un vrai formulaire GET.** Même résultat visible, mais il marche avant
  que le JavaScript ait fini de charger. Sur un Android d'entrée de gamme en 3G,
  ce n'est pas un détail. Seul le panneau coulissant est un composant client —
  les filtres qu'il contient sont rendus côté serveur et passés en `children`.
  Le sélecteur de tri s'envoie tout seul au changement quand le JavaScript est
  là, et affiche un bouton « Trier » dans un `<noscript>` quand il ne l'est pas.
- **Deux filtres au lieu de six.** Leurs facettes (marques, collections,
  fourchette de prix, déclinaisons) n'ont pas d'équivalent en base. En afficher
  qui ne filtreraient rien serait pire que de ne pas les afficher.
- **Leur carte est couplée à `commerce-kit`** (variantes, prix mini/maxi,
  `QuickAddButton`). Watshop n'a pas de variantes. Ce qui a été repris est la
  composition, plus la bascule d'image au survol — que nos `product_images`
  permettent quand le vendeur a mis une deuxième photo.

## Ce qui n'a pas changé

**Aucune policy n'a été ouverte.** Les policies publiques posées en Phase 3
suffisaient déjà, et le commentaire du schéma les annonçait pour cet usage —
« Lecture publique du catalogue actif (boutique publique, marketplace) ». Une
boutique en brouillon ou désactivée reste invisible, un produit inactif aussi,
sans qu'aucune condition n'ait à être répétée dans le code du marketplace.

**La commande reste chez le vendeur.** Les cartes du marketplace mènent à la
fiche produit dans la boutique du vendeur, là où sont le panier, ses zones de
livraison et son WhatsApp. Le marketplace fait entrer l'acheteur ; il ne
s'interpose pas dans la vente.

## Migration — appliquée

`supabase/migrations/0010_marketplace.sql`, après `0009`. **Exécutée et
vérifiée** : `effective_price` calcule juste (un produit à 350 000 avec une
promo à 150 000 vaut 150 000), les deux tris par prix répondent, et Postgres
refuse d'écrire la colonne générée (`428C9 column "effective_price" can only be
updated to DEFAULT`).

Elle ne touche pas aux droits. Elle ajoute :

- **`products.effective_price`**, colonne générée valant le prix promo s'il est
  valide, le prix normal sinon. Le tri par prix se fait en SQL, sur une page de
  24 produits tirée du catalogue entier : le calculer côté application trierait
  la page, pas le catalogue. Étant générée, elle ne peut pas diverger de
  `effectivePrice()` côté TypeScript.
- **des index** de listing (catégorie, pays, date, prix).
- **`pg_trgm`** et deux index GIN, parce que la recherche est un
  `ilike '%terme%'` qu'aucun index B-tree ne peut servir.

> Sur une base où elle n'aurait pas été passée, `/boutiques` et `/produits`
> fonctionnent quand même : seuls les deux tris par prix renvoient une erreur 500
> (`42703 column products.effective_price does not exist`). L'affichage des prix,
> lui, ne dépend pas de la colonne — les cartes le recalculent avec le même
> helper que la boutique.

## Recette

Sur `/boutiques` :

1. La boutique publiée apparaît, avec son nombre de produits.
2. `?q=` sur un morceau du nom la retrouve ; sur autre chose, l'écran « Aucune
   boutique trouvée » propose de retirer des filtres.
3. Les listes déroulantes catégorie et pays filtrent, et se combinent avec la
   recherche.
4. Une boutique en brouillon (`published_at` nul) **n'apparaît pas**, même en
   cherchant son nom exact. C'est la RLS, pas le code.

Sur `/produits` :

5. Chaque carte porte le nom de la boutique du vendeur.
6. Les trois tris fonctionnent (les deux tris par prix demandent la migration).
7. Un clic mène à la fiche produit **dans la boutique**, où le panier existe.

Vérifications déjà faites en local, sur la base de production :

| Cas | Résultat |
|---|---|
| `/boutiques`, `/produits` | 200 |
| `?page=2` et `?page=999` au-delà des résultats | 404 |
| `?categorie=nimportequoi` | 200, filtre inconnu ignoré |
| `?q=%,)` — caractères qui cassent la syntaxe PostgREST | 200, terme nettoyé |
| `/gnakryshop` | 200 — le groupe de routes n'a pas cassé le segment boutique |

### Deux pièges de pagination, tous deux rencontrés

**PostgREST refuse une plage qui commence après la dernière ligne** — il répond
`PGRST103`, pas une liste vide. `?page=2` rendait donc un 500. C'est rattrapé
dans `queries.ts`, qui recompte et renvoie une page vide.

**Avec `Suspense`, le code HTTP part avant le contenu.** Le `notFound()` était
d'abord appelé dans la liste suspendue : la page 404 s'affichait, mais sous un
statut **200**, qu'un moteur de recherche aurait indexé. Le numéro de page est
maintenant validé dans le corps de la page, avant tout rendu, par un compte seul
(`countShops` / `countProducts`) — et seulement au-delà de la première page,
donc sans requête supplémentaire sur le chemin courant.

## Ce qui reste à faire

- **Classer les produits un par un.** La table `categories` existe depuis la
  Phase 0, mais elle est vide et aucun écran ne l'alimente : `products.category_id`
  n'est jamais renseigné. Le marketplace classe donc un produit par la catégorie
  de sa boutique — correct pour un vendeur qui ne fait qu'un métier, faux pour
  une boutique généraliste. Il faudrait un champ catégorie au formulaire produit
  avant de filtrer plus finement.
- **La mise en avant payante.** `shops.is_sponsored` et `products.is_sponsored`
  font déjà remonter en tête de liste, et rien ne les vend : aucun écran ne
  permet de les activer, ni de les facturer.
