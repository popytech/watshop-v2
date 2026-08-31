"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { declarePayment } from "@/lib/payment/actions";
import { initialFormState } from "@/lib/shop/state";
import { DUREES } from "@/lib/payment/pricing";
import { cn } from "@/lib/utils";

export function PaymentForm({
  tarifMensuel,
  currency,
  countryCode,
}: {
  tarifMensuel: number;
  currency: string;
  countryCode: string;
}) {
  const [state, action, pending] = useActionState(declarePayment, initialFormState);
  const [mois, setMois] = useState<number>(DUREES[0].mois);

  const duree = DUREES.find((d) => d.mois === mois) ?? DUREES[0];
  const montant = tarifMensuel * duree.moisFactures;

  return (
    <form action={action}>
      <input type="hidden" name="amount" value={montant} />
      <input type="hidden" name="mois" value={mois} />

      {/* Le même choix de durée que pour le paiement en ligne : un virement
          d'un an qui n'accorderait qu'un mois serait une promesse trahie. */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Durée</p>
        <div className="grid grid-cols-2 gap-2">
          {DUREES.map((d) => {
            const cadeau = d.mois - d.moisFactures;
            const actif = d.mois === mois;

            return (
              <button
                key={d.mois}
                type="button"
                onClick={() => setMois(d.mois)}
                aria-pressed={actif}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  actif
                    ? "border-primary bg-primary/5"
                    : "text-muted-foreground hover:border-foreground/30",
                )}
              >
                <span className="text-sm font-medium">{d.libelle}</span>
                <span className="text-xs tabular-nums">
                  {new Intl.NumberFormat("fr-FR").format(tarifMensuel * d.moisFactures)} {currency}
                </span>
                {cadeau > 0 ? (
                  <span className="text-xs font-medium text-primary">
                    {cadeau} mois offert{cadeau > 1 ? "s" : ""}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
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
          J&apos;ai payé {new Intl.NumberFormat("fr-FR").format(montant)} {currency}
        </Button>
      </FieldGroup>
    </form>
  );
}
