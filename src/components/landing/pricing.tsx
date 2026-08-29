import Link from "next/link";
import { Check, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/landing/section";
import { PLANS, PLAN_RECOMMANDE, PRO_CURRENCY } from "@/lib/payment/providers";
import { formatMoney } from "@/lib/format";

export function Pricing() {
  return (
    <Section className="border-t">
      <SectionHeader
        eyebrow="Tarifs"
        title="Commencez gratuitement"
        description="Aucune carte bancaire, aucune commission prélevée sur vos ventes. Vous changez de formule le jour où votre boutique tourne."
      />

      <div className="mx-auto mt-12 grid max-w-5xl gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const recommande = plan.id === PLAN_RECOMMANDE;

          return (
            <div
              key={plan.id}
              className={
                recommande
                  ? "flex flex-col gap-5 rounded-xl border-2 border-brand bg-card p-6"
                  : "flex flex-col gap-5 rounded-xl border bg-card p-6"
              }
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{plan.nom}</h3>
                  {recommande ? <Badge>Populaire</Badge> : null}
                </div>
                <p className="text-3xl font-semibold tracking-tight">
                  {plan.prix === 0 ? "0 GNF" : formatMoney(plan.prix, PRO_CURRENCY)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {plan.prix === 0 ? "Pour toujours" : "par mois"}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">{plan.accroche}</p>

              <ul className="flex flex-1 flex-col gap-2 text-sm">
                {plan.inclus.map((avantage) => {
                  const aVenir = plan.aVenir.includes(avantage);

                  return (
                    <li key={avantage} className="flex items-start gap-2">
                      {aVenir ? (
                        <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Check className="mt-0.5 size-4 shrink-0 text-brand dark:text-brand-foreground" />
                      )}
                      <span className={aVenir ? "text-muted-foreground" : undefined}>
                        {avantage}
                        {aVenir ? " (bientôt)" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Button
                asChild
                size="lg"
                variant={recommande ? "default" : "outline"}
                className="h-11"
              >
                <Link href="/register">
                  {plan.prix === 0 ? "Créer ma boutique" : "Commencer gratuitement"}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
        Toutes les formules démarrent par l&apos;offre gratuite. Vous ne payez que le jour où vous
        décidez de changer.
      </p>
    </Section>
  );
}
