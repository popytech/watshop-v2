"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Bascule clair/sombre.
 *
 * Le thème n'est connu qu'après hydratation : plutôt que de masquer le bouton
 * (ce qui décale la mise en page), les deux icônes sont superposées et c'est le
 * CSS qui montre la bonne. Aucun état React à synchroniser, donc aucun
 * clignotement.
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Changer de thème"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}
