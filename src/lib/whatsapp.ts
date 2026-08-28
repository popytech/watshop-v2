import { toFonnteTarget } from "@/lib/phone";

// Liens WhatsApp et messages de partage.
//
// Rien ici n'appelle d'API : ce sont des liens wa.me que l'utilisateur ouvre
// lui-même. L'envoi automatisé passe par Fonnte (src/lib/fonnte.ts), et plus
// tard par l'API WhatsApp Business officielle.

/** Ouvre une conversation WhatsApp, avec un message pré-rempli optionnel. */
export function whatsappLink(phone: string, message?: string): string {
  const target = toFonnteTarget(phone);
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${target}${query}`;
}

/** Message que le vendeur envoie à son client au sujet d'une commande. */
export function orderFollowUpMessage(params: {
  customerName: string;
  reference: string;
  shopName: string;
}): string {
  const prenom = params.customerName.split(" ")[0] || params.customerName;
  return [
    `Bonjour ${prenom},`,
    "",
    `Je vous contacte au sujet de votre commande ${params.reference} sur ${params.shopName}.`,
  ].join("\n");
}

/** Message de partage de la boutique, réutilisé par tous les boutons de partage. */
export function shopShareMessage(shopName: string, url: string): string {
  return `Découvrez ${shopName} sur Watshop : ${url}`;
}

export type SharePlatform = "whatsapp" | "facebook" | "instagram" | "tiktok";

/**
 * Instagram et TikTok n'acceptent pas de lien de partage pré-rempli depuis le
 * web : pour ces deux-là, la seule action possible est de copier le message.
 */
export function shareLink(
  platform: SharePlatform,
  url: string,
  message: string,
): string | null {
  switch (platform) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(message)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    default:
      return null;
  }
}
