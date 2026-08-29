import { z } from "zod";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, toE164 } from "@/lib/phone";

// Ce que l'acheteur envoie au moment de commander. Tout est revalidé côté
// serveur : les prix et les montants présents dans le panier ne sont jamais
// repris tels quels (voir src/lib/order/actions.ts).

export const cartLineSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().min(1).max(999),
  size: z.string().trim().max(20).nullable().default(null),
});

export type CartLineInput = z.infer<typeof cartLineSchema>;

export const checkoutSchema = z
  .object({
    shopSlug: z.string().trim().min(1),
    source: z.enum(["storefront", "whatsapp"]).default("storefront"),
    customerName: z
      .string()
      .trim()
      .min(2, "Indiquez votre nom.")
      .max(80, "Nom trop long."),
    customerPhone: z.string().trim().min(1, "Numéro de téléphone requis."),
    customerAddress: z
      .string()
      .trim()
      .min(4, "Indiquez où livrer la commande.")
      .max(200, "Adresse trop longue."),
    customerCity: z.string().trim().max(60).optional(),
    deliveryZoneId: z.uuid().nullable().default(null),
    note: z.string().trim().max(300).optional(),
    countryCode: z
      .enum(COUNTRIES.map((c) => c.code) as [string, ...string[]])
      .default(DEFAULT_COUNTRY_CODE),
    affiliateCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^RV[A-Z0-9]{6}$/, "Code revendeur invalide.")
      .optional(),
    items: z.array(cartLineSchema).min(1, "Votre panier est vide."),
  })
  .superRefine((data, ctx) => {
    if (!toE164(data.customerPhone, data.countryCode)) {
      ctx.addIssue({
        code: "custom",
        path: ["customerPhone"],
        message: "Ce numéro ne semble pas valide.",
      });
    }
  });

/** Le panier arrive en JSON dans un champ caché du formulaire. */
export function parseCartField(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || !raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) result[key] = issue.message;
  }
  return result;
}
