"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";
import { uploadAgentDocument } from "@/lib/storage";
import { fieldErrors } from "@/lib/network/schemas";
import type { FormState } from "@/lib/shop/state";

// Dossier de candidature d'un agent commercial.
//
// Un agent touche une commission récurrente sur les vendeurs qu'il recrute :
// valider quelqu'un sur son seul nom n'a pas de sens. Le dossier donne à
// l'administrateur de quoi décider — une photo, une pièce, une ville, une
// activité.

const applicationSchema = z.object({
  city: z.string().trim().min(2, "Indiquez votre ville.").max(60, "Ville trop longue."),
  neighborhood: z.string().trim().max(80, "Quartier trop long.").optional(),
  occupation: z.string().trim().max(80, "Réponse trop longue.").optional(),
  motivation: z
    .string()
    .trim()
    .min(20, "Dites-en un peu plus : 20 caractères minimum.")
    .max(500, "Message trop long."),
});

export async function submitAgentApplication(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = applicationSchema.safeParse({
    city: formData.get("city") ?? "",
    neighborhood: (formData.get("neighborhood") as string) || undefined,
    occupation: (formData.get("occupation") as string) || undefined,
    motivation: formData.get("motivation") ?? "",
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const profile = await requireRole("agent");
  const supabase = await createClient();

  const { data: existant } = await supabase
    .from("agent_applications")
    .select("photo_url, id_document_url, status")
    .eq("user_id", profile.id)
    .maybeSingle();

  // Un dossier déjà validé ne se remplace pas : il faudrait repasser par
  // l'administrateur, et l'agent perdrait ses rattachements entre-temps.
  if (existant?.status === "approved") {
    return { message: "Votre dossier est déjà validé." };
  }

  const photo = formData.get("photo");
  let photoPath = existant?.photo_url ?? null;
  if (photo instanceof File && photo.size > 0) {
    const upload = await uploadAgentDocument(photo, { userId: profile.id, kind: "photo" });
    if (!upload.ok) return { errors: { photo: upload.reason } };
    photoPath = upload.path;
  }

  if (!photoPath) return { errors: { photo: "Une photo de vous est nécessaire." } };

  const piece = formData.get("idDocument");
  let piecePath = existant?.id_document_url ?? null;
  if (piece instanceof File && piece.size > 0) {
    const upload = await uploadAgentDocument(piece, { userId: profile.id, kind: "piece" });
    if (!upload.ok) return { errors: { idDocument: upload.reason } };
    piecePath = upload.path;
  }

  const valeurs = {
    user_id: profile.id,
    photo_url: photoPath,
    id_document_url: piecePath,
    city: parsed.data.city,
    neighborhood: parsed.data.neighborhood ?? null,
    occupation: parsed.data.occupation ?? null,
    motivation: parsed.data.motivation,
    submitted_at: new Date().toISOString(),
  };

  // Le statut n'est pas touché ici : un candidat renseigne son dossier, il ne
  // s'accorde rien. Un trigger le refuserait de toute façon.
  const { error } = existant
    ? await supabase.from("agent_applications").update(valeurs).eq("user_id", profile.id)
    : await supabase.from("agent_applications").insert(valeurs);

  if (error) return { message: "Envoi du dossier impossible. Réessayez." };

  revalidatePath("/agent");
  revalidatePath("/admin/agents");

  return {
    ok: true,
    message: "Dossier envoyé. L'équipe Watshop l'examine sous 48 h.",
  };
}
