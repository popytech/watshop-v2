import { z } from "zod";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, toE164 } from "@/lib/phone";

// Toute entrée utilisateur passe par zod avant d'atteindre Supabase.
// (L'audit du legacy relevait zod installé et utilisé dans 0 des 46 routes.)

const countryCode = z
  .enum(COUNTRIES.map((c) => c.code) as [string, ...string[]])
  .default(DEFAULT_COUNTRY_CODE);

export const channelSchema = z.enum(["whatsapp", "email"]);
export type Channel = z.infer<typeof channelSchema>;

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Indiquez votre nom (2 caractères minimum).")
  .max(80, "Nom trop long.");

export const emailSchema = z
  .email("Adresse email invalide.")
  .transform((value) => value.trim().toLowerCase());

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Numéro WhatsApp requis.");

export const requestOtpSchema = z
  .object({
    channel: channelSchema,
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    countryCode,
    name: nameSchema.optional(),
    mode: z.enum(["login", "register"]).default("login"),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "whatsapp") {
      if (!data.phone) {
        ctx.addIssue({ code: "custom", path: ["phone"], message: "Numéro WhatsApp requis." });
        return;
      }
      if (!toE164(data.phone, data.countryCode)) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Ce numéro ne semble pas valide.",
        });
      }
    } else if (!data.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Adresse email requise." });
    }

    if (data.mode === "register" && !data.name) {
      ctx.addIssue({ code: "custom", path: ["name"], message: "Indiquez votre nom." });
    }
  });

export const verifyOtpSchema = z.object({
  channel: channelSchema,
  identifier: z.string().min(3),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code contient 6 chiffres."),
});

/** Erreurs zod regroupées par champ, prêtes pour <FieldError>. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) result[key] = issue.message;
  }
  return result;
}
