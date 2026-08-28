import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/dashboard/order-status";
import { formatMoney, formatRelative, orderReference } from "@/lib/format";
import { orderFollowUpMessage, whatsappLink } from "@/lib/whatsapp";
import type { OrderWithItems } from "@/lib/shop/queries";

/**
 * Une commande dans la liste : référence, contenu, montant, et les deux seules
 * actions qui comptent — l'ouvrir, ou écrire au client sur WhatsApp.
 */
export function OrderRow({
  order,
  currency,
  shopName,
}: {
  order: OrderWithItems;
  currency: string;
  shopName: string;
}) {
  const reference = orderReference(order.id, order.source);
  const items = order.order_items ?? [];
  const resume =
    items.length === 0
      ? "Commande sans détail"
      : items.length === 1
        ? `${items[0].quantity} × ${items[0].product_name}`
        : `${items[0].product_name} + ${items.length - 1} autre${items.length > 2 ? "s" : ""}`;

  return (
    <li className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{reference}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-0.5 truncate font-medium">{resume}</p>
        <p className="text-sm text-muted-foreground">
          {formatMoney(order.total_amount, currency)}
          <span className="mx-1.5">·</span>
          {order.customer_name}
          <span className="mx-1.5">·</span>
          {formatRelative(order.created_at)}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/commandes/${order.id}`}>Voir</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href={whatsappLink(
              order.customer_phone,
              orderFollowUpMessage({
                customerName: order.customer_name,
                reference,
                shopName,
              }),
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            WhatsApp
          </a>
        </Button>
      </div>
    </li>
  );
}
