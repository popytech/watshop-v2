"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";

// Suppression d'un compte par un administrateur.
//
// Un seul geste racine : effacer l'utilisateur d'auth. Tout le schéma pend de
// `auth.users` par des clés étrangères `on delete cascade` — profiles → shops →
// products, product_images, orders, subscriptions, payments, delivery_zones…
// Supprimer l'utilisateur emporte donc sa boutique et tout ce qui s'y rattache,
// en base, d'un seul coup. On ne supprime table par table nulle part : ce serait
// dupliquer, à la main et de façon faillible, ce que la cascade fait déjà.
//
// Deux choses seulement ne cascadent pas et sont donc purgées ici : les fichiers
// du stockage (photos produits, logos, bannières, pièces de dossier agent),
// rangés sous <userId>/… dans les buckets shop-media et agent-documents. Les
// lignes, elles, partent avec la cascade.
//
// L'action exige le rôle admin (vérifié en base, jamais un secret partagé) et
// refuse de supprimer un administrateur — ce qui protège du même coup l'auteur
// du clic contre l'auto-suppression, un back-office qui se verrouille de
// l'intérieur étant un accident qui n'attend que son tour.

const BUCKETS = ["shop-media", "agent-documents"] as const;

/**
 * Vide récursivement tout ce qu'un utilisateur a déposé sous son dossier.
 *
 * `list()` n'est pas récursif, et un dossier ne se distingue d'un fichier que
 * par son `id` absent. On descend donc l'arbre <userId>/<shopId>/<dossier>/…
 * en accumulant les chemins de fichiers, puis on les retire par lots — sans
 * jamais faire échouer la suppression du compte si le stockage résiste : une
 * image orpheline est un désagrément, pas une fuite.
 */
async function purgerStockage(
  service: ReturnType<typeof createAdminClient>,
  bucket: string,
  userId: string,
): Promise<void> {
  const fichiers: string[] = [];

  async function descendre(prefixe: string): Promise<void> {
    const { data, error } = await service.storage.from(bucket).list(prefixe, { limit: 1000 });
    if (error || !data) return;

    for (const entree of data) {
      const chemin = `${prefixe}/${entree.name}`;
      // Un fichier a un id ; un « dossier » n'est qu'un préfixe, sans id.
      if (entree.id) {
        fichiers.push(chemin);
      } else {
        await descendre(chemin);
      }
    }
  }

  await descendre(userId);

  for (let i = 0; i < fichiers.length; i += 100) {
    await service.storage.from(bucket).remove(fichiers.slice(i, i + 100));
  }
}

export async function deleteAccount(formData: FormData): Promise<void> {
  const admin = await requireRole("admin");

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) redirect("/admin/comptes?erreur=introuvable");

  // On ne se supprime pas soi-même, ni un autre administrateur.
  if (userId === admin.id) redirect("/admin/comptes?erreur=soi");

  const service = createAdminClient();

  const { data: cible } = await service
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!cible) redirect("/admin/comptes?erreur=introuvable");
  if (cible.role === "admin") redirect("/admin/comptes?erreur=admin");

  // Le stockage d'abord, tant que tout est cohérent : une fois l'utilisateur
  // effacé on aurait encore son id, mais autant ne rien laisser derrière.
  for (const bucket of BUCKETS) {
    await purgerStockage(service, bucket, userId);
  }

  // La cascade part d'ici.
  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) {
    console.error(`[admin] suppression du compte ${userId} refusée : ${error.message}`);
    redirect("/admin/comptes?erreur=echec");
  }

  revalidatePath("/admin/comptes");
  revalidatePath("/admin");
  redirect("/admin/comptes?supprime=1");
}
