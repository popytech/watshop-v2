import { BadgeCheck, Crown, Store, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { SharePanel } from "@/components/shop/share-panel";
import { requireRole } from "@/lib/dal";
import {
  computeAgentStats,
  getAgentPayouts,
  getRecruitedSellers,
} from "@/lib/network/queries";
import { getSiteUrl } from "@/lib/site-url";
import { formatDate, formatMoney, formatMoneyCompact, formatNumber } from "@/lib/format";

export const metadata = { title: "Espace agent — Watshop" };

export default async function AgentPage() {
  const profile = await requireRole("agent", "admin");
  const [sellers, payouts, siteUrl] = await Promise.all([
    getRecruitedSellers(profile.id),
    getAgentPayouts(profile.id),
    getSiteUrl(),
  ]);

  const stats = computeAgentStats(sellers, payouts, profile.agent_commission);
  const lienParrainage = `${siteUrl}/register?agent=${profile.agent_code ?? ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {profile.name?.split(" ")[0] ?? "agent"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre code : <span className="font-mono font-medium">{profile.agent_code}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Vendeurs recrutés" value={formatNumber(stats.recruited)} icon={Store} />
        <StatTile
          label="Boutiques publiées"
          value={formatNumber(stats.published)}
          icon={BadgeCheck}
        />
        <StatTile label="Passés en Pro" value={formatNumber(stats.pro)} icon={Crown} />
        <StatTile
          label="Commission du mois"
          value={formatMoneyCompact(stats.monthlyCommission)}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votre lien de parrainage</CardTitle>
          <CardDescription>
            Tout vendeur qui crée son compte par ce lien vous est rattaché automatiquement, dès
            l&apos;inscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SharePanel shopName="Watshop" url={lienParrainage} />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Vendeurs recrutés</h2>

        {sellers.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {sellers.map((seller) => {
              const boutique = seller.shops?.[0];
              const publiee = Boolean(boutique?.published_at);

              return (
                <li
                  key={seller.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {seller.name ?? seller.phone ?? seller.email}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {boutique ? boutique.name : "Boutique non créée"}
                      <span className="mx-1.5">·</span>
                      inscrit le {formatDate(seller.created_at)}
                    </p>
                  </div>

                  {seller.is_pro ? <Badge>Pro</Badge> : null}
                  <Badge variant={publiee ? "secondary" : "outline"}>
                    {publiee ? "Publiée" : "En cours"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">
                Personne encore. Partagez votre lien : chaque vendeur dont la boutique est
                publiée vous rapporte {formatMoney(profile.agent_commission)} par mois.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commissions</CardTitle>
          <CardDescription>
            {formatMoney(profile.agent_commission)} par vendeur dont la boutique est publiée, par
            mois. Un compte créé mais laissé vide ne compte pas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Déjà versé</dt>
              <dd className="font-medium">{formatMoney(stats.paidToDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">En attente de versement</dt>
              <dd className="font-medium">{formatMoney(stats.pendingPayout)}</dd>
            </div>
          </dl>

          {payouts.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {payouts.map((payout) => (
                <li
                  key={payout.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <span>{formatDate(payout.period_month)}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{formatMoney(payout.amount)}</span>
                    <Badge variant={payout.status === "paid" ? "secondary" : "outline"}>
                      {payout.status === "paid" ? "Versé" : "En attente"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun versement pour l&apos;instant. Les commissions sont arrêtées chaque mois par
              l&apos;équipe Watshop.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
