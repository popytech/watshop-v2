"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import { FavorisLien } from "@/components/marketplace/favoris-lien";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

// Les produits d'abord : on vient chercher un article, pas un commerçant. Les
// boutiques sont la façon d'explorer ensuite, pas l'entrée.
const ONGLETS = [
  { href: "/produits", label: "Produits" },
  { href: "/boutiques", label: "Boutiques" },
];

/**
 * En-tête du marketplace.
 *
 * Distinct de `AppHeader`, qui suppose un profil connecté : ici l'acheteur
 * n'a pas de compte et n'a aucune raison d'en créer un pour regarder.
 */
export function MarketplaceHeader({ connecte }: { connecte: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />

        <nav className="flex items-center gap-1">
          {ONGLETS.map((onglet) => {
            const actif = pathname === onglet.href;

            return (
              <Button
                key={onglet.href}
                asChild
                variant={actif ? "secondary" : "ghost"}
                size="sm"
                className={cn(actif && "font-semibold")}
              >
                <Link href={onglet.href} aria-current={actif ? "page" : undefined}>
                  {onglet.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* La recherche vit dans l'en-tête, comme sur la vitrine de Your Next
            Store : elle suit d'une page à l'autre au lieu d'être enfermée dans
            le catalogue. Un formulaire GET, donc opérant sans JavaScript.
            Masquée sur téléphone faute de place — elle y reste accessible dans
            le panneau des filtres. */}
        <form action="/produits" method="get" className="relative hidden flex-1 md:block md:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            placeholder="Rechercher un produit…"
            className="h-9 pl-9"
            aria-label="Rechercher un produit"
          />
        </form>

        <div className="flex items-center gap-2">
          <FavorisLien />
          <ThemeToggle />
          {connecte ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Mon espace</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/register">Créer ma boutique</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
