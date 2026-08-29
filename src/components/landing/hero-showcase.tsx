import { Eye, MessageCircle, ShoppingCart, Wallet } from "lucide-react";

import { Mockup, MockupFrame } from "@/components/landing/mockup";
import { formatMoney, formatMoneyCompact } from "@/lib/format";

/**
 * Les deux écrans de Watshop, côte à côte : le tableau de bord du vendeur sur
 * ordinateur, sa boutique sur le téléphone du client.
 *
 * Tout est en HTML, y compris les cadres. Une capture d'écran aurait pesé
 * plusieurs centaines de kilos, flouté sur les écrans denses, et montré une
 * interface périmée dès la prochaine modification du tableau de bord.
 *
 * Sur téléphone, seul le mockup mobile est affiché : superposer deux écrans sur
 * 360 px de large ne donne à lire ni l'un ni l'autre.
 */

const CHIFFRES = [
  { label: "Commandes", valeur: "12", icone: ShoppingCart },
  { label: "Ventes", valeur: formatMoneyCompact(4_850_000), icone: Wallet },
  { label: "Visiteurs", valeur: "327", icone: Eye },
  { label: "WhatsApp", valeur: "8", icone: MessageCircle },
];

function BarreNavigateur({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
      <span className="flex gap-1.5">
        <span className="size-2.5 rounded-full bg-destructive/40" />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <span className="size-2.5 rounded-full bg-brand/50" />
      </span>
      <span className="mx-auto rounded-md bg-background px-3 py-0.5 text-[0.65rem] text-muted-foreground">
        {url}
      </span>
    </div>
  );
}

function TableauDeBord() {
  return (
    <div className="flex w-full flex-col bg-background text-left">
      <BarreNavigateur url="watshop.africa/dashboard" />

      <div className="flex flex-col gap-4 p-5">
        <div>
          <p className="text-sm font-semibold">Bonjour Fatima</p>
          <p className="text-[0.7rem] text-muted-foreground">Aujourd&apos;hui</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {CHIFFRES.map((chiffre) => (
            <div key={chiffre.label} className="rounded-lg border bg-card p-2.5">
              <p className="flex items-center gap-1 text-[0.6rem] text-muted-foreground">
                <chiffre.icone className="size-3" />
                {chiffre.label}
              </p>
              <p className="pt-0.5 text-sm font-semibold tabular-nums">{chiffre.valeur}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-7 items-center rounded-lg bg-primary px-3 text-[0.7rem] font-medium text-primary-foreground">
            + Ajouter un produit
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[0.7rem] font-medium">Commandes récentes</p>

          {[
            { ref: "#WA-00821", produit: "Robe wax", montant: 350_000, etat: "Nouveau" },
            { ref: "#WS-00819", produit: "Sac raphia", montant: 180_000, etat: "Confirmée" },
          ].map((commande) => (
            <div
              key={commande.ref}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
            >
              <div>
                <p className="font-mono text-[0.6rem] text-muted-foreground">{commande.ref}</p>
                <p className="text-[0.7rem] font-medium">{commande.produit}</p>
                <p className="text-[0.65rem] text-muted-foreground tabular-nums">
                  {formatMoney(commande.montant)}
                </p>
              </div>
              <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[0.6rem] font-medium text-brand dark:text-brand-foreground">
                {commande.etat}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Boutique() {
  return (
    <div className="flex w-full flex-col bg-background text-left">
      {/* Encoche : deux pixels de détail qui suffisent à faire lire « téléphone »
          plutôt que « rectangle arrondi ». */}
      <div className="flex justify-center pt-2.5 pb-1">
        <span className="h-1.5 w-16 rounded-full bg-foreground/15" />
      </div>

      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className="size-7 rounded-lg bg-brand" />
        <span className="text-xs font-semibold">Fatima Fashion</span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex aspect-square items-center justify-center rounded-xl bg-linear-to-br from-brand/15 to-brand/5">
          <span className="text-6xl">👗</span>
        </div>

        <div>
          <p className="text-sm font-medium">Robe wax</p>
          <p className="text-lg font-semibold">{formatMoney(350_000)}</p>
          <p className="text-[0.7rem] text-muted-foreground">12 disponibles</p>
        </div>

        <span className="flex h-10 items-center justify-center rounded-lg bg-primary text-xs font-medium text-primary-foreground">
          Commander sur WhatsApp
        </span>
        <span className="flex h-10 items-center justify-center rounded-lg border text-xs font-medium">
          Ajouter au panier
        </span>
      </div>
    </div>
  );
}

export function HeroShowcase() {
  return (
    <div className="animate-appear-zoom relative mx-auto w-full max-w-4xl opacity-0 [animation-delay:600ms]">
      {/* Ordinateur : masqué sur téléphone, où il ne serait pas lisible. */}
      <MockupFrame size="large" className="hidden w-full md:flex">
        <Mockup type="responsive" className="w-full">
          <TableauDeBord />
        </Mockup>
      </MockupFrame>

      {/* Téléphone : centré seul sur mobile, posé sur le coin de l'écran
          d'ordinateur à partir de md. */}
      <MockupFrame
        size="small"
        className="mx-auto md:absolute md:-right-4 md:-bottom-10 md:mx-0 md:w-64 lg:-right-10 lg:w-72"
      >
        <Mockup type="mobile" className="w-full">
          <Boutique />
        </Mockup>
      </MockupFrame>
    </div>
  );
}
