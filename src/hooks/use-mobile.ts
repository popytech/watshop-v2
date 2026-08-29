import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;
const REQUETE = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/*
 * Version d'origine de shadcn réécrite : elle appelait setState dans un effet,
 * ce que React déconseille désormais. Une media query est exactement le cas que
 * useSyncExternalStore sert à couvrir — un état qui vit hors de React et dont on
 * s'abonne aux changements. C'est déjà le motif retenu ailleurs dans le projet.
 */
function sAbonner(auChangement: () => void) {
  const mql = window.matchMedia(REQUETE);
  mql.addEventListener("change", auChangement);
  return () => mql.removeEventListener("change", auChangement);
}

function lireEtat() {
  return window.matchMedia(REQUETE).matches;
}

/** Au rendu serveur il n'y a pas de fenêtre à mesurer : on suppose le bureau,
 *  comme le faisait la version d'origine avant son premier effet. */
function lireEtatServeur() {
  return false;
}

export function useIsMobile() {
  return useSyncExternalStore(sAbonner, lireEtat, lireEtatServeur);
}
