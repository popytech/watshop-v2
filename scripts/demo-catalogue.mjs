// Catalogue de démonstration : cinq boutiques, dix produits chacune.
//
// Sert à peupler la plateforme le temps de faire les captures d'annonce. Les
// noms de boutiques et les chiffres d'affaires ont été fournis par Watshop ; les
// produits, leurs libellés et leurs prix sont écrits ici, en francs guinéens et
// aux ordres de grandeur du marché de Conakry.
//
// `image` est la requête envoyée à Openverse pour trouver une photo : les
// visuels ne sont donc pas choisis un par un, ils sont cherchés au moment du
// peuplement (voir seed-demo.mjs).

/** Toutes les boutiques de démonstration partagent ce marqueur d'adresse. */
export const DEMO_EMAIL_DOMAIN = "demo.watshop.africa";

/**
 * Un numéro unique pour les cinq vitrines, celui de Watshop.
 *
 * Ces boutiques sont publiées, donc visibles de tous : un visiteur peut passer
 * commande pour de bon. Mieux vaut que le message WhatsApp arrive chez nous que
 * chez un inconnu dont on aurait inventé le numéro.
 */
export const DEMO_WHATSAPP = "+224612960453";

const TAILLES_VETEMENT = ["S", "M", "L", "XL"];
const TAILLES_CHAUSSURE = ["39", "40", "41", "42", "43", "44"];

