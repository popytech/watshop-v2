import { Section, SectionHeader } from "@/components/landing/section";
import { Beam } from "@/components/landing/beam";
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
    <li className="glass-4 flex w-72 shrink-0 items-center gap-4 rounded-xl p-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
        {boutique.emoji}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium">{boutique.nom}</p>
        <p className="truncate text-sm text-muted-foreground">{boutique.univers}</p>
        <p className="text-sm font-semibold tabular-nums">{formatMoney(boutique.ventes)}</p>
      </div>
    </li>
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

        {/* Défilement continu : la liste est dupliquée et l'animation translate
            de la moitié, donc la boucle ne se voit pas. Le masque fade-x évite
            que les cartes soient coupées net sur les bords, et le survol met en
            pause pour qu'on puisse lire un nom. */}
        <div className="fade-x w-full overflow-hidden">
          <ul className="marquee-track flex w-max gap-4 hover:[animation-play-state:paused]">
            {[...BOUTIQUES, ...BOUTIQUES].map((boutique, index) => (
              <Carte key={`${boutique.nom}-${index}`} boutique={boutique} />
            ))}
          </ul>
        </div>

        <p className="text-sm text-muted-foreground">
          Chiffre d&apos;affaires déclaré par les commerçants.
        </p>
      </div>
    </Section>
  );
}
