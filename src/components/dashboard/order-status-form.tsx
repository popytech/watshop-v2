"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUS_LABELS } from "@/components/dashboard/order-status";
import { updateOrderStatus } from "@/lib/shop/actions";
import type { OrderStatus } from "@/lib/supabase/types";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [value, setValue] = useState<OrderStatus>(status);

  return (
    <form action={updateOrderStatus} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="orderId" value={orderId} />

      <Field className="sm:max-w-56">
        <FieldLabel htmlFor="status">Statut de la commande</FieldLabel>
        <Select
          name="status"
          value={value}
          onValueChange={(next) => setValue(next as OrderStatus)}
        >
          <SelectTrigger id="status" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {ORDER_STATUS_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="h-11"
        disabled={value === status}
      >
        <Check />
        Mettre à jour
      </Button>
    </form>
  );
}
