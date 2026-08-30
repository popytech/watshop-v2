import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClearCart } from "@/components/storefront/clear-cart";
import { getPublicShop } from "@/lib/shop/public";
import { getPublicOrder, getSellerWhatsApp } from "@/lib/order/public";
import { formatMoney, orderReference } from "@/lib/format";
import { shopPath } from "@/lib/tenant";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata = { title: "Commande envoyée — Watshop", robots: { index: false } };

type Props = { params: Promise<{ slug: string; id: string }> };

export default async function OrderConfirmationPage({ params }: Props) {
  const { slug, id } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) notFound();

  const order = await getPublicOrder(id, shop.id);
  if (!order) notFound();

  // Lu par le rôle serveur : la colonne n'est plus accessible au public.
  const numeroVendeur = await getSellerWhatsApp(shop.id, order.id);

  const reference = orderReference(order.id, order.source);
  const sousTotal = order.order_items.reduce(
    (total, item) => total + item.unit_price * item.quantity,
    0,
  );

  const messageVendeur = [
    `Bonjour ${shop.name},`,
    "",
    `Je viens de passer la commande ${reference} sur votre boutique.`,
    `Total : ${formatMoney(order.total_amount, shop.currency_symbol)}`,
  ].join("\n");

  return (
    <div className="flex flex-col gap-5">
      <ClearCart shopSlug={shop.slug} />

      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Commande envoyée</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {shop.name} a reçu votre commande sur WhatsApp et vous contactera pour la confirmer.
          Gardez cette page : elle porte votre numéro de commande.
        </p>
      </div>

      {numeroVendeur ? (
        <Button asChild size="lg" className="h-12 w-full">
          <a
            href={whatsappLink(numeroVendeur, messageVendeur)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            Écrire à {shop.name}
          </a>
        </Button>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-base">{reference}</CardTitle>
          <CardDescription>
            {order.customer_name} · {order.customer_address}
            {order.customer_city ? `, ${order.customer_city}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span>
                  {item.quantity} × {item.product_name}
                  {item.size ? (
                    <span className="text-muted-foreground"> ({item.size})</span>
                  ) : null}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatMoney(item.unit_price * item.quantity, shop.currency_symbol)}
                </span>
              </li>
            ))}
          </ul>

          <Separator />

          <div className="flex items-baseline justify-between text-sm text-muted-foreground">
            <span>Sous-total</span>
            <span className="tabular-nums">
              {formatMoney(sousTotal, shop.currency_symbol)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-sm text-muted-foreground">
            <span>Livraison</span>
            <span className="tabular-nums">
              {formatMoney(order.delivery_fee, shop.currency_symbol)}
            </span>
          </div>
          <div className="flex items-baseline justify-between font-medium">
            <span>Total</span>
            <span className="tabular-nums">
              {formatMoney(order.total_amount, shop.currency_symbol)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Button asChild variant="outline" size="lg" className="h-11">
        <Link href={shopPath(shop.slug)}>Retour à la boutique</Link>
      </Button>
    </div>
  );
}
