"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";

export type LienNav = {
  href: string;
  label: string;
  /** Vrai pour une vraie page, faux pour une ancre de la page d'accueil. */
  route?: boolean;
};

/**
 * Menu de navigation sur téléphone, repris du navbar de Launch UI (MIT).
 *
 * Il était absent : les liens de l'en-tête étaient simplement masqués sous
 * `md`, ce qui passait tant qu'il n'y avait que des ancres de la page — mais
 * rendait le marketplace introuvable depuis un téléphone, alors que c'est là
 * que sont nos visiteurs.
 *
 * `SheetClose` enveloppe chaque lien : sans lui, cliquer une ancre ferait
 * défiler la page derrière un panneau resté ouvert, puisqu'on ne change pas de
 * page.
 */
export function LandingNavMobile({
  liens,
  connecte,
}: {
  liens: LienNav[];
  connecte: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[min(18rem,85vw)]">
        <SheetTitle className="sr-only">Menu</SheetTitle>

        <nav className="flex flex-col gap-6 px-4 pt-4">
          <SheetClose asChild>
            <Logo />
          </SheetClose>

          <div className="flex flex-col gap-4">
            {liens.map((lien) => (
              <SheetClose asChild key={lien.href}>
                {lien.route ? (
                  <Link
                    href={lien.href}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground"
                  >
                    {lien.label}
                  </Link>
                ) : (
                  <a
                    href={lien.href}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground"
                  >
                    {lien.label}
                  </a>
                )}
              </SheetClose>
            ))}
          </div>

          {/* La connexion est masquée dans l'en-tête sous `sm` faute de place :
              c'est ici qu'elle doit rester atteignable. */}
          {connecte ? null : (
            <SheetClose asChild>
              <Link
                href="/login"
                className="text-lg font-medium text-muted-foreground hover:text-foreground"
              >
                Connexion
              </Link>
            </SheetClose>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
