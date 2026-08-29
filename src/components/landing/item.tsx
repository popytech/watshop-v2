import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// Primitives d'énumération de Launch UI (MIT) : une icône, un titre court, une
// description étroite. La largeur limitée de la description n'est pas un
// oubli — elle force des lignes brèves, ce qui rend la grille lisible en
// diagonale.
export function Item({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4 p-4 text-foreground", className)} {...props} />;
}

export function ItemIcon({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-center self-start", className)} {...props} />;
}

export function ItemTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-sm leading-none font-semibold tracking-tight sm:text-base", className)}
      {...props}
    />
  );
}

export function ItemDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex max-w-60 flex-col gap-2 text-sm text-balance text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
