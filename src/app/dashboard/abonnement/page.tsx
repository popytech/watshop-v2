import { Check, CircleAlert, Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentForm } from "@/components/shop/payment-form";
import { getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { requirePublishedShop } from "@/lib/shop/queries";
import {
  listProviders,
  PRO_CURRENCY,
  PRO_PRICE,
  watshopMobileMoneyNumber,
} from "@/lib/payment/providers";
import { formatDate, formatMoney } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { GnakryPayForm } from "@/components/dashboard/gnakrypay-form";
import { estConfiguree, METHODES } from "@/lib/payment/gnakrypay/client";

export const metadata = { title: "Abonnement — Watshop" };

const STATUT_LABELS = {
  pending: "En attente de confirmation",
  confirmed: "Confirmé",
  rejected: "Refusé",
} as const;

export default async function SubscriptionPage() {
  const [profile, shop] = await Promise.all([getProfile(), requirePublishedShop()]);
  const supabase = await createClient();

  const [{ data: subscription }, { data: payments }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", profile.id).maybeSingle(),
    supabase
      .from("payments")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const providers = listProviders();
  const numeroWatshop = watshopMobileMoneyNumber();
  const estPro = profile.is_pro && subscription?.plan === "pro";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground">
          Formule actuelle :{" "}
          <span className="font-medium text-foreground">{estPro ? "Pro" : "Gratuite"}</span>
          {estPro && subscription?.ends_at ? ` — jusqu'au ${formatDate(subscription.ends_at)}` : ""}
        </p>
      </div>

      {estPro ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="size-4 text-primary" />
              Vous êtes Pro
            </CardTitle>
            <CardDescription>
              Merci. Votre boutique {shop.name} bénéficie de la formule Pro.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Passer en Pro</CardTitle>
            <CardDescription>
              {formatMoney(PRO_PRICE, PRO_CURRENCY)} par mois.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ul className="flex flex-col gap-3">
              {providers.map((provider) => (
                <li
                  key={provider.id}
                  className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                >
                  {provider.available ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  ) : (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">
                      {provider.label}
                      {provider.available ? null : (
                        <Badge variant="outline">Bientôt</Badge>
                      )}
                    </p>
                    <p className="text-muted-foreground">
                      {provider.available ? provider.description : provider.unavailableReason}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {estConfiguree() ? (
              <div className="flex flex-col gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-medium">Payer maintenant par GNAKRYPAY</p>
                <GnakryPayForm
                  montant={PRO_PRICE}
                  devise={PRO_CURRENCY}
                  paysParDefaut={shop.country_code}
                  methodes={METHODES}
                />
              </div>
            ) : null}

            {numeroWatshop ? (
              <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Envoyez {formatMoney(PRO_PRICE, PRO_CURRENCY)} par Mobile Money au numéro
                  </p>
                  <p className="font-mono text-lg font-semibold">
                    {formatPhone(numeroWatshop)}
                  </p>
                </div>
                <PaymentForm
                  amount={PRO_PRICE}
                  currency={PRO_CURRENCY}
                  countryCode={shop.country_code}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Le paiement n&apos;est pas encore ouvert. Contactez l&apos;équipe Watshop pour
                passer en Pro en attendant.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {payments && payments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vos paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-medium">
                      {formatMoney(payment.amount, payment.currency)}
                    </span>
                    <br />
                    <span className="truncate text-muted-foreground">
                      {formatDate(payment.created_at)}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </span>
                  </span>
                  <Badge
                    variant={
                      payment.status === "confirmed"
                        ? "secondary"
                        : payment.status === "rejected"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {STATUT_LABELS[payment.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
