import type { NextConfig } from "next";

// Les images des boutiques (logos, photos produits) sont servies par Supabase
// Storage — et le jour où on basculera sur Cloudflare R2, c'est ici qu'on
// ajoutera le domaine correspondant (voir src/lib/storage.ts).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  // undici n'est utilisé que par le client de la passerelle (sortie par IP fixe
  // via ProxyAgent). On le garde externe au bundle serveur : résolu depuis
  // node_modules à l'exécution, sans être empaqueté ni recompilé.
  serverExternalPackages: ["undici"],
};

export default nextConfig;
