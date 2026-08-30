import { Crown, Building2, Store } from "lucide-react";

import { Section, SectionHeader } from "@/components/landing/section";
import { PricingColumn } from "@/components/landing/pricing-column";
import { PLANS, PLAN_RECOMMANDE, PRO_CURRENCY } from "@/lib/payment/providers";
import { PAYS_SERVIS } from "@/lib/payment/pricing";
import { formatMoney } from "@/lib/format";

const ICONES = { free: Store, pro: Crown, business: Building2 };

export function Pricing() {
  return (
    <Section className="line-b">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12">
        <SectionHeader
          eyebrow="Tarifs"
          title="Commencez gratuitement"
          description="Aucune carte bancaire, aucune commission prélevée sur vos ventes. Vous changez de formule le jour où votre boutique tourne."
        />

        <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const Icone = ICONES[plan.id];
            const recommande = plan.id === PLAN_RECOMMANDE;

            return (
              <PricingColumn
                key={plan.id}
                variant={recommande ? "glow-brand" : plan.id === "business" ? "glow" : "default"}
                name={plan.nom}
                icon={<Icone className="size-4" />}
                description={plan.accroche}
                price={plan.prix === 0 ? "0 GNF" : formatMoney(plan.prix, PRO_CURRENCY)}
                priceNote={
                  plan.prix === 0
                    ? "Gratuit pour toujours, sans carte bancaire."
                    : "Par mois, sans engagement. Vous démarrez sur l'offre gratuite."
                }
                cta={{
                  label: plan.prix === 0 ? "Créer ma boutique" : "Commencer gratuitement",
                  href: "/register",
                }}
                features={plan.inclus}
                upcoming={plan.aVenir}
              />
            );
          })}
        </div>

        {/* Les prix affichés ici sont ceux de la Guinée : la page d'accueil ne
            sait pas d'où vient son visiteur. Le montant réellement demandé est
            celui du pays choisi à la création de la boutique — un vendeur
            sénégalais paie en francs CFA, pas en francs guinéens. */}
        <p className="text-center text-sm text-muted-foreground">
          Prix indiqués en francs guinéens, convertis dans la monnaie de votre pays.
          <br className="hidden sm:block" /> Watshop fonctionne en {PAYS_SERVIS.join(", ")}.
        </p>
      </div>
    </Section>
  );
}
