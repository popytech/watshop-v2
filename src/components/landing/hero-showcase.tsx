import Image from "next/image";
import { Eye, MessageCircle, ShoppingCart, Wallet } from "lucide-react";

import { BrowserScreen, PhoneScreen } from "@/components/landing/device";
import { formatMoney, formatMoneyCompact } from "@/lib/format";

/**
 * Les deux écrans de Watshop, côte à côte : le tableau de bord du vendeur dans
 * son navigateur, sa boutique sur le téléphone du client.
 *
 * Les cadres sont les composants `Iphone` et `Safari` de Magic UI (MIT),
 * installés depuis leur registre et laissés intacts : dessin exact de
 * l'appareil, en SVG, qui reste net à toutes les tailles. Ce qui s'affiche dans
 * l'écran, en revanche, est notre propre interface en HTML, pas une capture.
 *
 * Sur téléphone, seul le mobile est affiché : superposer deux appareils sur
 * 360 px de large ne donne à lire ni l'un ni l'autre.
 */

const CHIFFRES = [
  { label: "Commandes", valeur: "12", icone: ShoppingCart },
  { label: "Ventes", valeur: formatMoneyCompact(4_850_000), icone: Wallet },
  { label: "Visiteurs", valeur: "327", icone: Eye },
  { label: "WhatsApp", valeur: "8", icone: MessageCircle },
];

// La première commande porte l'article affiché sur le téléphone, au même prix :
// les deux écrans racontent alors la même vente, vue du vendeur et du client.
const COMMANDES = [
  { ref: "#WA-00821", produit: "Pagne wax imprimé", montant: 280_000, etat: "Nouveau" },
  { ref: "#WS-00819", produit: "Sac raphia", montant: 180_000, etat: "Confirmée" },
];

function TableauDeBord() {
  return (
    <div className="flex size-full flex-col gap-[3.5%] bg-background p-[3.5%] text-left">
      <div>
        <p className="text-[2.6cqw] font-semibold">Bonjour Fatima</p>
        <p className="text-[2cqw] text-muted-foreground">Aujourd&apos;hui</p>
      </div>

      <div className="grid grid-cols-4 gap-[1.5%]">
        {CHIFFRES.map((chiffre) => (
          <div key={chiffre.label} className="rounded-lg border bg-card p-[4%]">
            <p className="flex items-center gap-1 text-[1.8cqw] text-muted-foreground">
              <chiffre.icone className="size-[2cqw]" />
              {chiffre.label}
            </p>
            <p className="pt-0.5 text-[2.8cqw] font-semibold tabular-nums">{chiffre.valeur}</p>
          </div>
        ))}
      </div>

      <span className="flex h-[7%] w-fit items-center rounded-lg bg-primary px-[2%] text-[2cqw] font-medium text-primary-foreground">
        + Ajouter un produit
      </span>

      <div className="flex min-h-0 flex-col gap-[1.5%]">
        <p className="text-[2.1cqw] font-medium">Commandes récentes</p>

        {COMMANDES.map((commande) => (
          <div
            key={commande.ref}
            className="flex items-center justify-between rounded-lg border bg-card px-[2%] py-[1.5%]"
          >
            <div>
              <p className="font-mono text-[1.7cqw] text-muted-foreground">{commande.ref}</p>
              <p className="text-[2.1cqw] font-medium">{commande.produit}</p>
              <p className="text-[1.9cqw] text-muted-foreground tabular-nums">
                {formatMoney(commande.montant)}
              </p>
            </div>
            <span className="rounded-md bg-brand/10 px-[1.5%] py-[0.5%] text-[1.7cqw] font-medium text-brand dark:text-brand-foreground">
              {commande.etat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Boutique() {
  return (
    <div className="flex size-full flex-col bg-background text-left">
      {/* Marge haute : laisse passer l'île dynamique dessinée par le cadre. */}
      <div className="flex items-center gap-[3%] border-b px-[6%] pt-[11%] pb-[4%]">
        <span className="flex size-[10cqw] items-center justify-center rounded-lg bg-brand text-[5cqw] font-bold text-white">
          F
        </span>
        <div className="min-w-0">
          <p className="truncate text-[4.6cqw] font-semibold">Fatima Fashion</p>
          <p className="text-[3.2cqw] text-muted-foreground">Mode femme · Conakry</p>
        </div>
      </div>

      <div className="flex flex-col gap-[3.5%] p-[5%]">
        {/* Une vraie photo, et non plus un emoji : c'est la vitrine d'un
            commerçant qu'on montre, pas un pictogramme. Fichier local plutôt
            qu'un produit tiré de la base — le hero est le premier écran, il ne
            doit attendre aucune requête. */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Image
            src="/apercu-produit.jpg"
            alt="Pagne wax imprimé"
            fill
            sizes="240px"
            className="object-cover"
          />
          <span className="absolute top-[4%] left-[4%] rounded-md bg-primary px-[4%] py-[1.5%] text-[3.2cqw] font-medium text-primary-foreground">
            Promo
          </span>
        </div>

        <div>
          <p className="text-[4.6cqw] font-medium">Pagne wax imprimé</p>
          <p className="flex items-baseline gap-[2%]">
            <span className="text-[6.4cqw] font-semibold">{formatMoney(280_000)}</span>
            <span className="text-[3.6cqw] text-muted-foreground line-through">
              {formatMoney(350_000)}
            </span>
          </p>
          <p className="text-[3.4cqw] text-muted-foreground">12 disponibles</p>
        </div>

        {/* Les tailles, comme sur la vraie fiche produit. */}
        <div className="flex gap-[2%]">
          {["S", "M", "L", "XL"].map((taille) => (
            <span
              key={taille}
              className="rounded border px-[3%] py-[1%] text-[3.2cqw] text-muted-foreground"
            >
              {taille}
            </span>
          ))}
        </div>

        <span className="flex h-[7.5%] items-center justify-center rounded-lg bg-primary text-[3.9cqw] font-medium text-primary-foreground">
          Commander sur WhatsApp
        </span>
        <span className="flex h-[7.5%] items-center justify-center rounded-lg border text-[3.9cqw] font-medium">
          Ajouter au panier
        </span>
      </div>
    </div>
  );
}

export function HeroShowcase() {
  return (
    <div className="animate-appear-zoom relative mx-auto w-full max-w-4xl opacity-0 [animation-delay:600ms]">
      {/* Navigateur : masqué sur téléphone, où il ne serait pas lisible.
          `@container` permet aux tailles en cqw de suivre la largeur du cadre,
          qui est fluide : le contenu se réduit avec l'appareil au lieu de
          déborder. */}
      <BrowserScreen url="watshop.africa/dashboard" className="@container hidden md:block">
        <TableauDeBord />
      </BrowserScreen>

      {/* Téléphone : centré seul sur mobile, posé sur le coin de l'écran
          d'ordinateur à partir de md. */}
      <PhoneScreen className="@container mx-auto max-w-56 md:absolute md:-right-4 md:-bottom-12 md:mx-0 md:max-w-none md:w-52 lg:-right-10 lg:w-60">
        <Boutique />
      </PhoneScreen>
    </div>
  );
}
