"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker.
 *
 * Uniquement en production : en développement, il masquerait les changements de
 * code derrière son cache et ferait perdre un temps fou à comprendre pourquoi
 * une modification « ne passe pas ».
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Un service worker qui ne s'installe pas ne doit rien casser : le site
      // fonctionne, il perd seulement le mode hors ligne et les notifications.
    });
  }, []);

  return null;
}
