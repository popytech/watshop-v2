"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, Store } from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/dashboard/produits", label: "Produits", icon: Package },
  { href: "/dashboard/commandes", label: "Commandes", icon: ShoppingCart },
  { href: "/dashboard/boutique", label: "Boutique", icon: Store },
];

/**
 * Barre de navigation du vendeur : en bas de l'écran sur téléphone (là où le
 * pouce arrive), en ligne sous l'en-tête sur écran large.
 */
export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation du tableau de bord"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background sm:static sm:border-t-0 sm:border-b"
    >
      <ul className="mx-auto flex w-full max-w-5xl">
        {LINKS.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="flex-1 sm:flex-none">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-sm",
                  active
                    ? "text-primary sm:border-b-2 sm:border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <link.icon className="size-5 sm:size-4" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
