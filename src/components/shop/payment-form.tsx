"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { declarePayment } from "@/lib/payment/actions";
import { initialFormState } from "@/lib/shop/state";

export function PaymentForm({
  amount,
  currency,
  countryCode,
}: {
  amount: number;
  currency: string;
  countryCode: string;
}) {
  const [state, action, pending] = useActionState(declarePayment, initialFormState);

  return (
    <form action={action}>
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="countryCode" value={countryCode} />

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="reference">Référence du transfert</FieldLabel>
          <Input
            id="reference"
            name="reference"
            className="h-11"
            placeholder="Ex. PP240829.1432.A12345"
            aria-invalid={Boolean(state.errors?.reference)}
            required
          />
          <FieldDescription>
            Le code que votre opérateur vous envoie par SMS après le transfert.
          </FieldDescription>
          <FieldError>{state.errors?.reference}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="payerPhone">Numéro utilisé pour payer</FieldLabel>
          <Input
            id="payerPhone"
            name="payerPhone"
            type="tel"
            inputMode="tel"
            className="h-11"
            placeholder="622 12 34 56"
            aria-invalid={Boolean(state.errors?.payerPhone)}
            required
          />
          <FieldError>{state.errors?.payerPhone}</FieldError>
        </Field>

        {state.message ? (
          <p
            role="alert"
            className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}
          >
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full sm:w-auto sm:self-start" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          J&apos;ai payé {new Intl.NumberFormat("fr-FR").format(amount)} {currency}
        </Button>
      </FieldGroup>
    </form>
  );
}
