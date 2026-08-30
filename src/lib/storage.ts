import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Stockage des images (logos de boutique, photos produits).
//
// Cloudflare R2 reste la cible (ROADMAP, section 3), mais ses accès ne sont pas
// encore fournis. En attendant, Supabase Storage : même projet, aucune clé
// supplémentaire, et les policies du bucket réutilisent auth.uid() — un vendeur
// ne peut écrire que dans son propre dossier.
//
// Le jour du basculement vers R2, c'est ce fichier qui change, et lui seul :
// tout le reste de l'app ne connaît que uploadImage()/deleteImage() et des URL.

const BUCKET = "shop-media";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type UploadResult = { ok: true; url: string; path: string } | { ok: false; reason: string };

function extensionFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/avif") return "avif";
  return "jpg";
}

/**
 * Envoie une image dans <userId>/<shopId>/<horodatage>.<ext> et renvoie son URL
 * publique. `folder` permet de séparer les logos des photos produits.
 */
export async function uploadImage(
  file: File,
  params: { userId: string; shopId: string; folder: "logo" | "banniere" | "produits" },
): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, reason: "Fichier vide." };
  if (file.size > MAX_BYTES) {
    return { ok: false, reason: "Image trop lourde (5 Mo maximum)." };
  }
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, reason: "Format accepté : JPG, PNG, WebP ou AVIF." };
  }

  const supabase = await createClient();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(file.type)}`;
  const path = `${params.userId}/${params.shopId}/${params.folder}/${name}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { ok: false, reason: "Envoi de l'image impossible. Réessayez." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { ok: true, url: publicUrl, path };
}

/** Supprime une image à partir de son URL publique. Silencieux en cas d'échec. */
export async function deleteImageByUrl(url: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;

  const path = url.slice(index + marker.length);
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

// ============================================================
// Pièces de candidature agent — bucket privé
// ============================================================

const BUCKET_AGENT = "agent-documents";

/**
 * Envoie une pièce de dossier dans le bucket **privé**.
 *
 * Rien de tout ça ne va dans shop-media : une photo de carte d'identité
 * accessible par URL publique serait une fuite de données personnelles. On
 * conserve donc le chemin dans la base, jamais une URL — la lecture se fait
 * plus tard par URL signée, à durée limitée.
 */
export async function uploadAgentDocument(
  file: File,
  params: { userId: string; kind: "photo" | "piece" },
): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, reason: "Fichier vide." };
  if (file.size > MAX_BYTES) return { ok: false, reason: "Image trop lourde (5 Mo maximum)." };
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, reason: "Format accepté : JPG, PNG, WebP ou AVIF." };
  }

  const supabase = await createClient();
  const name = `${params.kind}-${Date.now()}.${extensionFor(file.type)}`;
  const path = `${params.userId}/${name}`;

  const { error } = await supabase.storage.from(BUCKET_AGENT).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) return { ok: false, reason: "Envoi du document impossible. Réessayez." };

  // On renvoie le chemin, pas une URL : le bucket est privé, une URL fixe n'y
  // donnerait accès à personne et laisserait croire le contraire.
  return { ok: true, url: path, path };
}

/**
 * URL temporaire pour consulter une pièce. Réservée aux écrans qui ont déjà
 * vérifié le droit d'en voir une (le dossier de l'utilisateur, ou l'écran
 * d'administration).
 */
export async function signedAgentDocumentUrl(
  path: string,
  secondes = 300,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.storage.from(BUCKET_AGENT).createSignedUrl(path, secondes);
  return data?.signedUrl ?? null;
}
