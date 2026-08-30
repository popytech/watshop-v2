import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon, TiktokIcon } from "@/components/brand/social-icons";
import { NewsletterForm } from "@/components/landing/newsletter-form";
import { PAYMENT_METHODS, SOCIAL_LINKS } from "@/lib/site-links";
import { COUNTRIES } from "@/lib/phone";
import { cn } from "@/lib/utils";

// Les pays où Watshop fonctionne, tirés de la liste qui sert aussi aux
// sélecteurs de formulaire. Une seule source : la page ne peut pas annoncer un
// pays dont on ne saurait pas valider les numéros.
const PAYS_SERVIS = COUNTRIES.map((p) => p.name).join(", ");

// Une icône par identifiant de SOCIAL_LINKS.
const ICONES = {
  whatsapp: MessageCircle,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TiktokIcon,
} as const;

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
        {/* Une grille, pas trois blocs en ligne.
            En `flex-row justify-between`, la colonne de l'infolettre se faisait
            écraser par les deux autres : son bouton étant `shrink-0`, c'est le
            champ e-mail qui rétrécissait, jusqu'à devenir inutilisable. Des
            colonnes de largeur déclarée ne peuvent pas se voler la place, et
            `min-w-0` empêche un mot long de pousser la sienne. */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              La boutique en ligne des commerçants d&apos;Afrique de l&apos;Ouest, pensée pour
              WhatsApp.
            </p>

            {/* Seuls les comptes réellement ouverts sont rendus : une icône qui
                mène à une page inexistante fait plus de mal qu'une icône
                absente. Voir src/lib/site-links.ts pour en activer d'autres. */}
            <ul className="flex items-center gap-2">
              {SOCIAL_LINKS.filter((lien) => lien.href).map((lien) => {
                const Icone = ICONES[lien.id];
                return (
                  <li key={lien.id}>
                    <a
                      href={lien.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={lien.label}
                      className="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      <Icone className="size-4" />
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium">Moyens de paiement acceptés</p>
              {/* En toutes lettres plutôt qu'en logos de cartes : Watshop
                  n'accepte ni Visa ni Mastercard, et en afficher les logos
                  serait faux. */}
              <ul className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((moyen) => (
                  <li
                    key={moyen.label}
                    className={cn(
                      "rounded border px-2 py-0.5 text-[0.7rem]",
                      moyen.aVenir ? "text-muted-foreground/60" : "text-muted-foreground",
                    )}
                  >
                    {moyen.label}
                    {moyen.aVenir ? " (bientôt)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trois colonnes tiennent mal côte à côte sur 360 px : elles passent
              à la ligne plutôt que de se serrer. */}
          <div className="flex min-w-0 flex-wrap gap-8 sm:gap-10 lg:col-span-5">
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

          <div className="flex min-w-0 flex-col gap-2 sm:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium">Rester au courant</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          {/* Les pays sont lus dans COUNTRIES, la même liste que le sélecteur
              des formulaires : la page ne peut pas annoncer un pays où l'on ne
              saurait pas valider un numéro de téléphone. */}
          <p>
            Watshop — {PAYS_SERVIS}. Aucune commission sur vos ventes.
          </p>

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
