import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageOff, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { Section, SectionHeader } from "@/components/landing/section";
import { formatMoney } from "@/lib/format";
import { effectivePrice } from "@/lib/shop/price";
import { getLandingProducts } from "@/lib/marketplace/queries";
import type { MarketplaceProduct } from "@/lib/marketplace/types";

/**
 * Bandeau des produits en vente, sur la page d'accueil.
 *
 * Contrairement à la section des boutiques, dont les noms et les chiffres nous
 * ont été donnés, celle-ci lit la base : ce sont de vrais produits, de vrais
 * prix, et cliquer mène à la vraie fiche. Rien n'est écrit en dur, donc rien ne
 * peut mentir.
 *
 * En dessous de quatre produits le défilement est remplacé par une simple
 * rangée : une bande qui répète quatre fois le même article se voit, et donne
 * l'impression d'une vitrine vide qu'on essaie de remplir.
 */
export async function Products() {
  const produits = await getLandingProducts(12);

  // Aucun produit en ligne : la section entière disparaît plutôt que d'annoncer
  // une vitrine qui n'existe pas encore.
  if (produits.length === 0) return null;

  const enDefilement = produits.length >= 4;

  return (
    <Section className="line-b overflow-hidden">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12">
        <SectionHeader
          eyebrow="En vente maintenant"
          title="Ce que vendent nos commerçants"
          description="Chaque article mène à la boutique de son vendeur, où la commande part sur son WhatsApp."
        />

        {enDefilement ? (
          <div className="fade-x w-full">
            <Marquee pauseOnHover className="[--duration:50s] [--gap:1.5rem]">
              {produits.map((produit) => (
                <CarteProduit key={produit.id} produit={produit} />
              ))}
            </Marquee>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {produits.map((produit) => (
              <CarteProduit key={produit.id} produit={produit} />
            ))}
          </div>
        )}

        <Button asChild variant="outline" size="lg">
          <Link href="/produits">
            Voir tous les produits
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

/**
 * Carte compacte, à largeur fixe : dans une bande qui défile, des cartes de
 * largeur variable feraient sauter le rythme à chaque boucle.
 *
 * Une seule photo ici, la première. La bande glissante de la fiche produit n'a
 * pas sa place dans une bande qui glisse déjà toute seule.
 */
function CarteProduit({ produit }: { produit: MarketplaceProduct }) {
  const photo = [...(produit.product_images ?? [])].sort((a, b) => a.position - b.position)[0];
  const prix = effectivePrice(produit);
  const enPromo = prix < produit.price;

  return (
    <Link
      href={`/${produit.shops.slug}/produit/${produit.slug}`}
      className="group block w-48 shrink-0 sm:w-56"
    >
      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-secondary">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.alt_text || produit.name}
            fill
            sizes="224px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <ImageOff className="size-5 text-muted-foreground" />
          </span>
        )}
      </div>

      <div className="space-y-1 text-center">
        <p className="line-clamp-1 text-sm font-medium">{produit.name}</p>
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Store className="size-3 shrink-0" />
          <span className="truncate">{produit.shops.name}</span>
        </p>
        <p className="text-sm font-semibold">
          {formatMoney(prix, produit.shops.currency_symbol)}
          {enPromo ? (
            <span className="ml-1.5 font-normal text-muted-foreground line-through">
              {formatMoney(produit.price, produit.shops.currency_symbol)}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
