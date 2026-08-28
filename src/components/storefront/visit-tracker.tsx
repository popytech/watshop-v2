"use client";

import { useEffect } from "react";

/**
 * Enregistre une visite, une fois la page affichée.
 *
 * Volontairement côté client : compter pendant le rendu serveur gonflerait le
 * chiffre à chaque préchargement de lien ou re-rendu. Le corps de la requête
 * ne contient que des identifiants — l'empreinte du visiteur est calculée
 * côté serveur, à partir de l'IP et du user agent, et n'est jamais réversible.
 */
export function VisitTracker({
  shopId,
  productId,
}: {
  shopId: string;
  productId?: string;
}) {
  useEffect(() => {
    const payload = JSON.stringify({ shopId, productId });

    // sendBeacon survit à une navigation immédiate ; fetch sert de repli.
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/visites", new Blob([payload], { type: "application/json" }));
      return;
    }

    void fetch("/api/visites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Une visite non comptée n'est pas une erreur visible par l'acheteur.
    });
  }, [shopId, productId]);

  return null;
}
