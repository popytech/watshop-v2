import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Store } from "lucide-react";

import { CartButton } from "@/components/storefront/cart-button";
import { getPublicShop, isShopPro } from "@/lib/shop/public";

type Props = { children: ReactNode; params: Promise<{ slug: string }> };

/**
 * Enveloppe de la boutique publique.
 *
 * La couleur choisie par le vendeur est injectée dans le token --primary : tous
 * les composants ui/ en héritent sans qu'aucun d'eux n'ait à connaître la
 * boutique. C'est ce que le legacy faisait en codant #25d366 en dur des
 * dizaines de fois par page.
 */
export default async function ShopLayout({ children, params }: Props) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);

  if (!shop) notFound();

  // Une des contreparties de l'offre Pro : la boutique ne renvoie plus vers
  // nous en bas de page. Le vendeur qui paie a une vitrine à lui.
  const pro = await isShopPro(shop.user_id);

  return (
    <div
      className="flex flex-1 flex-col"
      style={
        {
          "--primary": shop.primary_color,
          "--ring": shop.primary_color,
        } as CSSProperties
      }
    >
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link href={`/${shop.slug}`} className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {shop.logo_url ? (
                <Image
                  src={shop.logo_url}
                  alt=""
                  width={40}
                  height={40}
                  className="size-full object-cover"
                />
              ) : (
                <Store className="size-4 text-muted-foreground" />
              )}
            </span>
            <span className="truncate font-semibold tracking-tight">{shop.name}</span>
          </Link>

          <CartButton shopSlug={shop.slug} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-5">{children}</main>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-4xl px-4 py-5 text-center text-xs text-muted-foreground">
          {pro ? (
            <span>
              {shop.name} — {new Date().getFullYear()}
            </span>
          ) : (
            <Link href="/" className="hover:underline">
              Boutique propulsée par Watshop
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
