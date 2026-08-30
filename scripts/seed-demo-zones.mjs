/**
 * Ajoute des zones de livraison aux boutiques de démonstration.
 *
 * Sans elles, le bandeau de boutique masque la ligne « livraison » et le tunnel
 * d'achat ne propose aucun frais : la commande est possible mais la page paraît
 * inachevée. Les cinq communes de Conakry, aux tarifs qu'y pratiquent
 * réellement les livreurs à moto.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

import { BOUTIQUES } from "./scripts/demo-catalogue.mjs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const ZONES = [
  { zone_name: "Kaloum", price: 20_000, estimated_delay: "Sous 24 h", free_above: 500_000 },
  { zone_name: "Dixinn", price: 20_000, estimated_delay: "Sous 24 h", free_above: 500_000 },
  { zone_name: "Matam", price: 25_000, estimated_delay: "Sous 24 h", free_above: 500_000 },
  { zone_name: "Ratoma", price: 30_000, estimated_delay: "24 à 48 h", free_above: 700_000 },
  { zone_name: "Matoto", price: 30_000, estimated_delay: "24 à 48 h", free_above: 700_000 },
];

const slugs = BOUTIQUES.map((b) => b.slug);
const { data: boutiques } = await sb.from("shops").select("id, name").in("slug", slugs);

for (const boutique of boutiques ?? []) {
  const { count } = await sb
    .from("delivery_zones")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", boutique.id);

  if ((count ?? 0) > 0) {
    console.log(`  ${boutique.name} : ${count} zone(s) déjà en place`);
    continue;
  }

  const { error } = await sb
    .from("delivery_zones")
    .insert(ZONES.map((z) => ({ ...z, shop_id: boutique.id })));

  console.log(`  ${boutique.name} : ${error ? "échec — " + error.message : ZONES.length + " zones"}`);
}
