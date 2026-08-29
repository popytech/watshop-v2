import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Beam } from "@/components/landing/beam";
import { Section, SectionHeader } from "@/components/landing/section";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { formatMoney } from "@/lib/format";

// Boutiques et montants fournis par Watshop, pas calculés depuis la base : d'où
// le libellé « chiffre d'affaires » et non « ventes réalisées sur Watshop »,
// qui serait une affirmation que l'application ne peut pas justifier.
const BOUTIQUES = [
  { nom: "Gnakry Shop", univers: "Prêt-à-porter", emoji: "👕", ventes: 3_200_000 },
  { nom: "Binta Shop", univers: "Beauté & cosmétiques", emoji: "💄", ventes: 2_000_000 },
  { nom: "Fatima Fashion", univers: "Mode femme", emoji: "👗", ventes: 1_500_000 },
  { nom: "Boutique ABK & Frère", univers: "Électronique", emoji: "📱", ventes: 450_000 },
  { nom: "Mister Popy", univers: "Accessoires", emoji: "🕶️", ventes: 250_000 },
];

function Carte({ boutique }: { boutique: (typeof BOUTIQUES)[number] }) {
  return (
    <div className="glass-4 flex w-72 shrink-0 items-center gap-4 rounded-xl p-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
        {boutique.emoji}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium">{boutique.nom}</p>
        <p className="truncate text-sm text-muted-foreground">{boutique.univers}</p>
        <p className="text-sm font-semibold tabular-nums">{formatMoney(boutique.ventes)}</p>
      </div>
    </div>
  );
}

export function Shops() {
  return (
    <Section className="line-b relative overflow-hidden">
      <Beam tone="brand" className="absolute inset-x-0 top-0 h-64" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12">
        <SectionHeader
          eyebrow="Ils vendent déjà"
          title="Une boutique à l'image de votre business"
          description="Mode, beauté, électronique, artisanat : le même outil, des vitrines qui ne se ressemblent pas."
        />

        {/* Défilement continu par le composant Marquee de Magic UI : il duplique
            le contenu autant de fois que nécessaire pour que la boucle ne se
            voie pas. Le masque fade-x évite que les cartes soient coupées net
            sur les bords, et la pause au survol laisse le temps de lire un nom. */}
        <div className="fade-x w-full">
          <Marquee pauseOnHover className="[--duration:40s]">
            {BOUTIQUES.map((boutique) => (
              <Carte key={boutique.nom} boutique={boutique} />
            ))}
          </Marquee>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
            <Link href="/boutiques">
              Voir toutes les boutiques
              <ArrowRight />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Chiffre d&apos;affaires déclaré par les commerçants.
          </p>
        </div>
      </div>
    </Section>
  );
}
