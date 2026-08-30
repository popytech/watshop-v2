import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { LandingNavMobile, type LienNav } from "@/components/landing/landing-nav-mobile";
import { ThemeToggle } from "@/components/theme/theme-toggle";

// Le marketplace d'abord, les arguments de vente ensuite : un visiteur qui
// arrive sur watshop.africa vient plus souvent acheter que créer une boutique.
//
// `route` sort de la page d'accueil : un <Link> plutôt qu'une ancre, pour que
// la navigation reste côté client et la page soit préchargée au survol.
const LIENS: LienNav[] = [
  { href: "/produits", label: "Produits", route: true },
  { href: "/boutiques", label: "Boutiques", route: true },
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#questions", label: "Questions" },
];

export function LandingNav({ connecte }: { connecte: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />

        {/* Sur téléphone ces liens passent dans le panneau du menu : les masquer
            sans rien mettre à la place rendait le marketplace introuvable là où
            sont justement nos visiteurs. */}
        <nav className="hidden items-center gap-1 md:flex">
          {LIENS.map((lien) => (
            <Button key={lien.href} asChild variant="ghost" size="sm">
              {lien.route ? (
                <Link href={lien.href}>{lien.label}</Link>
              ) : (
                <a href={lien.href}>{lien.label}</a>
              )}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {connecte ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Mon espace</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Connexion</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Créer ma boutique</Link>
              </Button>
            </>
          )}

          <LandingNavMobile liens={LIENS} connecte={connecte} />
        </div>
      </div>
    </header>
  );
}
