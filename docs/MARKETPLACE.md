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
| `?page=2` au-delà des résultats | 404 (et non 500 : PostgREST refuse la plage, c'est rattrapé) |
| `?categorie=nimportequoi` | 200, filtre inconnu ignoré |
| `?q=%,)` — caractères qui cassent la syntaxe PostgREST | 200, terme nettoyé |
| `/gnakryshop` | 200 — le groupe de routes n'a pas cassé le segment boutique |

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
