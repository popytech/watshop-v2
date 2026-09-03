// Interprétation d'un lien vidéo pour la section guide de l'accueil.
//
// Le lien est fourni tel quel dans NEXT_PUBLIC_GUIDE_VIDEO_URL, et peut prendre
// plusieurs formes : une adresse YouTube (watch, youtu.be, shorts, embed), une
// adresse Vimeo, ou un fichier hébergé (mp4/webm). On les ramène ici à une seule
// forme — une URL prête à mettre dans un lecteur — pour que le composant n'ait
// pas à connaître ces cas.
//
// Pas de dépendance, pas d'appel réseau : une simple lecture d'URL. Un lien
// illisible renvoie null, et la section ne s'affiche pas plutôt que d'afficher
// un lecteur cassé.

export type VideoSource =
  | { kind: "embed"; embedUrl: string; poster: string | null }
  | { kind: "file"; embedUrl: string; poster: string | null };

function youtube(id: string): VideoSource {
  return {
    kind: "embed",
    // -nocookie : aucun traceur posé tant que le lecteur n'est pas chargé, et il
    // ne l'est qu'à l'entrée de la section dans la vue. mute=1 est la condition
    // que posent les navigateurs pour autoriser une lecture automatique ;
    // playsinline=1 évite le plein écran forcé sur iPhone ; rel=0 garde les
    // suggestions dans la même chaîne.
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`,
    // maxresdefault : la miniature en 1280×720, plein 16:9 — donc la miniature
    // personnalisée s'affiche entière, sans le recadrage qu'imposerait le 4:3 de
    // hqdefault (qui rognerait les bords, et le texte avec). Chargée en fond CSS,
    // sans next/image ni hôte distant à déclarer ; et si elle venait à manquer,
    // le dégradé de marque dessous prend le relais.
    poster: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
  };
}

export function parseVideoSource(url: string): VideoSource | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    // watch?v=ID, ou dernier segment pour shorts/ID et embed/ID.
    const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop() ?? "";
    if (id && id !== "watch") return youtube(id);
  }

  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    if (id) return youtube(id);
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean).pop() ?? "";
    if (/^\d+$/.test(id)) {
      return {
        kind: "embed",
        // muted=1 : même condition que YouTube pour la lecture automatique.
        embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&playsinline=1`,
        poster: null,
      };
    }
  }

  // Tout le reste : un fichier vidéo hébergé, lu par le lecteur natif.
  return { kind: "file", embedUrl: url, poster: null };
}
