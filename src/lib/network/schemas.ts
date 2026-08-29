import { z } from "zod";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, toE164 } from "@/lib/phone";
import { parseAmount } from "@/lib/shop/schemas";

// Validation des écrans réseau (zones de livraison, livreurs) et paiement.

const countryCode = z
  .enum(COUNTRIES.map((c) => c.code) as [string, ...string[]])
  .default(DEFAULT_COUNTRY_CODE);

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

export const deliveryZoneSchema = z.object({
  zoneId: z.uuid().optional(),
  zoneName: z.string().trim().min(2, "Nom de zone trop court.").max(60, "Nom trop long."),
  price: amount,
  estimatedDelay: z.string().trim().max(40).optional(),
  freeAbove: optionalAmount,
});

export const deliveryPartnerSchema = z.object({
  partnerId: z.uuid().optional(),
  name: z.string().trim().min(2, "Nom trop court.").max(60, "Nom trop long."),
  phone: z.string().trim().min(1, "Numéro WhatsApp requis."),
  city: z.string().trim().min(2, "Ville requise.").max(60),
  vehicleType: z.enum(["moto", "velo", "voiture", "a_pied"]),
  countryCode,
});

export const assignPartnerSchema = z.object({
  orderId: z.uuid(),
  // Chaîne vide = retirer l'affectation.
  partnerId: z.union([z.uuid(), z.literal("")]),
});

export const deliveryStatusSchema = z.object({
  orderId: z.uuid(),
  // Un livreur ne fait qu'avancer la commande ; la base le vérifie aussi.
  status: z.enum(["shipped", "delivered"]),
});

export const paymentDeclarationSchema = z.object({
  amount,
  reference: z
    .string()
    .trim()
    .min(4, "Indiquez la référence du transfert.")
    .max(60, "Référence trop longue."),
  payerPhone: z.string().trim().min(1, "Numéro utilisé pour le paiement requis."),
  countryCode,
});

export function normalizePhone(phone: string, country: string): string | null {
  return toE164(phone, country);
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) result[key] = issue.message;
  }
  return result;
}
