import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { otpMessage, sendWhatsAppMessage } from "@/lib/fonnte";
import { toFonnteTarget } from "@/lib/phone";

// "Send SMS Hook" de Supabase Auth.
//
// C'est Supabase qui génère, stocke, expire et vérifie le code : ce endpoint ne
// fait que le *livrer*, sur WhatsApp via Fonnte. D'où l'absence de table
// whatsapp_otp_codes dans le schéma — le legacy réimplémentait tout ça à la
// main (et sans limite de tentatives).
//
// Supabase signe chaque appel selon la spec Standard Webhooks. Sans signature
// valide, ce endpoint public permettrait à n'importe qui de faire envoyer des
// messages WhatsApp sur notre compte Fonnte.

export const runtime = "nodejs";

const MAX_SKEW_SECONDS = 5 * 60;

type HookPayload = {
  user?: { id?: string; phone?: string };
  sms?: { otp?: string };
};

function verifySignature(
  rawBody: string,
  headers: Headers,
  secret: string,
): { ok: true } | { ok: false; reason: string } {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");

  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, reason: "en-têtes de signature manquants" };
  }

  const skew = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(skew) || skew > MAX_SKEW_SECONDS) {
    return { ok: false, reason: "horodatage hors tolérance" };
  }

  // Le secret est fourni par Supabase sous la forme "v1,whsec_<base64>".
  const key = Buffer.from(secret.replace(/^v1,\s*/, "").replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest("base64");
  const expectedBuffer = Buffer.from(expected);

  // Le header peut contenir plusieurs signatures (rotation de secret) :
  // "v1,<sig1> v1,<sig2>". Comparaison à temps constant — le legacy comparait
  // son secret admin avec un simple !==.
  const matches = signatureHeader.split(" ").some((part) => {
    const value = part.split(",")[1];
    if (!value) return false;
    const candidate = Buffer.from(value);
    return (
      candidate.length === expectedBuffer.length && timingSafeEqual(candidate, expectedBuffer)
    );
  });

  return matches ? { ok: true } : { ok: false, reason: "signature invalide" };
}

function hookError(httpCode: number, message: string) {
  // Format d'erreur attendu par Supabase Auth : il le remonte à l'appelant.
  return NextResponse.json({ error: { http_code: httpCode, message } }, { status: httpCode });
}

export async function POST(request: Request) {
  const secret = process.env.SUPABASE_SEND_SMS_HOOK_SECRET;
  if (!secret) {
    console.error("[send-sms] SUPABASE_SEND_SMS_HOOK_SECRET absent");
    return hookError(500, "Hook non configuré");
  }

  const rawBody = await request.text();
  const signature = verifySignature(rawBody, request.headers, secret);
  if (!signature.ok) {
    console.warn(`[send-sms] appel rejeté : ${signature.reason}`);
    return hookError(401, "Signature invalide");
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(rawBody) as HookPayload;
  } catch {
    return hookError(400, "Corps de requête invalide");
  }

  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;
  if (!phone || !otp) {
    return hookError(400, "Numéro ou code manquant");
  }

  const result = await sendWhatsAppMessage(toFonnteTarget(phone), otpMessage(otp));
  if (!result.ok) {
    console.error(`[send-sms] échec Fonnte : ${result.reason}`);
    // 500 : Supabase renverra une erreur au client, qui pourra réessayer.
    return hookError(500, "Envoi WhatsApp impossible");
  }

  return NextResponse.json({});
}
