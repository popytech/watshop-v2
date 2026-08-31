import Image from "next/image";
import { BadgeCheck, MapPin, Package, Store, Truck } from "lucide-react";

import { COUNTRIES } from "@/lib/phone";
import { formatNumber } from "@/lib/format";
import type { PublicShop } from "@/lib/shop/public";

/**
 * Bandeau d'ouverture de la boutique d'un vendeur.
 *
 * La page s'ouvrait sur un titre et deux lignes de texte : le visiteur arrivant
 * d'un lien WhatsApp ne voyait rien qui lui dise chez qui il était tombé, ni
 * pourquoi il devrait rester.
 *
 * Toutes les couleurs passent par `--primary`, que le layout de la boutique a
 * déjà remplacé par celle choisie par le vendeur. Le bandeau prend donc ses
 * teintes sans qu'aucun style en ligne ne soit calculé ici — et une boutique
 * change d'allure en changeant sa couleur, pas son code.
 *
 * Aucun bouton de contact : joindre le vendeur passe par une commande, sinon la
 * vente se conclut hors de Watshop et personne n'en garde la trace.
 */
export function ShopHero({
  shop,
  produits,
  zones,
  photoDeSecours,
}: {
  shop: PublicShop;
  produits: number;
  zones: number;
  /**
   * Première photo du catalogue, utilisée faute de bannière. Un vendeur qui
   * vient d'ouvrir a déjà des produits en photo bien avant d'avoir pensé à
   * soigner sa devanture.
   */
  photoDeSecours?: string | null;
}) {
  const fond = shop.cover_url ?? photoDeSecours ?? null;
  const pays = COUNTRIES.find((p) => p.code === shop.country_code)?.name;

  const depuis = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    new Date(shop.created_at),
  );

  const faits = [
    {
      icone: Package,
      texte:
        produits > 0
          ? `${formatNumber(produits)} produit${produits > 1 ? "s" : ""}`
          : "Bientôt en ligne",
    },
    zones > 0
      ? {
          icone: Truck,
          texte: `Livraison dans ${formatNumber(zones)} zone${zones > 1 ? "s" : ""}`,
        }
      : null,
    pays ? { icone: MapPin, texte: pays } : null,
    { icone: Store, texte: `Sur Watshop depuis ${depuis}` },
  ].filter(Boolean) as { icone: typeof Package; texte: string }[];

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-primary/5">
      {fond ? (
        <>
          {/* La photo occupe tout le bandeau ; un voile la recouvre pour que le
              texte reste lisible quelle que soit l'image envoyée — on ne
              contrôle ni son cadrage ni sa luminosité. Le dégradé part du bas,
              là où sont les repères en petits caractères. */}
          <Image
            src={fond}
            alt=""
            fill
            sizes="(min-width: 768px) 896px, 100vw"
            priority
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-background via-background/90 to-background/60"
          />
        </>
      ) : (
        // Sans photo : le halo décoratif seul, tiré de la couleur du vendeur.
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primary/10 blur-3xl"
        />
      )}

      <div className="relative flex flex-col gap-4 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background sm:size-20">
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt=""
                fill
                sizes="80px"
                priority
                className="object-cover"
              />
            ) : (
              <Store className="size-7 text-primary" />
            )}
          </span>

          <div className="flex min-w-0 flex-col gap-1 pt-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              <span className="min-w-0 truncate">{shop.name}</span>
              {shop.is_verified ? (
                <BadgeCheck
                  className="size-5 shrink-0 text-primary"
                  aria-label="Boutique vérifiée par Watshop"
                />
              ) : null}
            </h1>
            {shop.category ? (
              <p className="text-sm font-medium text-primary">{shop.category}</p>
            ) : null}
          </div>
        </div>

        {shop.description ? (
          <p className="max-w-prose text-pretty text-sm text-muted-foreground sm:text-base">
            {shop.description}
          </p>
        ) : null}

        <ul className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
          {faits.map((fait) => (
            <li
              key={fait.texte}
              className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm"
            >
              <fait.icone className="size-4 shrink-0" />
              {fait.texte}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
