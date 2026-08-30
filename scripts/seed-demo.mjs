/**
 * Peuple la plateforme de cinq boutiques de démonstration, dix produits chacune.
 *
 *     node scripts/seed-demo.mjs
 *
 * Sert à faire les captures d'annonce sur une plateforme qui a l'air vivante.
 * Tout est repris par `seed-demo-clean.mjs`, qui supprime les cinq comptes : le
 * reste part en cascade — profils, boutiques, produits, photos — et les fichiers
 * envoyés dans le stockage sont retirés dossier par dossier.
 *
 * Deux choses à savoir avant de lancer.
 *
 * Ces boutiques sont **publiées**, donc visibles de tous et présentes dans le
 * plan du site. Un visiteur peut y passer une vraie commande : c'est pourquoi
 * les cinq portent le numéro WhatsApp de Watshop et non un numéro inventé, qui
 * appartiendrait à quelqu'un.
 *
 * Les photos viennent d'Openverse, filtrées sur StockSnap et sur la licence
 * CC0 — libres d'usage, y compris commercial, sans attribution. Elles sont
 * téléchargées puis renvoyées dans notre propre stockage, comme le ferait un
 * vendeur : `next.config.ts` n'autorise que le domaine Supabase, et une vitrine
 * qui dépend d'un CDN étranger tombe le jour où il tombe.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

import { BOUTIQUES, DEMO_EMAIL_DOMAIN, DEMO_WHATSAPP } from "./demo-catalogue.mjs";

const BUCKET = "shop-media";
const PHOTOS_PAR_PRODUIT = 2;

// ---------------------------------------------------------------- environnement

function lireEnv() {
  const brut = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = Object.fromEntries(
    brut
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env.local");
    process.exit(1);
  }
  return { url, cle };
}

const { url, cle } = lireEnv();
const sb = createClient(url, cle, { auth: { persistSession: false } });

// ---------------------------------------------------------------- images

/** Mémorise les photos déjà servies pour ne pas répéter la même d'un produit à l'autre. */
const dejaUtilisees = new Set();

/**
 * Cherche des photos libres pour un terme donné.
 *
 * Openverse est interrogé sans clé — c'est permis, à cadence raisonnable, d'où
 * l'appel unique par produit plutôt qu'un par photo.
 */
async function chercherPhotos(terme, combien) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", terme);
  url.searchParams.set("source", "stocksnap"); // vraies photos de studio
  url.searchParams.set("license", "cc0"); // aucune attribution exigée
  url.searchParams.set("page_size", "20");
  url.searchParams.set("mature", "false");

  const reponse = await fetch(url, { headers: { "User-Agent": "watshop-seed/1.0" } });
  if (!reponse.ok) return [];

  const { results = [] } = await reponse.json();
  const retenues = [];

  for (const image of results) {
    if (!image.url || dejaUtilisees.has(image.url)) continue;
    dejaUtilisees.add(image.url);
    retenues.push(image.url);
    if (retenues.length === combien) break;
  }

  return retenues;
}

/** Télécharge une photo et la renvoie dans notre stockage. Null si ça échoue. */
/**
 * En-tetes de navigateur.
 *
 * Le CDN de StockSnap repond 403 avec une page HTML a qui n annonce ni
 * navigateur ni provenance — et une page HTML enregistree sous un nom en .jpg
 * s affiche comme une image cassee, sans que rien ne signale l erreur. D ou la
 * verification des octets : c est le seul controle qui ne ment pas.
 */
const ENTETES = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Referer: "https://stocksnap.io/",
  Accept: "image/avif,image/webp,image/jpeg,image/png,*/*",
};

/** Les premiers octets disent ce qu'est un fichier, quoi qu'en dise l'en-tête. */
function estUneImage(octets) {
  if (octets.byteLength < 1024) return false;
  const jpeg = octets[0] === 0xff && octets[1] === 0xd8;
  const png = octets[0] === 0x89 && octets[1] === 0x50;
  const webp = octets[8] === 0x57 && octets[9] === 0x45;
  return jpeg || png || webp;
}

