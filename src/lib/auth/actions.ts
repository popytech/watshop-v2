"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { formatPhone, toE164 } from "@/lib/phone";
import { homePathForRole } from "@/lib/auth/roles";
import { fieldErrors, requestOtpSchema, verifyOtpSchema } from "@/lib/auth/schemas";
import type { Channel } from "@/lib/auth/schemas";
import type { AuthState } from "@/lib/auth/state";

// Tout le flux d'authentification passe par des Server Actions : la clé anon
// n'est jamais manipulée dans le navigateur, la validation zod est côté serveur
// et la session est posée en cookie httpOnly par @supabase/ssr — plus de token
// base64 non signé dans localStorage comme dans le legacy.

function readMode(formData: FormData): "login" | "register" {
  return formData.get("mode") === "register" ? "register" : "login";
}

/** Messages Supabase (anglais, techniques) traduits pour l'utilisateur final. */
function humanizeAuthError(message: string, mode: "login" | "register"): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("signups not allowed")) {
    return mode === "login"
      ? "Aucun compte pour cet identifiant. Créez d'abord votre compte."
      : "Les inscriptions sont désactivées sur ce projet Supabase.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Trop de tentatives. Patientez une minute avant de redemander un code.";
  }
  if (normalized.includes("expired")) {
    return "Code expiré. Demandez-en un nouveau.";
  }
  if (normalized.includes("invalid") && normalized.includes("token")) {
    return "Code incorrect.";
  }
  if (normalized.includes("phone provider") || normalized.includes("phone_provider")) {
    return "L'envoi WhatsApp n'est pas encore configuré côté Supabase (voir docs/PHASE-1-AUTH.md).";
  }
  if (normalized.includes("user already registered")) {
    return "Un compte existe déjà avec cet identifiant : connectez-vous.";
  }

  return "Envoi impossible pour le moment. Réessayez dans un instant.";
}

/**
 * Étape 1 : demander un code, par WhatsApp ou par email.
 *
 * Gère aussi le retour en arrière ("Modifier") : l'étape affichée vient
 * toujours de la réponse du serveur, jamais d'un état client parallèle qui
 * pourrait se désynchroniser pendant qu'une action est en vol.
 */
export async function requestOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (formData.get("intent") === "back") {
    return { step: "identifier", channel: (formData.get("channel") as Channel) ?? "whatsapp" };
  }

  const mode = readMode(formData);
  const parsed = requestOtpSchema.safeParse({
    channel: formData.get("channel") ?? "whatsapp",
    phone: formData.get("phone") ?? undefined,
    email: formData.get("email") ?? undefined,
    countryCode: formData.get("countryCode") ?? undefined,
    name: (formData.get("name") as string)?.trim() || undefined,
    mode,
  });

  if (!parsed.success) {
    const channel = (formData.get("channel") as Channel) ?? "whatsapp";
    return { step: "identifier", channel, errors: fieldErrors(parsed.error) };
  }

  const { channel, countryCode, name } = parsed.data;
  const supabase = await createClient();

  // En connexion on ne crée pas de compte : un identifiant inconnu doit dire
  // "inscrivez-vous" plutôt que de créer un compte fantôme silencieusement.
  const shouldCreateUser = mode === "register";
  const metadata = name ? { name, country_code: countryCode } : { country_code: countryCode };

  if (channel === "whatsapp") {
    const phone = toE164(parsed.data.phone!, countryCode)!;
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser, data: metadata },
    });

    if (error) {
      return { step: "identifier", channel, message: humanizeAuthError(error.message, mode) };
    }

    return {
      step: "code",
      channel,
      identifier: phone,
      label: formatPhone(phone),
      message: `Code envoyé sur WhatsApp au ${formatPhone(phone)}.`,
    };
  }

  const email = parsed.data.email!;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser, data: metadata },
  });

  if (error) {
    return { step: "identifier", channel, message: humanizeAuthError(error.message, mode) };
  }

  return {
    step: "code",
    channel,
    identifier: email,
    label: email,
    message: `Code envoyé à ${email}.`,
  };
}

/** Étape 2 : vérifier le code et ouvrir la session. */
export async function verifyOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const channel = (formData.get("channel") as Channel) ?? "whatsapp";
  const identifier = String(formData.get("identifier") ?? "");
  const label = (formData.get("label") as string) || identifier;

  const parsed = verifyOtpSchema.safeParse({
    channel,
    identifier,
    token: formData.get("token") ?? "",
  });

  if (!parsed.success) {
    return { step: "code", channel, identifier, label, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } =
    parsed.data.channel === "whatsapp"
      ? await supabase.auth.verifyOtp({
          phone: parsed.data.identifier,
          token: parsed.data.token,
          type: "sms",
        })
      : await supabase.auth.verifyOtp({
          email: parsed.data.identifier,
          token: parsed.data.token,
          type: "email",
        });

  if (error || !data.user) {
    return {
      step: "code",
      channel,
      identifier,
      label,
      message: error ? humanizeAuthError(error.message, "login") : "Code incorrect.",
    };
  }

  // Le trigger handle_new_user a créé le profil ; on complète seulement ce que
  // le formulaire sait en plus (nom saisi, pays choisi), sans écraser l'existant.
  const name = (formData.get("name") as string)?.trim();
  const countryCode = (formData.get("countryCode") as string)?.trim();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, country_code")
    .eq("id", data.user.id)
    .single();

  const patch: { name?: string; country_code?: string } = {};
  if (name && !profile?.name) patch.name = name;
  if (countryCode && countryCode !== profile?.country_code) patch.country_code = countryCode;
  if (Object.keys(patch).length > 0) {
    await supabase.from("profiles").update(patch).eq("id", data.user.id);
  }

  // On n'accepte que des destinations internes : un ?next=https://… serait une
  // redirection ouverte.
  const next = (formData.get("next") as string) ?? "";
  const destination =
    next.startsWith("/") && !next.startsWith("//")
      ? next
      : homePathForRole(profile?.role ?? "user");

  revalidatePath("/", "layout");
  redirect(destination);
}

/** Connexion Google — la redirection OAuth est déclenchée côté serveur. */
export async function signInWithGoogle(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const next = (formData.get("next") as string) || "/dashboard";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data.url) {
    return {
      step: "identifier",
      channel: "whatsapp",
      message: "Connexion Google indisponible pour le moment.",
    };
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
