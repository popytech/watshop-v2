import { Card, CardContent } from "@/components/ui/card";
import { OrderRow } from "@/components/dashboard/order-row";
import { getOrders, requirePublishedShop } from "@/lib/shop/queries";

export const metadata = { title: "Commandes — Watshop" };

export default async function OrdersPage() {
  const shop = await requirePublishedShop();
  const orders = await getOrders(shop.id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commandes</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length > 0
            ? `${orders.length} commande${orders.length > 1 ? "s" : ""}`
            : "Aucune commande pour l'instant"}
        </p>
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
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Les commandes passées depuis votre boutique apparaîtront ici, et vous serez
              prévenu sur WhatsApp.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
