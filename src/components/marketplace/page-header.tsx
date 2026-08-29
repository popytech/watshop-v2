import type { ReactNode } from "react";

export function MarketplacePageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  /** Le compte de résultats, rendu par la page qui connaît son total. */
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

/** Affiché quand aucun résultat ne sort — filtré, ou catalogue encore vide. */
export function AucunResultat({
  titre,
  filtre,
}: {
  /** Accordé par l'appelant : « Aucune boutique trouvée », « Aucun produit trouvé ». */
  titre: string;
  /** Un filtre est actif : le vide vient probablement de là, pas du catalogue. */
  filtre: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed px-6 py-16 text-center">
      <p className="font-medium">{titre}</p>
      <p className="pt-1 text-sm text-muted-foreground">
        {filtre
          ? "Essayez avec moins de filtres, ou un autre mot-clé."
          : "Les premières boutiques arrivent. Revenez bientôt."}
      </p>
    </div>
  );
}
