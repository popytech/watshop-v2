import Link from "next/link";
import { Crown, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SharePanel } from "@/components/shop/share-panel";
import { ShopSettingsForm } from "@/components/shop/shop-settings-form";
import { requirePublishedShop } from "@/lib/shop/queries";
import { getSiteUrl } from "@/lib/site-url";
import { shopPath } from "@/lib/tenant";

export const metadata = { title: "Ma boutique — Watshop" };

export default async function ShopSettingsPage() {
  const shop = await requirePublishedShop();
  const siteUrl = await getSiteUrl();
  const shopUrl = `${siteUrl}${shopPath(shop.slug)}`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ma boutique</h1>
        <p className="text-sm text-muted-foreground">{shop.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partager ma boutique</CardTitle>
          <CardDescription>
            Le lien à envoyer à vos clients, dans vos statuts et sur vos réseaux.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SharePanel shopName={shop.name} url={shopUrl} />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="outline" size="lg" className="h-auto justify-start py-3">
          <Link href="/dashboard/livraison">
            <Truck />
            <span className="flex flex-col items-start">
              <span className="font-medium">Livraison</span>
              <span className="text-xs text-muted-foreground">Zones et livreurs</span>
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-auto justify-start py-3">
          <Link href="/dashboard/abonnement">
            <Crown />
            <span className="flex flex-col items-start">
              <span className="font-medium">Abonnement</span>
              <span className="text-xs text-muted-foreground">Formule et paiements</span>
            </span>
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <ShopSettingsForm
            siteUrl={siteUrl}
            defaultValues={{
              name: shop.name,
              slug: shop.slug,
              category: shop.category ?? "",
              description: shop.description ?? "",
              countryCode: shop.country_code,
              primaryColor: shop.primary_color,
              phone: shop.whatsapp_number ?? "",
              mobileMoney: shop.mobile_money_number ?? "",
              logoUrl: shop.logo_url,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
