import "server-only";

// Passerelle WhatsApp Fonnte.
//
// Ne sert plus qu'à *livrer* des messages : le code OTP lui-même est généré et
// vérifié par Supabase Auth (voir src/app/api/auth/hooks/send-sms/route.ts).
// À remplacer par l'API WhatsApp Business officielle quand Meta aura répondu
// (ROADMAP.md, Phase 6) — seul ce fichier changera.

const FONNTE_ENDPOINT = "https://api.fonnte.com/send";

export type SendResult = { ok: true } | { ok: false; reason: string };

export async function sendWhatsAppMessage(
  target: string,
  message: string,
): Promise<SendResult> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) return { ok: false, reason: "FONNTE_TOKEN absent" };

  try {
    const response = await fetch(FONNTE_ENDPOINT, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ target, message }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return { ok: false, reason: `Fonnte HTTP ${response.status}` };
    }

    const data: unknown = await response.json();
    const status = (data as { status?: unknown }).status;
    if (status !== true) {
      const reason = (data as { reason?: string }).reason ?? "réponse Fonnte inattendue";
      return { ok: false, reason };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "erreur réseau",
    };
  }
}

export function otpMessage(code: string): string {
  return [
    "*WATSHOP* — Code de vérification",
    "",
    `Votre code : *${code}*`,
    "",
    "Valable 10 minutes.",
    "Ne partagez ce code avec personne : Watshop ne vous le demandera jamais.",
  ].join("\n");
}
