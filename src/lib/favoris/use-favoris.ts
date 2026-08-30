"use client";

import { useCallback, useSyncExternalStore } from "react";

// Favoris de l'acheteur.
//
// L'acheteur n'a pas de compte, et lui en demander un pour mettre un article de
// côté ferait perdre la vente. Les favoris vivent donc dans son navigateur,
// comme le panier — à une différence près : une seule liste pour toute la
// plateforme, puisqu'on parcourt plusieurs boutiques à la fois.
//
// Seuls les identifiants sont conservés. Le nom, le prix et la photo sont relus
// en base au moment d'afficher la liste : un article mis de côté il y a deux
// semaines s'affiche à son prix d'aujourd'hui, ou disparaît s'il a été retiré.
//
// Même mécanique que le panier : store au niveau du module, lu par
// useSyncExternalStore. Le compteur de l'en-tête et le cœur de chaque carte
// partagent le même état sans contexte React, et rien n'est écrit dans un effet
// au montage — donc pas de désynchronisation d'hydratation.

const CLE = "watshop:favoris";
const VIDE = "[]";

const abonnes = new Set<() => void>();

function lire(): string {
  try {
    return window.localStorage.getItem(CLE) ?? VIDE;
  } catch {
    // Navigation privée, stockage bloqué : la liste reste simplement vide.
    return VIDE;
  }
}

function ecrire(ids: string[]): void {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(ids));
  } catch {
    // Ignoré : mieux vaut des favoris qui ne persistent pas qu'une page cassée.
  }
  abonnes.forEach((abonne) => abonne());
}

function souscrire(abonne: () => void): () => void {
  abonnes.add(abonne);
  // "storage" couvre le cas de deux onglets ouverts sur le marketplace.
  window.addEventListener("storage", abonne);
  return () => {
    abonnes.delete(abonne);
    window.removeEventListener("storage", abonne);
  };
}

function analyser(brut: string): string[] {
  try {
    const valeur: unknown = JSON.parse(brut);
    return Array.isArray(valeur) ? (valeur as string[]).filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Rendu serveur : aucune liste.
 *
 * Le HTML envoyé est donc le même pour tout le monde — ce qui le rend
 * cacheable — et les cœurs s'allument à l'hydratation.
 */
function instantaneServeur(): string {
  return VIDE;
}

export function useFavoris() {
  const brut = useSyncExternalStore(souscrire, lire, instantaneServeur);
  const ids = analyser(brut);

  const basculer = useCallback((productId: string) => {
    const actuels = analyser(lire());
    ecrire(
      actuels.includes(productId)
        ? actuels.filter((id) => id !== productId)
        : [...actuels, productId],
    );
  }, []);

  const vider = useCallback(() => ecrire([]), []);

  return { ids, nombre: ids.length, estFavori: (id: string) => ids.includes(id), basculer, vider };
}
