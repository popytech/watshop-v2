"use client";

import { useActionState, useId, useState } from "react";
import { Loader2, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { lancerPaiement } from "@/lib/payment/gnakrypay/actions";
import { initialPaiementState } from "@/lib/payment/gnakrypay/state";
import { formatMoney } from "@/lib/format";
import { DUREES, moisOfferts } from "@/lib/payment/pricing";
import { cn } from "@/lib/utils";

/**
 * Paiement de l'abonnement par GNAKRYPAY.
 *
 * Le vendeur choisit son opérateur, saisit son numéro, et valide ensuite sur
 * son téléphone : il ne quitte jamais Watshop. C'est pour cela que le paiement
 * direct a été préféré au portail hébergé, qui aurait affiché une page à
 * l'enseigne d'un tiers.
 *
 * Rien n'est à faire ensuite. La passerelle rappelle notre webhook, la ligne de
 * paiement passe à « confirmé », et la base fait le reste : abonnement
 * prolongé, boutique mise en avant. D'où le message qui le dit — un vendeur qui
 * ne sait pas que c'est automatique rappelle le support.
 */
export function GnakryPayForm({
  tarifMensuel,
  devise,
  paysParDefaut,
  methodes,
}: {
  tarifMensuel: number;
  devise: string;
  paysParDefaut: string;
  methodes: readonly { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(lancerPaiement, initialPaiementState);
  const [methode, setMethode] = useState(methodes[0]?.id ?? "OM");
  const [mois, setMois] = useState<number>(DUREES[0].mois);

  const duree = DUREES.find((d) => d.mois === mois) ?? DUREES[0];
  const montant = tarifMensuel * duree.moisFactures;
  const offerts = moisOfferts(mois);
  const telId = useId();

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="countryCode" value={paysParDefaut} />
      <input type="hidden" name="methode" value={methode} />
      <input type="hidden" name="mois" value={mois} />

      <Field>
        <FieldLabel>Durée</FieldLabel>
        {/* Les mois offerts sont annoncés sur le bouton lui-même : une remise
            qu'il faut calculer n'en est pas une. */}
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
                  {formatMoney(tarifMensuel * d.moisFactures, devise)}
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
      </Field>

      <Field>
        <FieldLabel>Payer avec</FieldLabel>
        {/* Des boutons plutôt qu'une liste déroulante : trois choix se lisent
            d'un coup d'œil, et le doigt les atteint sans ouvrir de menu. */}
        <div className="grid grid-cols-3 gap-2">
          {methodes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethode(m.id)}
              aria-pressed={methode === m.id}
              className={cn(
                "rounded-lg border px-2 py-3 text-sm font-medium transition-colors",
                methode === m.id
                  ? "border-primary bg-primary/5 text-foreground"
                  : "text-muted-foreground hover:border-foreground/30",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Field>

      <Field>
        <FieldLabel htmlFor={telId}>Numéro à débiter</FieldLabel>
        <Input
          id={telId}
          name="telephone"
          type="tel"
          inputMode="tel"
          required
          placeholder="6XX XX XX XX"
          className="h-11"
        />
        <FieldDescription>
          Le compte doit être ouvert chez l&apos;opérateur choisi.
        </FieldDescription>
      </Field>

      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Smartphone />}
        Payer {formatMoney(montant, devise)} pour {duree.libelle}
        {offerts > 0 ? ` (${offerts} offert${offerts > 1 ? "s" : ""})` : ""}
      </Button>

      {state.message ? (
        <p
          role="status"
          className={cn("text-sm", state.ok ? "text-primary" : "text-destructive")}
        >
          {state.message}
        </p>
      ) : null}

      {/* Certains opérateurs terminent sur une page à eux. Le lien n'apparaît
          que si la passerelle en a renvoyé une. */}
      {state.ok && state.paiementUrl ? (
        <Button asChild variant="outline" className="h-11">
          <a href={state.paiementUrl} target="_blank" rel="noreferrer">
            Terminer le paiement
          </a>
        </Button>
      ) : null}
    </form>
  );
}
