import { z } from "zod";
import { isReservedSlug, isValidShopSlug } from "@/lib/tenant";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, toE164 } from "@/lib/phone";

// Validation des formulaires vendeur. Même principe qu'en Phase 1 : rien n'est
// écrit en base sans être passé par zod côté serveur.

/** "350 000", "350000 GNF", "350.000" -> 350000 */
export function parseAmount(input: string): number | null {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

const amount = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const parsed = parseAmount(value);
    if (parsed === null) {
      ctx.addIssue({ code: "custom", message: "Montant invalide." });
      return z.NEVER;
    }
    return parsed;
  });

const optionalAmount = z
  .string()
  .trim()
  .transform((value) => (value ? parseAmount(value) : null));

export const shopIdentitySchema = z.object({
  name: z.string().trim().min(2, "Nom de boutique trop court.").max(60, "Nom trop long."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => !isReservedSlug(value), {
      message: "Cette adresse est réservée par Watshop, choisissez-en une autre.",
    })
    .refine(isValidShopSlug, {
      message: "Adresse invalide : 3 à 32 caractères, lettres, chiffres et tirets.",
    }),
  category: z.string().trim().max(40).optional(),
  description: z.string().trim().max(500, "Description trop longue.").optional(),
  countryCode: z
    .enum(COUNTRIES.map((c) => c.code) as [string, ...string[]])
    .default(DEFAULT_COUNTRY_CODE),
});

export const appearanceSchema = z.object({
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide.")
    .default("#128c4a"),
});

export const whatsappSchema = z
  .object({
    phone: z.string().trim().min(1, "Numéro WhatsApp requis."),
    mobileMoney: z.string().trim().optional(),
    countryCode: z
      .enum(COUNTRIES.map((c) => c.code) as [string, ...string[]])
      .default(DEFAULT_COUNTRY_CODE),
  })
  .superRefine((data, ctx) => {
    if (!toE164(data.phone, data.countryCode)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Ce numéro ne semble pas valide." });
    }
    if (data.mobileMoney && !toE164(data.mobileMoney, data.countryCode)) {
      ctx.addIssue({
        code: "custom",
        path: ["mobileMoney"],
        message: "Ce numéro Mobile Money ne semble pas valide.",
      });
    }
  });

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Nom du produit trop court.").max(80, "Nom trop long."),
    price: amount,
    promoPrice: optionalAmount,
    quantity: z
      .string()
      .trim()
      .transform((value) => (value ? Number(value.replace(/[^\d]/g, "")) : 0))
      .pipe(z.number().int().min(0).max(1_000_000)),
    description: z.string().trim().max(1000, "Description trop longue.").optional(),
    // Part du prix reversée au revendeur qui amène la vente. 0 = produit non
    // proposé au programme d'affiliation.
    resellerCommissionPct: z
      .string()
      .trim()
      .transform((value) => (value ? Number(value.replace(/[^\d]/g, "")) : 0))
      .pipe(z.number().int().min(0, "Minimum 0 %").max(50, "Maximum 50 %")),
    // Saisi en texte libre ("S, M, L") : plus simple à taper sur un téléphone
    // qu'une interface à tags.
    sizes: z
      .string()
      .trim()
      .optional()
      .transform((value) =>
        value
          ? value
              .split(/[,;]/)
              .map((size) => size.trim())
              .filter(Boolean)
              .slice(0, 20)
          : null,
      ),
  })
  .superRefine((data, ctx) => {
    if (data.promoPrice !== null && data.promoPrice >= data.price) {
      ctx.addIssue({
        code: "custom",
        path: ["promoPrice"],
        message: "Le prix promo doit être inférieur au prix normal.",
      });
    }
  });

export const orderStatusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
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
