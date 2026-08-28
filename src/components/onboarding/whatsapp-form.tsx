"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

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
import { saveWhatsapp } from "@/lib/shop/actions";
import { initialFormState } from "@/lib/shop/state";
import { COUNTRIES, getCountry } from "@/lib/phone";

type Props = {
  defaultValues: { phone: string; mobileMoney: string; countryCode: string };
  submitLabel?: string;
};

export function WhatsappForm({ defaultValues, submitLabel = "Continuer" }: Props) {
  const [state, action, pending] = useActionState(saveWhatsapp, initialFormState);
  const [countryCode, setCountryCode] = useState(defaultValues.countryCode);
  const country = getCountry(countryCode);

  return (
    <form action={action}>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="phone">Numéro WhatsApp de la boutique</FieldLabel>
          <div className="flex gap-2">
            <Select name="countryCode" value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="h-11 w-[7.5rem]" aria-label="Pays">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    +{item.dial} {item.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              className="h-11 flex-1"
              placeholder={country.example}
              defaultValue={defaultValues.phone}
              aria-invalid={Boolean(state.errors?.phone)}
              required
            />
          </div>
          <FieldDescription>
            C&apos;est sur ce numéro que vos clients vous écriront pour commander.
          </FieldDescription>
          <FieldError>{state.errors?.phone}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="mobileMoney">Numéro Mobile Money (facultatif)</FieldLabel>
          <Input
            id="mobileMoney"
            name="mobileMoney"
            type="tel"
            inputMode="tel"
            className="h-11"
            placeholder={country.example}
            defaultValue={defaultValues.mobileMoney}
            aria-invalid={Boolean(state.errors?.mobileMoney)}
          />
          <FieldDescription>
            Le paiement en ligne arrivera plus tard. Pour l&apos;instant ce numéro sert seulement
            à indiquer où vos clients peuvent vous envoyer l&apos;argent — vous pouvez sauter cette
            case.
          </FieldDescription>
          <FieldError>{state.errors?.mobileMoney}</FieldError>
        </Field>

        {state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {submitLabel}
          <ArrowRight />
        </Button>
      </FieldGroup>
    </form>
  );
}
