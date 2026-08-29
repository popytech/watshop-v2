"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveDeliveryPartner, saveDeliveryZone } from "@/lib/network/actions";
import { initialFormState } from "@/lib/shop/state";

const VEHICULES = [
  { value: "moto", label: "Moto" },
  { value: "velo", label: "Vélo" },
  { value: "voiture", label: "Voiture" },
  { value: "a_pied", label: "À pied" },
];

export function DeliveryZoneForm({ currency }: { currency: string }) {
  const [state, action, pending] = useActionState(saveDeliveryZone, initialFormState);

  return (
    <form action={action}>
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="zoneName">Nom de la zone</FieldLabel>
            <Input
              id="zoneName"
              name="zoneName"
              className="h-11"
              placeholder="Kaloum"
              aria-invalid={Boolean(state.errors?.zoneName)}
              required
            />
            <FieldError>{state.errors?.zoneName}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="price">Frais de livraison ({currency})</FieldLabel>
            <Input
              id="price"
              name="price"
              inputMode="numeric"
              className="h-11"
              placeholder="15000"
              aria-invalid={Boolean(state.errors?.price)}
              required
            />
            <FieldError>{state.errors?.price}</FieldError>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="estimatedDelay">Délai (facultatif)</FieldLabel>
            <Input
              id="estimatedDelay"
              name="estimatedDelay"
              className="h-11"
              placeholder="24 à 48 h"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="freeAbove">Gratuite au-dessus de (facultatif)</FieldLabel>
            <Input
              id="freeAbove"
              name="freeAbove"
              inputMode="numeric"
              className="h-11"
              placeholder="500000"
            />
            <FieldDescription>Laissez vide si la livraison est toujours payante.</FieldDescription>
          </Field>
        </div>

        {state.message ? (
          <p role="alert" className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 sm:self-start" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          Ajouter la zone
        </Button>
      </FieldGroup>
    </form>
  );
}

export function DeliveryPartnerForm({ countryCode }: { countryCode: string }) {
  const [state, action, pending] = useActionState(saveDeliveryPartner, initialFormState);

  return (
    <form action={action}>
      <input type="hidden" name="countryCode" value={countryCode} />

      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="partnerName">Nom du livreur</FieldLabel>
            <Input
              id="partnerName"
              name="name"
              className="h-11"
              placeholder="Mamadou Camara"
              aria-invalid={Boolean(state.errors?.name)}
              required
            />
            <FieldError>{state.errors?.name}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="partnerPhone">Numéro WhatsApp</FieldLabel>
            <Input
              id="partnerPhone"
              name="phone"
              type="tel"
              inputMode="tel"
              className="h-11"
              placeholder="622 12 34 56"
              aria-invalid={Boolean(state.errors?.phone)}
              required
            />
            <FieldDescription>
              S&apos;il a déjà un compte Watshop avec ce numéro, ses courses apparaîtront dans son
              espace livreur.
            </FieldDescription>
            <FieldError>{state.errors?.phone}</FieldError>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="partnerCity">Ville</FieldLabel>
            <Input
              id="partnerCity"
              name="city"
              className="h-11"
              placeholder="Conakry"
              aria-invalid={Boolean(state.errors?.city)}
              required
            />
            <FieldError>{state.errors?.city}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="vehicleType">Moyen de transport</FieldLabel>
            <Select name="vehicleType" defaultValue="moto">
              <SelectTrigger id="vehicleType" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICULES.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {state.message ? (
          <p role="alert" className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 sm:self-start" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          Ajouter le livreur
        </Button>
      </FieldGroup>
    </form>
  );
}
