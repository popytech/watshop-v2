"use client";

import { useEffect } from "react";

import { rememberAffiliateRef } from "@/lib/affiliate/ref";

/**
 * Capte le code revendeur d'un lien d'affiliation : il est mémorisé pour la
 * commande à venir, et le clic est enregistré côté serveur.
 *
 * Comme le compteur de visites, l'appel part du navigateur une fois la page
 * affichée — le compter au rendu gonflerait le chiffre à chaque préchargement
 * de lien par Next.
 */
export function AffiliateTracker({
  shopSlug,
  productId,
  code,
}: {
  shopSlug: string;
  productId: string;
  code: string;
}) {
  useEffect(() => {
    rememberAffiliateRef(shopSlug, code);

    void fetch("/api/affiliation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, productId }),
      keepalive: true,
    }).catch(() => {
      // Un clic non compté n'est pas une erreur visible par l'acheteur.
    });
  }, [shopSlug, productId, code]);

  return null;
}
