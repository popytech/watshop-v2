import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/supabase/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Nouveau",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const VARIANTS: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "default",
  confirmed: "secondary",
  shipped: "secondary",
  delivered: "outline",
  cancelled: "destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANTS[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
