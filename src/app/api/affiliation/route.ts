import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

// Enregistrement d'un clic sur un lien d'affiliation.
//
// L'écriture passe par la clé service_role : le visiteur qui clique n'est pas
// authentifié, et affiliate_clicks n'a volontairement aucune policy
// d'insertion — un revendeur ne doit pas pouvoir gonfler ses propres chiffres
// en appelant l'API depuis son compte.
//
// Ce endpoint ne fait rien d'autre qu'insérer une ligne, après avoir vérifié
// que le code correspond bien à un revendeur existant.

export const runtime = "nodejs";

const bodySchema = z.object({
  code: z.string().trim().regex(/^RV[A-Z0-9]{6}$/i),
  productId: z.uuid().optional(),
});

export async function POST(request: Request) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const admin = createAdminClient();
  const code = parsed.data.code.toUpperCase();

  const { data: reseller } = await admin
    .from("profiles")
    .select("id")
    .eq("affiliate_code", code)
    .eq("role", "reseller")
    .maybeSingle();

  if (!reseller) return NextResponse.json({ ok: false }, { status: 404 });

  await admin.from("affiliate_clicks").insert({
    referrer_id: reseller.id,
    product_id: parsed.data.productId ?? null,
    affiliate_code: code,
  });

  return NextResponse.json({ ok: true });
}
