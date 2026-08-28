"use client";

import { useEffect } from "react";

import { useCart } from "@/lib/cart/use-cart";

/**
 * Vide le panier une fois la commande enregistrée. Le nettoyage ne peut pas se
 * faire dans l'action (elle tourne sur le serveur, le panier est dans le
 * navigateur) : il se fait donc à l'arrivée sur la page de confirmation.
 */
export function ClearCart({ shopSlug }: { shopSlug: string }) {
  const { clear } = useCart(shopSlug);

  useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
