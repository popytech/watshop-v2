import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const LIENS = [
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#boutiques", label: "Boutiques" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#questions", label: "Questions" },
];

export function LandingNav({ connecte }: { connecte: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />

        {/* Masquée sur téléphone : quatre liens de plus y encombreraient sans
            rien apporter, la page se parcourt au pouce. */}
        <nav className="hidden items-center gap-1 md:flex">
          {LIENS.map((lien) => (
            <Button key={lien.href} asChild variant="ghost" size="sm">
              <a href={lien.href}>{lien.label}</a>
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
        </div>
      </div>
    </header>
  );
}
