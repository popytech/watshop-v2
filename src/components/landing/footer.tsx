import Link from "next/link";

import { Logo } from "@/components/brand/logo";

// Ancres préfixées par « / » : ce pied de page sert aussi au marketplace, d'où
// un « #tarifs » seul ne mènerait nulle part.
const COLONNES = [
  {
    titre: "Acheter",
    liens: [
      { href: "/produits", label: "Tous les produits" },
      { href: "/boutiques", label: "Toutes les boutiques" },
    ],
  },
  {
    titre: "Produit",
    liens: [
      { href: "/#fonctionnement", label: "Fonctionnement" },
      { href: "/#tarifs", label: "Tarifs" },
      { href: "/#questions", label: "Questions" },
    ],
  },
  {
    titre: "Rejoindre",
    liens: [
      { href: "/register", label: "Créer une boutique" },
      { href: "/register", label: "Devenir agent" },
      { href: "/register", label: "Devenir revendeur" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              La boutique en ligne des commerçants africains, pensée pour WhatsApp.
            </p>
          </div>

          {/* Trois colonnes tiennent mal côte à côte sur 360 px : elles passent
              à la ligne plutôt que de se serrer. */}
          <div className="flex flex-wrap gap-8 sm:gap-12">
            {COLONNES.map((colonne) => (
              <div key={colonne.titre} className="flex flex-col gap-2">
                <p className="text-sm font-medium">{colonne.titre}</p>
                {colonne.liens.map((lien) => (
                  <Link
                    key={lien.label}
                    href={lien.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {lien.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Watshop — Conakry, Guinée. Aucune commission sur vos ventes.</p>

          {/* Lien sortant : `noreferrer` couvre aussi l'ancienne faille de
              `target="_blank"`, où la page ouverte pouvait manipuler la nôtre. */}
          <p>
            Développé par{" "}
            <a
              href="https://gnakry.dev"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              GNAKRY DEV
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
