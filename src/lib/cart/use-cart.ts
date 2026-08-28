"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Panier de l'acheteur.
//
// L'acheteur n'a pas de compte : le panier vit dans son navigateur, par
// boutique, et n'est envoyé au serveur qu'au moment de commander. Les prix
// stockés ici ne servent qu'à l'affichage — le serveur les recalcule depuis la
// base avant de créer la commande (voir src/lib/order/actions.ts).
//
// Le store est module-level et lu via useSyncExternalStore : le bouton panier
// de l'en-tête et la page panier partagent le même état sans contexte React,
// et il n'y a pas de setState dans un effet au montage (donc pas de
// désynchronisation d'hydratation).

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  quantity: number;
  size: string | null;
  imageUrl: string | null;
};

const PREFIX = "watshop:panier:";
const EMPTY = "[]";

const listeners = new Set<() => void>();

function storageKey(shopSlug: string): string {
  return `${PREFIX}${shopSlug}`;
}

function read(shopSlug: string): string {
  try {
    return window.localStorage.getItem(storageKey(shopSlug)) ?? EMPTY;
  } catch {
    // Navigation privée, stockage bloqué : le panier reste simplement vide.
    return EMPTY;
  }
}

function write(shopSlug: string, items: CartItem[]): void {
  try {
    window.localStorage.setItem(storageKey(shopSlug), JSON.stringify(items));
  } catch {
    // Ignoré : mieux vaut un panier qui ne persiste pas qu'une page cassée.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // "storage" couvre le cas de deux onglets ouverts sur la même boutique.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function parse(raw: string): CartItem[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as CartItem[]) : [];
  } catch {
    return [];
  }
}

/** Deux lignes sont la même si c'est le même produit dans la même taille. */
function sameLine(a: CartItem, b: { productId: string; size: string | null }): boolean {
  return a.productId === b.productId && a.size === b.size;
}

export function useCart(shopSlug: string) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(shopSlug),
    () => EMPTY,
  );

  const items = useMemo(() => parse(raw), [raw]);

  const add = useCallback(
    (item: CartItem) => {
      const next = [...parse(read(shopSlug))];
      const index = next.findIndex((line) => sameLine(line, item));

      if (index >= 0) {
        next[index] = { ...next[index], quantity: next[index].quantity + item.quantity };
      } else {
        next.push(item);
      }

      write(shopSlug, next);
    },
    [shopSlug],
  );

  const setQuantity = useCallback(
    (productId: string, size: string | null, quantity: number) => {
      const next = parse(read(shopSlug))
        .map((line) => (sameLine(line, { productId, size }) ? { ...line, quantity } : line))
        .filter((line) => line.quantity > 0);

      write(shopSlug, next);
    },
    [shopSlug],
  );

  const remove = useCallback(
    (productId: string, size: string | null) => {
      write(
        shopSlug,
        parse(read(shopSlug)).filter((line) => !sameLine(line, { productId, size })),
      );
    },
    [shopSlug],
  );

  const clear = useCallback(() => write(shopSlug, []), [shopSlug]);

  const count = items.reduce((total, line) => total + line.quantity, 0);
  const subtotal = items.reduce((total, line) => total + line.unitPrice * line.quantity, 0);

  return { items, count, subtotal, add, setQuantity, remove, clear };
}
