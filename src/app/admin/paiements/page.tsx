import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { reviewPayment } from "@/lib/payment/actions";
import { formatDateTime, formatMoney } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

export const metadata = { title: "Paiements — Watshop" };

type PaymentRow = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  reference: string | null;
  payer_phone: string | null;
  status: "pending" | "confirmed" | "rejected";
  created_at: string;
  profiles: { name: string | null; email: string | null; phone: string | null } | null;
};

export default async function AdminPaymentsPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("payments")
    .select("*, profiles(name, email, phone)")
    .order("created_at", { ascending: false })
    .limit(50);

  const payments = (data ?? []) as unknown as PaymentRow[];
  const enAttente = payments.filter((p) => p.status === "pending");

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/admin">
          <ArrowLeft />
          Administration
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paiements</h1>
        <p className="text-sm text-muted-foreground">
          {enAttente.length > 0
            ? `${enAttente.length} déclaration${enAttente.length > 1 ? "s" : ""} à vérifier`
            : "Aucune déclaration en attente"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comment vérifier</CardTitle>
          <CardDescription>
            Retrouvez la référence dans l&apos;historique Mobile Money du compte Watshop, puis
            confirmez. La confirmation fait passer le vendeur en Pro automatiquement — c&apos;est
            un trigger en base, pas cet écran, qui s&apos;en charge.
          </CardDescription>
        </CardHeader>
      </Card>

      {payments.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {formatMoney(payment.amount, payment.currency)}
                  <span className="mx-1.5 text-muted-foreground">·</span>
                  <span className="font-normal">
                    {payment.profiles?.name ??
                      payment.profiles?.email ??
                      payment.profiles?.phone ??
                      "compte inconnu"}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono">{payment.reference ?? "sans référence"}</span>
                  {payment.payer_phone ? (
                    <>
                      <span className="mx-1.5">·</span>
                      {formatPhone(payment.payer_phone)}
                    </>
                  ) : null}
                  <span className="mx-1.5">·</span>
                  {formatDateTime(payment.created_at)}
                </p>
              </div>

              {payment.status === "pending" ? (
                <div className="flex shrink-0 gap-2">
                  <form action={reviewPayment}>
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <input type="hidden" name="decision" value="confirmed" />
                    <Button type="submit" size="sm">
                      <Check />
                      Confirmer
                    </Button>
                  </form>
                  <form action={reviewPayment}>
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <Button type="submit" variant="outline" size="sm">
                      <X />
                      Refuser
                    </Button>
                  </form>
                </div>
              ) : (
                <Badge variant={payment.status === "confirmed" ? "secondary" : "destructive"}>
                  {payment.status === "confirmed" ? "Confirmé" : "Refusé"}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Aucun paiement déclaré pour l&apos;instant.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
