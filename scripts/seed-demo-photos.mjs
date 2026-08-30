/**
 * Complète les photos manquantes des boutiques de démonstration.
 *
 *     node scripts/seed-demo-photos.mjs
 *
 * Le peuplement initial écarte toute photo déjà servie, pour qu'un même visuel
 * ne se retrouve pas sur deux articles. Sur certains termes le vivier StockSnap
 * s'épuise avant la fin, et l'article reste sans image — sur une vitrine
 * destinée à être photographiée, cela se voit tout de suite.
 *
 * Ce script reprend uniquement les articles à court de photos, en élargissant la
 * recherche : plusieurs formulations, plusieurs pages, et si rien ne vient, la
 * licence CC0 sans se limiter à StockSnap. Il est sans effet sur les autres,
 * donc relançable autant de fois que nécessaire.
 *
 * Il ne touche qu'aux boutiques listées dans demo-catalogue.mjs : une vraie
 * boutique de vendeur n'est jamais modifiée.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

import { BOUTIQUES } from "./demo-catalogue.mjs";

const BUCKET = "shop-media";
const PHOTOS_VOULUES = 2;

const brut = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  brut
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Photos déjà en base : on ne veut pas réattribuer une image déjà visible ailleurs. */
const dejaEnBase = new Set();

/** Élargissements successifs, du plus précis au plus général. */
function variantes(terme) {
  const mots = terme.split(/\s+/);
  return [
    { q: terme, source: "stocksnap", page: 1 },
    { q: terme, source: "stocksnap", page: 2 },
    { q: mots[0], source: "stocksnap", page: 1 },
    { q: terme, source: null, page: 1 },
    { q: mots[0], source: null, page: 1 },
  ];
}

async function chercher({ q, source, page }, combien) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", q);
  if (source) url.searchParams.set("source", source);
  url.searchParams.set("license", "cc0");
  url.searchParams.set("page_size", "20");
  url.searchParams.set("page", String(page));
  url.searchParams.set("mature", "false");

  try {
    const reponse = await fetch(url, { headers: { "User-Agent": "watshop-seed/1.0" } });
    if (!reponse.ok) return [];
    const { results = [] } = await reponse.json();

    const retenues = [];
    for (const image of results) {
      if (!image.url || dejaEnBase.has(image.url)) continue;
      dejaEnBase.add(image.url);
      retenues.push(image.url);
      if (retenues.length === combien) break;
    }
    return retenues;
  } catch {
    return [];
  }
}

/**
 * En-têtes de navigateur.
 *
 * Le CDN de StockSnap répond 403 avec une page HTML à qui n'annonce ni
 * navigateur ni provenance — et une page HTML enregistrée sous un nom en .jpg
 * s'affiche comme une image cassée, sans que rien ne signale l'erreur. D'où la
 * vérification des octets plus bas : c'est le seul contrôle qui ne ment pas.
 */
const ENTETES = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Referer: "https://stocksnap.io/",
  Accept: "image/avif,image/webp,image/jpeg,image/png,*/*",
};

/** Les premiers octets d'un fichier disent ce qu'il est, quoi qu'en dise l'en-tête. */
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
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(chemin, octets, { contentType: type, upsert: true });
    if (error) return null;

    return sb.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl;
  } catch {
    return null;
  }
}

/**
 * Retire les photos qui n'en sont pas.
 *
 * Elles seront recomptées comme manquantes et recherchées à nouveau par la
 * suite du script.
 */
async function purgerCassees(produits) {
  const suspectes = [];

  await Promise.all(
    (produits ?? []).flatMap((produit) =>
      (produit.product_images ?? []).map(async (image) => {
        try {
          const reponse = await fetch(image.url);
          const octets = new Uint8Array(await reponse.arrayBuffer());
          if (!estUneImage(octets) || octets.byteLength < 15_000) suspectes.push(image.url);
        } catch {
          suspectes.push(image.url);
        }
      }),
    ),
  );

  if (suspectes.length > 0) {
    await sb.from("product_images").delete().in("url", suspectes);
    console.log(`${suspectes.length} photo(s) illisible(s) ou trop petite(s) retirée(s).\n`);
  }

  return new Set(suspectes);
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // Terme de recherche par nom d'article, tel qu'écrit dans le catalogue.
  const termeDe = new Map();
  for (const boutique of BOUTIQUES) {
    for (const produit of boutique.produits) termeDe.set(produit.nom, produit.image);
  }

  const slugsDemo = BOUTIQUES.map((b) => b.slug);
  const { data: boutiques } = await sb.from("shops").select("id, user_id, slug").in("slug", slugsDemo);
  const idsDemo = (boutiques ?? []).map((b) => b.id);
  const proprietaire = new Map((boutiques ?? []).map((b) => [b.id, b.user_id]));

  if (idsDemo.length === 0) {
    console.log("Aucune boutique de démonstration en base. Lancez d'abord seed-demo.mjs.");
    return;
  }

  const { data: produits } = await sb
    .from("products")
    .select("id, name, shop_id, product_images(url, position)")
    .in("shop_id", idsDemo);

  // Les fichiers illisibles sont écartés avant de compter : sans quoi un article
  // dont les deux photos sont cassées passerait pour servi.
  const retirees = await purgerCassees(produits);

  for (const produit of produits ?? []) {
    produit.product_images = (produit.product_images ?? []).filter((i) => !retirees.has(i.url));
    for (const image of produit.product_images) dejaEnBase.add(image.url);
  }

  const aCompleter = (produits ?? []).filter(
    (p) => (p.product_images?.length ?? 0) < PHOTOS_VOULUES,
  );

  console.log(`${aCompleter.length} article(s) à compléter sur ${produits?.length ?? 0}.\n`);
  let ajoutees = 0;

  for (const produit of aCompleter) {
    const deja = produit.product_images?.length ?? 0;
    const manque = PHOTOS_VOULUES - deja;
    const terme = termeDe.get(produit.name);

    if (!terme) {
      console.log(`    ignoré (hors catalogue)  ${produit.name}`);
      continue;
    }

    const trouvees = [];
    for (const variante of variantes(terme)) {
      if (trouvees.length >= manque) break;
      trouvees.push(...(await chercher(variante, manque - trouvees.length)));
      await attendre(200);
    }

    const lignes = [];
    for (const [index, source] of trouvees.entries()) {
      const position = deja + index;
      const chemin = `${proprietaire.get(produit.shop_id)}/${produit.shop_id}/produits/${produit.id}-${position}.jpg`;
      const publique = await transferer(source, chemin);
      if (publique) {
        lignes.push({
          product_id: produit.id,
          url: publique,
          alt_text: `${produit.name} — photo ${position + 1}`,
          position,
        });
      }
    }

    if (lignes.length > 0) {
      await sb.from("product_images").insert(lignes);
      ajoutees += lignes.length;
    }

    console.log(`    ${deja} + ${lignes.length}  ${produit.name}`);
    await attendre(150);
  }

  console.log(`\n${ajoutees} photo(s) ajoutée(s).`);
}

main().catch((erreur) => {
  console.error("Échec :", erreur.message);
  process.exit(1);
});
