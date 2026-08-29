import { BarChart3, Share2, ShoppingBag, Store } from "lucide-react";

import { Section, SectionHeader } from "@/components/landing/section";

const ETAPES = [
  {
    icon: Store,
    titre: "Créez",
    resume: "Votre boutique en quelques minutes.",
    detail:
      "Nom, logo, couleur, premiers produits, numéro WhatsApp. Six étapes, et vous pouvez fermer l'onglet à tout moment : on vous ramène où vous vous êtes arrêté.",
  },
  {
    icon: Share2,
    titre: "Partagez",
    resume: "WhatsApp, Facebook, Instagram, TikTok.",
    detail:
      "Un lien court à votre nom, à coller dans vos statuts et votre bio. Chaque produit a aussi le sien.",
  },
  {
    icon: ShoppingBag,
    titre: "Vendez",
    resume: "Commandes, livraison, paiement.",
    detail:
      "Le client commande depuis son téléphone, vous recevez tout sur WhatsApp : les articles, le total, son adresse et son numéro.",
  },
  {
    icon: BarChart3,
    titre: "Gérez",
    resume: "Produits, stock, livreurs, statistiques.",
    detail:
      "Vos chiffres du jour en haut de l'écran, vos commandes en dessous. Confiez une course à un livreur en deux clics.",
  },
];

export function Steps() {
  return (
    <Section className="border-t bg-muted/30">
      <SectionHeader
        eyebrow="Comment ça marche"
        title="Quatre étapes, et vous vendez"
        description="Pas de site à construire, pas de développeur à payer, pas de commission sur vos ventes."
      />

      <ol className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2">
        {ETAPES.map((etape, index) => (
          <li
            key={etape.titre}
            className="flex flex-col gap-3 rounded-xl border bg-card p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand dark:text-brand-foreground">
                <etape.icon className="size-5" />
              </span>
              <span className="text-sm font-medium text-muted-foreground tabular-nums">
                0{index + 1}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold">{etape.titre}</h3>
              <p className="font-medium">{etape.resume}</p>
            </div>

            <p className="text-sm text-muted-foreground">{etape.detail}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
