import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/dashboard/order-status";
import { OrderStatusForm } from "@/components/dashboard/order-status-form";
import { getOrder, requirePublishedShop } from "@/lib/shop/queries";
import { formatDateTime, formatMoney, orderReference } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { orderFollowUpMessage, whatsappLink } from "@/lib/whatsapp";

export const metadata = { title: "Commande — Watshop" };

type Props = { params: Promise<{ id: string }> };

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const shop = await requirePublishedShop();
  const order = await getOrder(shop.id, id);

  if (!order) notFound();

  const reference = orderReference(order.id, order.source);
  const items = order.order_items ?? [];
  const sousTotal = items.reduce((total, item) => total + item.unit_price * item.quantity, 0);

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/dashboard/commandes">
          <ArrowLeft />
          Commandes
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-xl font-semibold">{reference}</h1>
        <OrderStatusBadge status={order.status} />
        <span className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="font-medium">{order.customer_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd className="font-medium">{formatPhone(order.customer_phone)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Adresse de livraison</dt>
              <dd className="font-medium">
                {order.customer_address}
                {order.customer_city ? `, ${order.customer_city}` : ""}
              </dd>
            </div>
          </dl>

          <Button asChild size="lg" className="h-11 sm:self-start">
            <a
              href={whatsappLink(
                order.customer_phone,
                orderFollowUpMessage({
                  customerName: order.customer_name,
                  reference,
                  shopName: shop.name,
                }),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Écrire sur WhatsApp
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span>
                  {item.quantity} × {item.product_name}
                  {item.size ? <span className="text-muted-foreground"> ({item.size})</span> : null}
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
            <span className="tabular-nums">{formatMoney(sousTotal, shop.currency_symbol)}</span>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suivi</CardTitle>
          <CardDescription>
            Le statut est visible par vous seul pour l&apos;instant ; prévenez votre client sur
            WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderStatusForm orderId={order.id} status={order.status} />
        </CardContent>
      </Card>
    </div>
  );
}
