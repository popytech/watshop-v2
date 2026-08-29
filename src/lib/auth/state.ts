import type { Channel } from "@/lib/auth/schemas";

// État partagé entre les Server Actions d'authentification et le formulaire.
// Il vit dans son propre module parce qu'un fichier "use server" ne peut
// exporter que des fonctions asynchrones — pas la constante initiale.

export type AuthState = {
  step: "identifier" | "code";
  channel: Channel;
  /** E.164 ou email — renvoyé au formulaire pour l'étape "code". */
  identifier?: string;
  /** Version lisible affichée à l'utilisateur. */
  label?: string;
  message?: string;
  errors?: Record<string, string>;
};

export const initialAuthState: AuthState = { step: "identifier", channel: "whatsapp" };

/**
 * Longueur du code de vérification, en un seul endroit.
 *
 * Doit correspondre au réglage Supabase « Email OTP Length » (Authentication →
 * Sign In / Providers → Email) et à son équivalent pour le téléphone. Si les
 * deux divergent, l'utilisateur reçoit un code qu'il ne peut pas saisir en
 * entier : la case a moins de chiffres que le code, et la vérification échoue
 * sans que rien n'indique pourquoi.
 */
export const OTP_LENGTH = 6;
