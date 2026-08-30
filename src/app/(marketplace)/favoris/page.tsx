import type { Metadata } from "next";

import { FavorisListe } from "@/components/marketplace/favoris-liste";

export const metadata: Metadata = {
  title: "Mes favoris — Watshop",
  description: "Les articles que vous avez mis de côté sur Watshop.",
  // Cette page n'a pas deux fois le même contenu : elle dépend du navigateur de
  // chacun. Rien à indexer, et rien à suivre depuis les liens qu'elle contient.
  robots: { index: false, follow: false },
};

export default function FavorisPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mes favoris</h1>
        <p className="text-muted-foreground">
          Vos articles mis de côté restent dans ce navigateur, sans compte à créer. Ils ne suivent
          donc pas sur un autre appareil.
        </p>
      </div>

      <FavorisListe />
    </div>
  );
}
