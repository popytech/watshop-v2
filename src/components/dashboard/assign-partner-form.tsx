"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignDeliveryPartner } from "@/lib/network/actions";

const AUCUN = "aucun";

export function AssignPartnerForm({
  orderId,
  partners,
  currentPartnerId,
}: {
  orderId: string;
  partners: { id: string; name: string; city: string }[];
  currentPartnerId: string | null;
}) {
  const [value, setValue] = useState(currentPartnerId ?? AUCUN);

  return (
    <form action={assignDeliveryPartner} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="orderId" value={orderId} />
      {/* Le champ caché porte la valeur réelle : "aucun" devient une chaîne
          vide, ce que l'action interprète comme un retrait d'affectation. */}
      <input type="hidden" name="partnerId" value={value === AUCUN ? "" : value} />

      <Field className="sm:max-w-64">
        <FieldLabel htmlFor="partner">Livreur</FieldLabel>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger id="partner" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUCUN}>Aucun livreur</SelectItem>
            {partners.map((partner) => (
              <SelectItem key={partner.id} value={partner.id}>
                {partner.name} — {partner.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {partners.length === 0 ? (
          <FieldDescription>
            Ajoutez d&apos;abord un livreur dans l&apos;écran Livraison.
          </FieldDescription>
        ) : null}
      </Field>

      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="h-11"
        disabled={value === (currentPartnerId ?? AUCUN)}
      >
        <Check />
        Confier la course
      </Button>
    </form>
  );
}
