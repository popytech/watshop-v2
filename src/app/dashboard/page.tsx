import Link from "next/link";
import { Eye, MessageCircle, Plus, ShoppingCart, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { OrderRow } from "@/components/dashboard/order-row";
import { SharePanel } from "@/components/shop/share-panel";
import { getProfile } from "@/lib/dal";
import { getDashboardStats, getRecentOrders, requirePublishedShop } from "@/lib/shop/queries";
import { getSiteUrl } from "@/lib/site-url";
import { formatMoneyCompact, formatNumber } from "@/lib/format";
import { shopPath } from "@/lib/tenant";

export const metadata = { title: "Tableau de bord — Watshop" };

type Props = { searchParams: Promise<{ bienvenue?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const [profile, shop, { bienvenue }, siteUrl] = await Promise.all([
    getProfile(),
    requirePublishedShop(),
    searchParams,
    getSiteUrl(),
  ]);

  const [stats, orders] = await Promise.all([
    getDashboardStats(shop.id),
    getRecentOrders(shop.id),
  ]);

  const shopUrl = `${siteUrl}${shopPath(shop.slug)}`;
  const prenom = profile.name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      {bienvenue ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Votre boutique est en ligne 🎉</CardTitle>
            <CardDescription>
              Partagez le lien maintenant : c&apos;est ce qui fait venir vos premières commandes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SharePanel shopName={shop.name} url={shopUrl} />
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {prenom ?? shop.name}
        </h1>
        <p className="text-sm text-muted-foreground">Aujourd&apos;hui</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Commandes"
          value={formatNumber(stats.orders)}
          icon={ShoppingCart}
        />
        <StatTile
          label="Ventes"
          value={formatMoneyCompact(stats.sales, shop.currency_symbol)}
          icon={Wallet}
        />
        <StatTile label="Visiteurs" value={formatNumber(stats.visitors)} icon={Eye} />
        <StatTile
          label="Commandes WhatsApp"
          value={formatNumber(stats.whatsappOrders)}
          icon={MessageCircle}
        />
      </div>

      <Button asChild size="lg" className="h-11 w-full sm:w-auto sm:self-start">
        <Link href="/dashboard/produits/nouveau">
          <Plus />
          Ajouter un produit
        </Link>
      </Button>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Commandes récentes</h2>
          {orders.length > 0 ? (
            <Button asChild variant="link" size="sm">
              <Link href="/dashboard/commandes">Tout voir</Link>
            </Button>
          ) : null}
        </div>

        {orders.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                currency={shop.currency_symbol}
                shopName={shop.name}
              />
            ))}
          </ul>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-6">
              <p className="text-sm text-muted-foreground">
                Aucune commande pour l&apos;instant. Partagez votre boutique pour lancer les
                ventes.
              </p>
              <SharePanel shopName={shop.name} url={shopUrl} />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
