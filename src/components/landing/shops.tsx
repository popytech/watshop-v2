import { Section, SectionHeader } from "@/components/landing/section";
import { Glow } from "@/components/landing/glow";
import { formatMoney } from "@/lib/format";

// Boutiques et montants fournis par Watshop. Rien n'est calculé depuis la base
// ici : ce sont des références commerciales, pas des statistiques de la
// plateforme — d'où le libellé « chiffre d'affaires » et non « ventes réalisées
// sur Watshop », qui serait une affirmation que l'application ne peut pas
// justifier.
const BOUTIQUES = [
  { nom: "Gnakry Shop", univers: "Prêt-à-porter", emoji: "👕", ventes: 3_200_000 },
  { nom: "Binta Shop", univers: "Beauté & cosmétiques", emoji: "💄", ventes: 2_000_000 },
  { nom: "Fatima Fashion", univers: "Mode femme", emoji: "👗", ventes: 1_500_000 },
  { nom: "Boutique ABK & Frère", univers: "Électronique", emoji: "📱", ventes: 450_000 },
  { nom: "Mister Popy", univers: "Accessoires", emoji: "🕶️", ventes: 250_000 },
];

export function Shops() {
  return (
    <Section className="relative overflow-hidden border-t bg-foreground text-background dark:bg-background dark:text-foreground">
      <Glow variant="center" className="opacity-40" />

      <div className="relative">
        <SectionHeader
          eyebrow="Ils vendent déjà"
          title="Une boutique à l'image de votre business"
          description="Mode, beauté, électronique, artisanat, restauration : le même outil, des vitrines qui ne se ressemblent pas."
          className="[&_p]:text-background/70 dark:[&_p]:text-muted-foreground"
        />

        <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BOUTIQUES.map((boutique) => (
            <li
              key={boutique.nom}
              className="flex items-center gap-4 rounded-xl border border-background/15 bg-background/5 p-4 backdrop-blur dark:border-border dark:bg-card"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-background/10 text-2xl dark:bg-muted">
                {boutique.emoji}
              </span>

              <div className="min-w-0">
                <p className="truncate font-medium">{boutique.nom}</p>
                <p className="truncate text-sm text-background/60 dark:text-muted-foreground">
                  {boutique.univers}
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {formatMoney(boutique.ventes)}
                </p>
              </div>
            </li>
          ))}

          <li className="flex flex-col justify-center gap-1 rounded-xl border border-dashed border-background/25 p-4 text-sm dark:border-border">
            <span className="font-medium">La vôtre, demain</span>
            <span className="text-background/60 dark:text-muted-foreground">
              Gratuit, sans commission sur vos ventes.
            </span>
          </li>
        </ul>
      </div>
    </Section>
  );
}
