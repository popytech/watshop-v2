/**
 * Retire tout ce que le peuplement de démonstration a créé.
 *
 *     node scripts/seed-demo-clean.mjs
 *
 * Supprimer les cinq comptes suffit pour la base : profils, boutiques, produits
 * et photos partent en cascade, chaque table référençant la précédente avec
 * `on delete cascade`. Le stockage, lui, ne cascade pas — les fichiers envoyés
 * sont donc retirés dossier par dossier, avant les comptes, tant qu'on connaît
 * encore les identifiants qui composent leur chemin.
 *
 * Le script ne connaît que les adresses en @demo.watshop.africa et les slugs du
 * catalogue : une vraie boutique de vendeur ne peut pas être touchée, même par
 * accident.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

import { BOUTIQUES, DEMO_EMAIL_DOMAIN } from "./demo-catalogue.mjs";

const BUCKET = "shop-media";

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

/** Vide un dossier du stockage, sous-dossiers compris. */
async function viderDossier(prefixe) {
  const { data: entrees, error } = await sb.storage.from(BUCKET).list(prefixe, { limit: 1000 });
  if (error || !entrees) return 0;

  let supprimes = 0;
  const fichiers = [];

  for (const entree of entrees) {
    const chemin = `${prefixe}/${entree.name}`;
    // Une entrée sans métadonnées est un dossier : on descend dedans.
    if (entree.id === null) supprimes += await viderDossier(chemin);
    else fichiers.push(chemin);
  }

  if (fichiers.length > 0) {
    await sb.storage.from(BUCKET).remove(fichiers);
    supprimes += fichiers.length;
  }

  return supprimes;
}

async function main() {
  const slugs = BOUTIQUES.map((b) => b.slug);

  const { data: boutiques } = await sb.from("shops").select("id, user_id, name, slug").in("slug", slugs);

  if (!boutiques || boutiques.length === 0) {
    console.log("Rien à supprimer : aucune boutique de démonstration en base.");
    return;
  }

  console.log(`${boutiques.length} boutique(s) de démonstration à retirer.\n`);

  // Les fichiers d'abord : leur chemin commence par l'identifiant du compte,
  // qui n'existera plus une fois celui-ci supprimé.
  let fichiers = 0;
  for (const boutique of boutiques) {
    const n = await viderDossier(`${boutique.user_id}/${boutique.id}`);
    fichiers += n;
    console.log(`    ${String(n).padStart(3)} fichier(s)  ${boutique.name}`);
  }

  // Puis les comptes : le reste suit en cascade.
  const { data: liste } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const comptes = (liste?.users ?? []).filter((u) => u.email?.endsWith(`@${DEMO_EMAIL_DOMAIN}`));

  for (const compte of comptes) {
    const { error } = await sb.auth.admin.deleteUser(compte.id);
    console.log(`    ${error ? "échec  " : "retiré "}  ${compte.email}`);
  }

  const { count } = await sb.from("shops").select("id", { count: "exact", head: true }).in("slug", slugs);

  console.log(`\n${fichiers} fichier(s) et ${comptes.length} compte(s) supprimés.`);
  console.log(
    count === 0
      ? "Vérifié : plus aucune boutique de démonstration en base."
      : `Attention : ${count} boutique(s) subsistent.`,
  );
}

main().catch((erreur) => {
  console.error("Échec :", erreur.message);
  process.exit(1);
});
