import { BarChart3, Share2, ShoppingBag, Store } from "lucide-react";

import { Section, SectionHeader } from "@/components/landing/section";
import { Item, ItemDescription, ItemIcon, ItemTitle } from "@/components/landing/item";

const ETAPES = [
  {
    icon: Store,
    titre: "Créez",
    texte:
      "Nom, logo, couleur, premiers produits, numéro WhatsApp. Six étapes, et vous pouvez fermer l'onglet : on vous ramène où vous vous êtes arrêté.",
  },
  {
    icon: Share2,
    titre: "Partagez",
    texte:
      "Un lien court à votre nom, à coller dans vos statuts et votre bio. Chaque produit a aussi le sien.",
  },
  {
    icon: ShoppingBag,
    titre: "Vendez",
    texte:
      "Le client commande depuis son téléphone. Vous recevez tout sur WhatsApp : articles, total, adresse et numéro.",
  },
  {
    icon: BarChart3,
    titre: "Gérez",
    texte:
      "Vos chiffres du jour en haut, vos commandes en dessous. Confiez une course à un livreur en deux clics.",
  },
];

export function Steps() {
  return (
    <Section className="line-b">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 sm:gap-16">
        <SectionHeader
          eyebrow="Comment ça marche"
          title="Quatre étapes, et vous vendez"
          description="Pas de site à construire, pas de développeur à payer, pas de commission sur vos ventes."
        />

        {/* Grille séparée par des lignes plutôt que par des cartes : c'est ce
            qui donne à Launch UI son côté posé, sans empiler des boîtes. */}
        <ol className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map((etape, index) => (
            <li
              key={etape.titre}
              className="line-y line-dashed sm:[&:nth-child(odd)]:border-l-0 lg:[&:not(:first-child)]:border-l lg:[&:nth-child(odd)]:border-l"
            >
              <Item className="gap-4 p-6">
                <ItemIcon className="text-brand dark:text-brand-foreground">
                  <etape.icon className="size-6" />
                </ItemIcon>
                <ItemTitle className="flex items-baseline gap-2">
                  {etape.titre}
                  <span className="text-xs font-normal text-muted-foreground tabular-nums">
                    0{index + 1}
                  </span>
                </ItemTitle>
                <ItemDescription>{etape.texte}</ItemDescription>
              </Item>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
