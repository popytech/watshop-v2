/**
 * Les comptes publics de Watshop.
 *
 * Un seul endroit, et surtout : seuls les liens réellement fournis sont rendus.
 * Une icône Instagram qui mène à une page inexistante fait plus de mal qu'une
 * icône absente — l'internaute clique, tombe sur une erreur, et en déduit que
 * le reste est à l'avenant.
 *
 * Pour en activer un, remplacez la chaîne vide par l'adresse du compte. Le pied
 * de page l'affichera automatiquement.
 */
export const SOCIAL_LINKS = [
  { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/224612960453" },
  { id: "facebook", label: "Facebook", href: "" },
  { id: "instagram", label: "Instagram", href: "" },
  { id: "tiktok", label: "TikTok", href: "" },
] as const;

/**
 * Moyens de paiement réellement acceptés.
 *
 * Volontairement en toutes lettres plutôt qu'en logos de cartes : Watshop
 * n'accepte ni Visa ni Mastercard, et afficher leurs logos comme le font les
 * boutiques occidentales serait faux. Ce qui marche aujourd'hui en Guinée, ce
 * sont le Mobile Money et l'espèce à la livraison.
 *
 * `aVenir` grise l'entrée : GNAKRYPAY est prévu, ses accès API ne sont pas
 * encore fournis (voir src/lib/payment/providers.ts).
 */
export const PAYMENT_METHODS = [
  { label: "Orange Money", aVenir: false },
  { label: "MTN Mobile Money", aVenir: false },
  { label: "Paiement à la livraison", aVenir: false },
  { label: "GNAKRYPAY", aVenir: true },
] as const;
