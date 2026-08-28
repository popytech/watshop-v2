import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CartCheckout } from "@/components/storefront/cart-checkout";
import { getDeliveryZones, getPublicShop } from "@/lib/shop/public";
import { shopPath } from "@/lib/tenant";

export const metadata = { title: "Panier — Watshop", robots: { index: false } };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string }>;
};

export default async function CartPage({ params, searchParams }: Props) {
  const [{ slug }, { source }] = await Promise.all([params, searchParams]);
  const shop = await getPublicShop(slug);

  if (!shop) notFound();

  const zones = await getDeliveryZones(shop.id);

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href={shopPath(shop.slug)}>
          <ArrowLeft />
          Continuer mes achats
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">Votre commande</h1>

      <CartCheckout
        shopSlug={shop.slug}
        shopName={shop.name}
        currency={shop.currency_symbol}
        countryCode={shop.country_code}
        zones={zones.map((zone) => ({
          id: zone.id,
          zone_name: zone.zone_name,
          price: zone.price,
          free_above: zone.free_above,
        }))}
        // D'où vient l'acheteur : le bouton « Commander sur WhatsApp » d'une
        // fiche produit, ou le panier classique. C'est ce qui alimente les deux
        // compteurs distincts du tableau de bord vendeur.
        source={source === "whatsapp" ? "whatsapp" : "storefront"}
      />
    </div>
  );
}
