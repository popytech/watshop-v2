import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

// Compteur de visites de la boutique publique.
//
// L'écriture passe par la clé service_role : le visiteur n'est pas authentifié
// et shop_visits n'a volontairement aucune policy d'insertion. En échange, ce
// endpoint ne fait rien d'autre qu'insérer une ligne, après avoir vérifié que
// la boutique existe et est publiée.
//
// Aucune adresse IP n'est conservée : seule une empreinte SHA-256 de (IP +
// user agent + sel) sert à distinguer deux visiteurs.

export const runtime = "nodejs";

const DEDUPE_MINUTES = 30;

const bodySchema = z.object({
  shopId: z.uuid(),
  productId: z.uuid().optional(),
});

function visitorHash(request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "inconnu";
  const agent = request.headers.get("user-agent") ?? "inconnu";
  const salt = process.env.VISIT_HASH_SALT ?? "watshop";

  return createHash("sha256").update(`${ip}|${agent}|${salt}`).digest("hex");
}

export async function POST(request: Request) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { shopId, productId } = parsed.data;
  const admin = createAdminClient();

  const { data: shop } = await admin
    .from("shops")
    .select("id, is_active, published_at")
    .eq("id", shopId)
    .maybeSingle();

  if (!shop || !shop.is_active || !shop.published_at) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const hash = visitorHash(request);
  const since = new Date(Date.now() - DEDUPE_MINUTES * 60_000).toISOString();

  // Un même visiteur qui parcourt dix produits reste un visiteur : on ne
  // compte qu'une fois par demi-heure et par boutique.
  const { count } = await admin
    .from("shop_visits")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .eq("visitor_hash", hash)
    .gte("created_at", since);

  if (count && count > 0) {
    return NextResponse.json({ ok: true, deja: true });
  }

  await admin.from("shop_visits").insert({
    shop_id: shopId,
    product_id: productId ?? null,
    visitor_hash: hash,
  });

  return NextResponse.json({ ok: true });
}
