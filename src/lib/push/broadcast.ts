"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/fonnte";
import { sendPushToUsers } from "@/lib/push/send";
import { fieldErrors } from "@/lib/network/schemas";
import type { FormState } from "@/lib/shop/state";

// Diffusion d'un message aux vendeurs, par WhatsApp et/ou notification.
//
// Deux précautions qui n'ont rien de décoratif :
//   - l'envoi WhatsApp est séquentiel et plafonné. Fonnte facture au message et
//     un compte qui expédie des centaines de messages d'un coup se fait bannir
//     par Meta — c'est le numéro de Watshop qui saute, pas un quota.
//   - la cible est explicite. Pas de « tout le monde » par défaut.

const MAX_WHATSAPP = 200;

const broadcastSchema = z.object({
  audience: z.enum(["published", "pro", "all"]),
  channels: z.array(z.enum(["whatsapp", "push"])).min(1, "Choisissez au moins un canal."),
  title: z.string().trim().min(3, "Titre trop court.").max(60, "Titre trop long."),
  message: z
    .string()
    .trim()
    .min(10, "Message trop court.")
    .max(600, "Message trop long (600 caractères)."),
});

export type Audience = "published" | "pro" | "all";

/** Destinataires d'une audience : utilisé pour l'aperçu comme pour l'envoi. */
export async function countAudience(): Promise<Record<Audience, number>> {
  await requireRole("admin");
  const admin = createAdminClient();

  const [tous, pro, publies] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_pro", true),
    admin.from("shops").select("*", { count: "exact", head: true }).not("published_at", "is", null),
  ]);

  return {
    all: tous.count ?? 0,
    pro: pro.count ?? 0,
    published: publies.count ?? 0,
  };
}

async function resolveRecipients(audience: Audience) {
  const admin = createAdminClient();

  if (audience === "published") {
    const { data } = await admin
      .from("shops")
      .select("user_id, whatsapp_number")
      .not("published_at", "is", null)
      .eq("is_active", true);

    return (data ?? []).map((s) => ({ userId: s.user_id, phone: s.whatsapp_number }));
  }

  const requete = admin.from("profiles").select("id, phone").eq("role", "user");
  const { data } = audience === "pro" ? await requete.eq("is_pro", true) : await requete;

  return (data ?? []).map((p) => ({ userId: p.id, phone: p.phone }));
}

export async function broadcast(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = broadcastSchema.safeParse({
    audience: formData.get("audience") ?? "published",
    channels: formData.getAll("channels"),
    title: formData.get("title") ?? "",
    message: formData.get("message") ?? "",
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await requireRole("admin");

  const destinataires = await resolveRecipients(parsed.data.audience);
  if (destinataires.length === 0) return { message: "Aucun destinataire pour cette audience." };

  const resume: string[] = [];

  if (parsed.data.channels.includes("push")) {
    const resultat = await sendPushToUsers(
      destinataires.map((d) => d.userId),
      { title: parsed.data.title, body: parsed.data.message, url: "/dashboard" },
    );
    resume.push(
      `notifications : ${resultat.sent} envoyée${resultat.sent > 1 ? "s" : ""}` +
        (resultat.removed ? `, ${resultat.removed} abonnement(s) périmé(s) nettoyé(s)` : ""),
    );
  }

  if (parsed.data.channels.includes("whatsapp")) {
    const avecNumero = destinataires.filter((d) => d.phone);
    const lot = avecNumero.slice(0, MAX_WHATSAPP);
    const texte = `*${parsed.data.title}*\n\n${parsed.data.message}`;

    let envoyes = 0;
    let echecs = 0;
    for (const destinataire of lot) {
      const resultat = await sendWhatsAppMessage(destinataire.phone!, texte);
      if (resultat.ok) envoyes += 1;
      else echecs += 1;
    }

    resume.push(
      `WhatsApp : ${envoyes} envoyé${envoyes > 1 ? "s" : ""}` +
        (echecs ? `, ${echecs} en échec` : "") +
        (avecNumero.length > MAX_WHATSAPP
          ? `. Limité à ${MAX_WHATSAPP} par diffusion : ${avecNumero.length - MAX_WHATSAPP} restant(s)`
          : ""),
    );
  }

  revalidatePath("/admin/diffusion");
  return { ok: true, message: resume.join(" · ") };
}
