import { CheckCheck, MapPin, MessageCircle, PackageCheck, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/dashboard/order-status";
import { StatTile } from "@/components/dashboard/stat-tile";
import { requireRole } from "@/lib/dal";
import {
  countDeliveredToday,
  getAssignedOrders,
  getMyDeliveryPartners,
} from "@/lib/network/queries";
import { updateDeliveryStatus } from "@/lib/network/actions";
import { formatMoney, formatRelative, orderReference } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata = { title: "Mes courses — Watshop" };

export default async function LivreurPage() {
  const profile = await requireRole("delivery", "admin");
  const partners = await getMyDeliveryPartners();
  const orders = await getAssignedOrders(partners.map((p) => p.id));

  const enCours = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const livreesAujourdhui = countDeliveredToday(orders);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {profile.name?.split(" ")[0] ?? "👋"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {partners.length > 0
            ? `Vous livrez pour ${partners.length} boutique${partners.length > 1 ? "s" : ""}.`
            : "Aucune boutique ne vous a encore rattaché."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Courses en cours" value={String(enCours.length)} icon={Truck} />
        <StatTile
          label="Livrées aujourd'hui"
          value={String(livreesAujourdhui)}
          icon={PackageCheck}
        />
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              {partners.length === 0
                ? "Un vendeur doit vous ajouter comme livreur depuis son tableau de bord, avec le numéro WhatsApp de votre compte."
                : "Aucune commande ne vous a encore été confiée."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const reference = orderReference(order.id, order.source);
            const devise = order.shops?.currency_symbol ?? "GNF";

            return (
              <li key={order.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{reference}</span>
                  <OrderStatusBadge status={order.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(order.created_at)}
                  </span>
                </div>

                <div>
                  <p className="font-medium">{order.shops?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(order.order_items ?? [])
                      .map((i) => `${i.quantity} × ${i.product_name}`)
                      .join(", ")}
                  </p>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="font-medium">{order.customer_name}</span>
                    <br />
                    {order.customer_address}
                    {order.customer_city ? `, ${order.customer_city}` : ""}
                    <br />
                    <span className="text-muted-foreground">
                      {formatPhone(order.customer_phone)}
                    </span>
                  </span>
                </div>

                <p className="text-sm">
                  À encaisser :{" "}
                  <span className="font-semibold">{formatMoney(order.total_amount, devise)}</span>
                  {order.delivery_fee > 0 ? (
                    <span className="text-muted-foreground">
                      {" "}
                      (dont {formatMoney(order.delivery_fee, devise)} de livraison)
                    </span>
                  ) : null}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="lg" className="h-11">
                    <a
                      href={whatsappLink(
                        order.customer_phone,
                        `Bonjour ${order.customer_name.split(" ")[0]}, je suis le livreur de votre commande ${reference}.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle />
                      Appeler le client
                    </a>
                  </Button>

                  {order.status !== "shipped" && order.status !== "delivered" ? (
                    <form action={updateDeliveryStatus}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="status" value="shipped" />
                      <Button type="submit" variant="outline" size="lg" className="h-11">
                        <Truck />
                        En route
                      </Button>
                    </form>
                  ) : null}

                  {order.status !== "delivered" ? (
                    <form action={updateDeliveryStatus}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="status" value="delivered" />
                      <Button type="submit" size="lg" className="h-11">
                        <CheckCheck />
                        Livrée
                      </Button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
