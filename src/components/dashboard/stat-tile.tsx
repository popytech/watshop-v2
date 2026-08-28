import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Une tuile de chiffre du jour. Volontairement dépouillée : le vendeur doit
 * lire les quatre chiffres d'un coup d'œil sur un téléphone, sans graphique.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span className="text-xl font-semibold tabular-nums sm:text-2xl">{value}</span>
      </CardContent>
    </Card>
  );
}
