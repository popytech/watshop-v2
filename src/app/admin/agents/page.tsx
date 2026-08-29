import Link from "next/link";
import { ArrowLeft, BadgeCheck, ShieldX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { reviewAgent } from "@/lib/network/actions";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

export const metadata = { title: "Agents — Watshop" };

type AgentRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  agent_code: string | null;
  agent_commission: number;
  agent_verified_at: string | null;
  created_at: string;
};

export default async function AdminAgentsPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, phone, agent_code, agent_commission, agent_verified_at, created_at")
    .eq("role", "agent")
    .order("created_at", { ascending: false });

  const agents = (data ?? []) as AgentRow[];
  const enAttente = agents.filter((a) => !a.agent_verified_at);

  // Combien de vendeurs chaque agent a-t-il déjà rattachés ?
  const { data: rattachements } = await supabase
    .from("profiles")
    .select("agent_id")
    .not("agent_id", "is", null);

  const parAgent = new Map<string, number>();
  for (const ligne of rattachements ?? []) {
    if (ligne.agent_id) parAgent.set(ligne.agent_id, (parAgent.get(ligne.agent_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/admin">
          <ArrowLeft />
          Administration
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agents commerciaux</h1>
        <p className="text-sm text-muted-foreground">
          {enAttente.length > 0
            ? `${enAttente.length} agent${enAttente.length > 1 ? "s" : ""} en attente de validation`
            : "Aucun agent en attente"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ce que la validation change</CardTitle>
          <CardDescription>
            Le rôle agent se choisit à l&apos;inscription : n&apos;importe quel compte peut le
            demander. Tant qu&apos;il n&apos;est pas validé, son lien de parrainage fonctionne mais
            ne rattache aucun vendeur — le parrainage n&apos;est simplement pas compté. Retirer la
            validation arrête les futurs rattachements sans défaire ceux déjà acquis.
          </CardDescription>
        </CardHeader>
      </Card>

      {agents.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {agents.map((agent) => {
            const valide = Boolean(agent.agent_verified_at);
            const recrutes = parAgent.get(agent.id) ?? 0;

            return (
              <li
                key={agent.id}
                className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {agent.name ?? agent.email ?? "compte sans nom"}
                    <span className="font-mono text-xs text-muted-foreground">
                      {agent.agent_code}
                    </span>
                    <Badge variant={valide ? "secondary" : "outline"}>
                      {valide ? "Validé" : "En attente"}
                    </Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {agent.phone ? formatPhone(agent.phone) : (agent.email ?? "—")}
                    <span className="mx-1.5">·</span>
                    inscrit le {formatDate(agent.created_at)}
                    <span className="mx-1.5">·</span>
                    {recrutes} vendeur{recrutes > 1 ? "s" : ""} rattaché
                    {recrutes > 1 ? "s" : ""}
                  </p>
                </div>

                <form action={reviewAgent} className="shrink-0">
                  <input type="hidden" name="agentId" value={agent.id} />
                  <input type="hidden" name="decision" value={valide ? "revoke" : "approve"} />
                  <Button type="submit" variant={valide ? "outline" : "default"} size="sm">
                    {valide ? (
                      <>
                        <ShieldX />
                        Retirer la validation
                      </>
                    ) : (
                      <>
                        <BadgeCheck />
                        Valider
                      </>
                    )}
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Personne n&apos;a encore choisi le rôle agent.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
