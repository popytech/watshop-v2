import type { MetadataRoute } from "next";

// Manifeste PWA : c'est lui qui rend l'application installable sur l'écran
// d'accueil. Pour un marché où beaucoup de vendeurs travaillent au téléphone,
// c'est la différence entre « un site » et « une application ».
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Watshop — votre boutique WhatsApp",
    short_name: "Watshop",
    description: "Créez votre boutique WhatsApp et recevez vos commandes en quelques minutes.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#128c4a",
    lang: "fr",
    categories: ["business", "shopping"],
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