export const BOUTIQUES = [
  {
    nom: "Gnakry Shop",
    slug: "gnakry-shop",
    categorie: "Mode & vêtements",
    couleur: "#128c4a",
    verifiee: true,
    misEnAvant: true,
    description:
      "Prêt-à-porter homme et femme à Conakry. Nouveautés chaque semaine, livraison dans toute la ville.",
    logo: "clothing store",
    produits: [
      { nom: "T-shirt coton imprimé", prix: 150_000, stock: 34, image: "t-shirt", tailles: TAILLES_VETEMENT,
        description: "Coton peigné 180 g, coupe droite. Impression sérigraphiée qui ne se craquelle pas au lavage." },
      { nom: "Jean slim brut", prix: 380_000, stock: 18, image: "jeans denim", tailles: TAILLES_VETEMENT,
        description: "Denim brut 12 oz, coupe slim. Se patine avec le temps, comme un vrai jean doit le faire." },
      { nom: "Chemise à carreaux", prix: 220_000, promo: 175_000, stock: 22, image: "plaid shirt", tailles: TAILLES_VETEMENT,
        description: "Flanelle douce, col boutonné. Se porte ouverte sur un t-shirt ou fermée avec un chino." },
      { nom: "Sweat à capuche", prix: 290_000, stock: 27, image: "hoodie", tailles: TAILLES_VETEMENT,
        description: "Molleton gratté intérieur, poche kangourou. Chaud sans être lourd pour les matins d'harmattan." },
      { nom: "Veste en jean", prix: 450_000, stock: 12, image: "denim jacket", tailles: TAILLES_VETEMENT,
        description: "Coupe classique quatre poches, boutons métal. La pièce qui va avec tout." },
      { nom: "Polo piqué coton", prix: 185_000, stock: 41, image: "polo shirt", tailles: TAILLES_VETEMENT,
        description: "Maille piquée respirante, col côtelé qui garde sa forme. Six coloris disponibles en boutique." },
      { nom: "Short cargo", prix: 165_000, stock: 25, image: "cargo shorts", tailles: TAILLES_VETEMENT,
        description: "Toile de coton résistante, deux poches latérales à rabat. Taille ajustable par cordon." },
      { nom: "Survêtement deux pièces", prix: 520_000, stock: 9, image: "tracksuit", tailles: TAILLES_VETEMENT,
        description: "Veste zippée et pantalon assorti, bas de jambe élastiqué. Vendu en ensemble." },
      { nom: "Chemise lin manches courtes", prix: 240_000, stock: 16, image: "linen shirt", tailles: TAILLES_VETEMENT,
        description: "Lin lavé, coupe ample. Le tissu qui laisse respirer quand il fait 34 degrés." },
      { nom: "Pantalon chino", prix: 275_000, stock: 20, image: "chino pants", tailles: TAILLES_VETEMENT,
        description: "Twill de coton légèrement extensible. Se porte au bureau comme en ville." },
    ],
  },
  {
    nom: "Binta Shop",
    slug: "binta-shop",
    categorie: "Beauté & cosmétiques",
    couleur: "#b8467d",
    verifiee: true,
    misEnAvant: false,
    description:
      "Beauté et soins naturels. Karité, huiles pressées à froid et cosmétiques de marque.",
    logo: "cosmetics",
    produits: [
      { nom: "Beurre de karité pur 500 g", prix: 85_000, stock: 60, image: "shea butter",
        description: "Karité brut non raffiné, récolté et baratté en Haute-Guinée. Rien d'autre dedans." },
      { nom: "Huile de coco pressée à froid", prix: 65_000, stock: 45, image: "coconut oil",
        description: "Première pression à froid, non désodorisée. Cheveux, peau, cuisine." },
      { nom: "Savon noir africain", prix: 45_000, stock: 80, image: "natural soap",
        description: "Fabriqué à base de cendres de cabosses et d'huile de palmiste. Nettoie sans dessécher." },
      { nom: "Rouge à lèvres mat longue tenue", prix: 75_000, stock: 38, image: "lipstick",
        description: "Fini mat velours qui tient la journée. Douze teintes pensées pour les carnations foncées." },
      { nom: "Palette 12 fards à paupières", prix: 190_000, promo: 155_000, stock: 21, image: "makeup palette",
        description: "Mats et nacrés, pigmentation forte. Miroir intégré dans le couvercle." },
      { nom: "Parfum femme 50 ml", prix: 350_000, stock: 14, image: "perfume bottle",
        description: "Notes florales et boisées, tenue longue. Vaporisateur en verre épais." },
      { nom: "Crème hydratante visage", prix: 120_000, stock: 33, image: "face cream",
        description: "Texture légère qui pénètre vite, sans film gras. Convient aux peaux mixtes." },
      { nom: "Masque capillaire au karité", prix: 95_000, stock: 29, image: "hair care",
        description: "Pose de vingt minutes. Redonne de la souplesse aux cheveux crépus et défrisés." },
      { nom: "Coffret soins visage", prix: 280_000, stock: 11, image: "cosmetics set",
        description: "Nettoyant, sérum et crème dans une boîte cadeau. Le coffret qui fait plaisir à coup sûr." },
      { nom: "Fond de teint longue tenue", prix: 145_000, stock: 26, image: "foundation makeup",
        description: "Couvrance modulable, fini naturel. Huit nuances du plus clair au plus profond." },
    ],
  },
  {
    nom: "Fatima Fashion",
    slug: "fatima-fashion",
    categorie: "Mode & vêtements",
    couleur: "#7c3aed",
    verifiee: false,
    misEnAvant: false,
    description:
      "Mode femme, wax et bazin. Sur mesure et prêt-à-porter, couture soignée.",
    logo: "african fabric",
    produits: [
      { nom: "Robe wax grand format", prix: 350_000, stock: 15, image: "african dress", tailles: TAILLES_VETEMENT,
        description: "Wax authentique, doublure coton. Coupe cintrée à la taille, fermeture invisible dans le dos." },
      { nom: "Ensemble bazin riche brodé", prix: 750_000, stock: 8, image: "embroidered fabric", tailles: TAILLES_VETEMENT,
        description: "Bazin teint et damassé, broderie faite main au col et aux poignets. Pour les grandes occasions." },
      { nom: "Boubou wax cérémonie", prix: 620_000, stock: 10, image: "african fashion", tailles: TAILLES_VETEMENT,
        description: "Boubou ample avec pagne assorti et foulard. Trois pièces vendues ensemble." },
      { nom: "Jupe portefeuille wax", prix: 180_000, stock: 24, image: "skirt fashion", tailles: TAILLES_VETEMENT,
        description: "Se noue à la taille, longueur midi. S'adapte à plusieurs tailles." },
      { nom: "Chemisier en soie", prix: 240_000, promo: 195_000, stock: 19, image: "silk blouse", tailles: TAILLES_VETEMENT,
        description: "Soie fluide, boutons nacrés. Se glisse dans une jupe ou se porte sur un jean." },
      { nom: "Robe longue fleurie", prix: 295_000, stock: 17, image: "summer dress", tailles: TAILLES_VETEMENT,
        description: "Viscose légère, bretelles réglables. Idéale pour la saison chaude." },
      { nom: "Tailleur pagne moderne", prix: 480_000, stock: 7, image: "woman suit", tailles: TAILLES_VETEMENT,
        description: "Veste structurée et pantalon droit en pagne. Le pagne au bureau, sans compromis." },
      { nom: "Foulard en soie imprimé", prix: 95_000, stock: 42, image: "silk scarf",
        description: "Carré 90 × 90 cm, bords roulottés main. Se porte au cou, en turban ou au sac." },
      { nom: "Ensemble deux pièces lin", prix: 420_000, stock: 13, image: "linen outfit", tailles: TAILLES_VETEMENT,
        description: "Haut court et pantalon large en lin lavé. Confortable et jamais froissé au mauvais endroit." },
      { nom: "Robe de soirée dentelle", prix: 890_000, stock: 5, image: "evening dress", tailles: TAILLES_VETEMENT,
        description: "Dentelle brodée sur doublure satin. Retouches offertes en boutique." },
    ],
  },
  {
    nom: "Boutique ABK & Frère",
    slug: "boutique-abk-frere",
    categorie: "Électronique",
    couleur: "#0369a1",
    verifiee: true,
    misEnAvant: false,
    description:
      "Téléphonie et accessoires. Matériel garanti, service après-vente à Madina.",
    logo: "electronics store",
    produits: [
      { nom: "Smartphone 128 Go double SIM", prix: 2_450_000, stock: 6, image: "smartphone",
        description: "Écran 6,7 pouces, batterie 5000 mAh, double SIM. Garantie 12 mois à la boutique." },
      { nom: "Écouteurs sans fil", prix: 320_000, promo: 265_000, stock: 23, image: "wireless earbuds",
        description: "Bluetooth 5.3, boîtier de charge, six heures d'autonomie. Réduction de bruit active." },
      { nom: "Casque audio Bluetooth", prix: 480_000, stock: 11, image: "headphones",
        description: "Arceau rembourré, quarante heures d'autonomie. Se plie pour tenir dans un sac." },
      { nom: "Batterie externe 20 000 mAh", prix: 250_000, stock: 31, image: "power bank",
        description: "Recharge un téléphone quatre fois. Deux ports USB, charge rapide 22,5 W." },
      { nom: "Montre connectée", prix: 750_000, stock: 9, image: "smartwatch",
        description: "Écran AMOLED, suivi du sommeil et du rythme cardiaque. Étanche pour la pluie." },
      { nom: "Enceinte Bluetooth portable", prix: 390_000, stock: 14, image: "bluetooth speaker",
        description: "Son puissant pour la taille, résistante aux éclaboussures. Douze heures de musique." },
      { nom: "Chargeur rapide 65 W", prix: 180_000, stock: 28, image: "phone charger",
        description: "Charge un téléphone en une heure, un ordinateur portable aussi. Câble USB-C fourni." },
      { nom: "Clé USB 128 Go", prix: 120_000, stock: 47, image: "usb drive",
        description: "USB 3.2, boîtier métal. Transfert rapide des fichiers lourds." },
      { nom: "Tablette 10 pouces", prix: 3_200_000, stock: 4, image: "tablet computer",
        description: "Écran 10,1 pouces, 128 Go, emplacement carte SIM. Livrée avec une housse." },
      { nom: "Souris sans fil", prix: 95_000, stock: 36, image: "computer mouse",
        description: "Silencieuse, récepteur USB, pile fournie. Prise en main pour droitier et gaucher." },
    ],
  },
  {
    nom: "Mister Popy",
    slug: "mister-popy",
    categorie: "Mode & vêtements",
    couleur: "#c2410c",
    verifiee: false,
    misEnAvant: false,
    description:
      "Accessoires homme : maroquinerie, lunettes, montres et chaussures.",
    logo: "leather accessories",
    produits: [
      { nom: "Lunettes de soleil polarisées", prix: 180_000, stock: 30, image: "sunglasses",
        description: "Verres polarisés catégorie 3, monture acétate. Étui rigide et chiffon inclus." },
      { nom: "Montre homme acier", prix: 650_000, stock: 8, image: "wrist watch",
        description: "Boîtier acier 42 mm, mouvement à quartz, étanche 5 ATM. Bracelet ajustable." },
      { nom: "Ceinture cuir véritable", prix: 145_000, stock: 35, image: "leather belt", tailles: ["85", "90", "95", "100", "105"],
        description: "Cuir pleine fleur, boucle acier brossé. Se patine sans se fendre." },
      { nom: "Portefeuille cuir", prix: 120_000, stock: 40, image: "leather wallet",
        description: "Six emplacements cartes, deux compartiments billets. Tient dans une poche arrière." },
      { nom: "Casquette brodée", prix: 85_000, promo: 68_000, stock: 52, image: "baseball cap",
        description: "Coton lourd, visière préformée, fermeture réglable. Broderie sur le devant." },
      { nom: "Sac à dos urbain", prix: 320_000, stock: 17, image: "backpack",
        description: "Compartiment ordinateur 15 pouces, dos matelassé, tissu déperlant." },
      { nom: "Baskets blanches", prix: 450_000, stock: 21, image: "white sneakers", tailles: TAILLES_CHAUSSURE,
        description: "Tige cuir, semelle gomme. Le modèle qui se nettoie d'un coup d'éponge." },
      { nom: "Bracelet acier", prix: 95_000, stock: 44, image: "bracelet jewelry",
        description: "Maille milanaise, fermoir aimanté. Ne noircit pas au contact de la peau." },
      { nom: "Sacoche bandoulière", prix: 210_000, stock: 26, image: "shoulder bag",
        description: "Format tablette, sangle réglable, poche zippée à l'arrière pour les papiers." },
      { nom: "Chaussures cuir ville", prix: 780_000, stock: 12, image: "leather shoes", tailles: TAILLES_CHAUSSURE,
        description: "Cuir de veau, semelle cousue. Se ressemellent, donc se gardent des années." },
    ],
  },
];
