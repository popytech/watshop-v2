import { cn } from "@/lib/utils";

/**
 * Lignes verticales de structure, fixées derrière toute la page.
 *
 * C'est le détail qui distingue une landing soignée d'une suite de blocs : deux
 * traits pointillés qui marquent la largeur du contenu et donnent un repère à
 * l'œil pendant le défilement. Purement décoratif, donc non lu par les
 * lecteurs d'écran.
 */
export function LayoutLines({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 z-0", className)}>
      <div className="mx-auto h-full max-w-6xl line-y line-dashed" />
    </div>
  );
}
