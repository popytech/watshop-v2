import Image from "next/image";
import { ImageOff, MousePointerClick, ShoppingCart, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CopyLinkButton } from "@/components/network/copy-link-button";
import { requireRole } from "@/lib/dal";
import { getResellableProducts, getResellerEarnings } from "@/lib/network/queries";
import { getSiteUrl } from "@/lib/site-url";
import { formatMoney, formatNumber } from "@/lib/format";

export const metadata = { title: "Espace revendeur — Watshop" };

export default async function RevendeurPage() {
  const profile = await requireRole("reseller", "admin");
  const [products, earnings, siteUrl] = await Promise.all([
    getResellableProducts(),
    getResellerEarnings(profile.id),
    getSiteUrl(),
  ]);

  const code = profile.affiliate_code ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {profile.name?.split(" ")[0] ?? "👋"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre code revendeur : <span className="font-mono font-medium">{code}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Clics" value={formatNumber(earnings.clicks)} icon={MousePointerClick} />
        <StatTile label="Ventes" value={formatNumber(earnings.sales)} icon={ShoppingCart} />
        <StatTile label="En attente" value={formatMoney(earnings.pending)} icon={Wallet} />
        <StatTile label="Déjà versé" value={formatMoney(earnings.paid)} icon={Wallet} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comment ça marche</CardTitle>
          <CardDescription>
            Copiez le lien d&apos;un produit ci-dessous : il contient votre code. Toute commande
            passée depuis ce lien vous rapporte le pourcentage indiqué. La commission est
            confirmée quand le vendeur marque la commande livrée.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Produits à revendre</h2>

        {products.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {products.map((product) => {
              const prix =
                product.promo_price !== null && product.promo_price < product.price
                  ? product.promo_price
                  : product.price;
              const devise = product.shops?.currency_symbol ?? "GNF";
              const gain = Math.round((prix * product.reseller_commission_pct) / 100);
              const lien = `${siteUrl}/${product.shops?.slug}/produit/${product.slug}?ref=${code}`;
              const image = product.product_images?.[0];

              return (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={product.name}
                        width={56}
                        height={56}
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageOff className="size-4 text-muted-foreground" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.shops?.name}
                      <span className="mx-1.5">·</span>
                      {formatMoney(prix, devise)}
                    </p>
                    <p className="text-sm">
                      <Badge variant="secondary">
                        {product.reseller_commission_pct} % — {formatMoney(gain, devise)}
                      </Badge>
                    </p>
                  </div>

                  <CopyLinkButton url={lien} label="Mon lien" />
                </li>
              );
            })}
          </ul>
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">
                Aucun produit ne propose encore de commission revendeur. Les vendeurs la règlent
                produit par produit ; revenez plus tard.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