async function transferer(sourceUrl, chemin) {
  try {
    const reponse = await fetch(sourceUrl, { headers: ENTETES });
    if (!reponse.ok) return null;

    const octets = new Uint8Array(await reponse.arrayBuffer());
    if (!estUneImage(octets)) return null;

    const type = reponse.headers.get("content-type") ?? "image/jpeg";

    const { error } = await sb.storage.from(BUCKET).upload(chemin, octets, {
      contentType: type,
      upsert: true,
    });
    if (error) {
      console.log(`      envoi refusé : ${error.message}`);
      return null;
    }

    return sb.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl;
  } catch (erreur) {
    console.log(`      téléchargement échoué : ${erreur.message}`);
    return null;
  }
}

// ---------------------------------------------------------------- utilitaires

/** Même règle que productSlug() côté application : lisible, plus un suffixe unique. */
function slugProduit(nom, id) {
  const base = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base}-${id.slice(0, 6)}`;
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- peuplement

async function creerCompte(boutique) {
  const email = `${boutique.slug}@${DEMO_EMAIL_DOMAIN}`;

  const { data, error } = await sb.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name: boutique.nom },
  });

  if (error) {
    // Déjà là : on récupère le compte plutôt que d'échouer, pour que le script
    // puisse être relancé après une interruption.
    const { data: liste } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existant = liste?.users?.find((u) => u.email === email);
    if (existant) return existant.id;
    throw new Error(`compte ${email} : ${error.message}`);
  }

  return data.user.id;
}

async function creerBoutique(userId, boutique) {
  const { data, error } = await sb
    .from("shops")
    .upsert(
      {
        user_id: userId,
        name: boutique.nom,
        slug: boutique.slug,
        description: boutique.description,
        whatsapp_number: DEMO_WHATSAPP,
        country_code: "GN",
        currency_symbol: "GNF",
        primary_color: boutique.couleur,
        category: boutique.categorie,
        onboarding_step: 6,
        published_at: new Date().toISOString(),
        is_active: true,
        is_verified: boutique.verifiee,
        is_sponsored: boutique.misEnAvant,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (error) throw new Error(`boutique ${boutique.slug} : ${error.message}`);
  return data.id;
}

async function creerProduit(userId, shopId, produit) {
  const { data, error } = await sb
    .from("products")
    .insert({
      shop_id: shopId,
      name: produit.nom,
      slug: "provisoire",
      description: produit.description,
      price: produit.prix,
      promo_price: produit.promo ?? null,
      quantity: produit.stock,
      sizes: produit.tailles ?? null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(`produit ${produit.nom} : ${error.message}`);

  // Le slug a besoin de l'identifiant, qui n'existe qu'une fois la ligne créée.
  const slug = slugProduit(produit.nom, data.id);
  await sb.from("products").update({ slug }).eq("id", data.id);

  const sources = await chercherPhotos(produit.image, PHOTOS_PAR_PRODUIT);
  const photos = [];

  for (const [index, source] of sources.entries()) {
    const chemin = `${userId}/${shopId}/produits/${data.id}-${index}.jpg`;
    const publique = await transferer(source, chemin);
    if (publique) {
      photos.push({
        product_id: data.id,
        url: publique,
        alt_text: `${produit.nom} — photo ${index + 1}`,
        position: index,
      });
    }
  }

  if (photos.length > 0) await sb.from("product_images").insert(photos);
  return photos.length;
}

async function main() {
  console.log(`Projet : ${url}`);
  console.log(`Boutiques à créer : ${BOUTIQUES.length}, dix produits chacune.\n`);

  let produitsCrees = 0;
  let photosCreees = 0;

  for (const boutique of BOUTIQUES) {
    console.log(`— ${boutique.nom} (/${boutique.slug})`);

    const userId = await creerCompte(boutique);
    const shopId = await creerBoutique(userId, boutique);

    for (const produit of boutique.produits) {
      const photos = await creerProduit(userId, shopId, produit);
      produitsCrees += 1;
      photosCreees += photos;
      console.log(`    ${String(photos)} photo(s)  ${produit.nom}`);
      await attendre(250); // on ne martèle pas une API publique gratuite
    }

    console.log("");
  }

  console.log(`Terminé : ${BOUTIQUES.length} boutiques, ${produitsCrees} produits, ${photosCreees} photos.`);
  console.log("Pour tout retirer : node scripts/seed-demo-clean.mjs");
}

main().catch((erreur) => {
  console.error("\nÉchec :", erreur.message);
  process.exit(1);
});
