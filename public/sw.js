// Service worker de Watshop.
//
// Deux rôles, volontairement limités :
//   1. servir une page de repli quand le réseau manque — en Guinée, la
//      connexion se coupe souvent en pleine navigation ;
//   2. recevoir les notifications push.
//
// Aucun cache agressif des pages : l'application affiche des commandes et des
// stocks, montrer une version périmée serait pire que rien. Seuls les fichiers
// statiques de l'App Router (immuables, versionnés par leur nom) sont gardés.

const CACHE = "watshop-v1";
const HORS_LIGNE = "/hors-ligne";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([HORS_LIGNE])).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const requete = event.request;
  if (requete.method !== "GET") return;

  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;

  // Fichiers immuables de l'App Router : le nom contient déjà un hachage, donc
  // le cache ne peut pas servir une version périmée.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(requete).then(
        (enCache) =>
          enCache ??
          fetch(requete).then((reponse) => {
            const copie = reponse.clone();
            caches.open(CACHE).then((cache) => cache.put(requete, copie));
            return reponse;
          }),
      ),
    );
    return;
  }

  // Navigation : toujours le réseau d'abord. Hors ligne, on montre une page qui
  // le dit, plutôt que l'écran d'erreur du navigateur.
  if (requete.mode === "navigate") {
    event.respondWith(fetch(requete).catch(() => caches.match(HORS_LIGNE)));
  }
});

self.addEventListener("push", (event) => {
  let charge = {};
  try {
    charge = event.data ? event.data.json() : {};
  } catch {
    charge = { title: "Watshop", body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(charge.title ?? "Watshop", {
      body: charge.body ?? "",
      icon: "/icone-192.png",
      badge: "/icone-192.png",
      tag: charge.tag ?? "watshop",
      data: { url: charge.url ?? "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cible = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
      // Si l'application est déjà ouverte, on y navigue au lieu d'ouvrir un
      // second onglet.
      for (const fenetre of fenetres) {
        if ("focus" in fenetre) {
          fenetre.navigate?.(cible);
          return fenetre.focus();
        }
      }
      return self.clients.openWindow(cible);
    }),
  );
});
