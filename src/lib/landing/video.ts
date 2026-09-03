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
    // -nocookie : pas de traceur posé tant que le visiteur n'a pas lancé la
    // lecture. autoplay=1 vaut parce que le clic sur l'affiche fait figure de
    // geste utilisateur ; rel=0 garde les suggestions dans la même chaîne.
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`,
    // Miniature toujours présente (contrairement à maxres), chargée en fond CSS
    // — donc sans next/image ni configuration d'hôte distant.
    poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
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
        embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`,
        poster: null,
      };
    }
  }

  // Tout le reste : un fichier vidéo hébergé, lu par le lecteur natif.
  return { kind: "file", embedUrl: url, poster: null };
}
