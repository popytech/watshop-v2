import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { formatNumber } from "@/lib/format";

/**
 * Bannière d'ouverture du marketplace, dans la composition de Your Next Store :
 * un bloc large aux coins arrondis, le texte calé à gauche sur un fond clair, la
 * photo à droite, et un bouton sombre en pastille.
 *
 * Le dégradé qui part du fond de la bannière et se fond dans la photo remplace
 * le voile sombre qu'on met d'ordinaire sous un texte : la photo étant sur fond
 * blanc, le raccord ne se voit pas, et le titre reste lisible sans assombrir
 * l'image.
 *
 * Les deux chiffres sont comptés en base. Rien n'est écrit en dur : le jour où
 * une boutique ferme, la bannière le dit.
 */
export function MarketplaceHero({
  produits,
  boutiques,
}: {
  produits: number;
  boutiques: number;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-2xl bg-secondary">
        {/* La photo occupe tout le bloc et se retire vers la droite à partir de
            sm, quand il y a la place de lire un titre à côté. */}
        <div className="absolute inset-0">
          <Image
            src="/banniere-marketplace.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-linear-to-r from-secondary via-secondary/90 to-secondary/20 sm:to-transparent" />
        </div>

        <div className="relative flex max-w-lg flex-col items-start gap-4 px-6 py-14 sm:px-10 sm:py-20 lg:py-24">
          <h1 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Tout le marché, sur votre téléphone.
          </h1>

          <p className="text-pretty text-muted-foreground sm:text-lg">
            {produits > 0 ? (
              <>
                {formatNumber(produits)} article{produits > 1 ? "s" : ""} chez{" "}
                {formatNumber(boutiques)} commerçant{boutiques > 1 ? "s" : ""}. La commande part sur
                le WhatsApp du vendeur, sans compte à créer.
              </>
            ) : (
              <>
                Les premières boutiques arrivent. La commande part sur le WhatsApp du vendeur, sans
                compte à créer.
              </>
            )}
          </p>

          {/* Pastille sombre, comme leur « Try it today ». Un lien plutôt qu'un
              bouton : c'est une navigation, pas une action. */}
          <Link
            href="/boutiques"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Voir les boutiques
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
