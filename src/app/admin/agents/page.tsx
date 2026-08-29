import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, ExternalLink, ShieldX, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { signedAgentDocumentUrl } from "@/lib/storage";
import { reviewAgent } from "@/lib/network/actions";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

export const metadata = { title: "Agents — Watshop" };

type Application = {
  user_id: string;
  photo_url: string;
  id_document_url: string | null;
  city: string;
  neighborhood: string | null;
  occupation: string | null;
  motivation: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
};

type AgentRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  agent_code: string | null;
  agent_verified_at: string | null;
  created_at: string;
};

export default async function AdminAgentsPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ data: profils }, { data: dossiers }, { data: rattachements }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, phone, agent_code, agent_verified_at, created_at")
      .eq("role", "agent")
      .order("created_at", { ascending: false }),
    supabase.from("agent_applications").select("*"),
    supabase.from("profiles").select("agent_id").not("agent_id", "is", null),
  ]);

  const agents = (profils ?? []) as AgentRow[];
  const parUtilisateur = new Map(
    ((dossiers ?? []) as unknown as Application[]).map((d) => [d.user_id, d]),
  );

  const recrutesPar = new Map<string, number>();
  for (const ligne of rattachements ?? []) {
    if (ligne.agent_id) recrutesPar.set(ligne.agent_id, (recrutesPar.get(ligne.agent_id) ?? 0) + 1);
  }

  // Les pièces vivent dans un bucket privé : on fabrique une URL signée, valable
  // le temps de consulter l'écran. Aucune URL permanente ne circule.
  const liens = new Map<string, { photo: string | null; piece: string | null }>();
  for (const dossier of parUtilisateur.values()) {
    liens.set(dossier.user_id, {
      photo: await signedAgentDocumentUrl(dossier.photo_url),
      piece: dossier.id_document_url
        ? await signedAgentDocumentUrl(dossier.id_document_url)
        : null,
    });
  }

  const enAttente = agents.filter((a) => !a.agent_verified_at);

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
            ? `${enAttente.length} agent${enAttente.length > 1 ? "s" : ""} à examiner`
            : "Aucun agent en attente"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ce que la validation change</CardTitle>
          <CardDescription>
            Tant qu&apos;un agent n&apos;est pas validé, son lien de parrainage fonctionne mais ne
            rattache aucun vendeur. Retirer la validation arrête les futurs rattachements sans
            défaire ceux déjà acquis.
          </CardDescription>
        </CardHeader>
      </Card>

      {agents.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {agents.map((agent) => {
            const valide = Boolean(agent.agent_verified_at);
            const dossier = parUtilisateur.get(agent.id);
            const lien = liens.get(agent.id);
            const recrutes = recrutesPar.get(agent.id) ?? 0;

            return (
              <li key={agent.id} className="flex flex-col gap-4 rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                    {lien?.photo ? (
                      <Image
                        src={lien.photo}
                        alt=""
                        width={56}
                        height={56}
                        className="size-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <UserRound className="size-5 text-muted-foreground" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {agent.name ?? agent.email ?? "compte sans nom"}
                      <span className="font-mono text-xs text-muted-foreground">
                        {agent.agent_code}
                      </span>
                      <Badge variant={valide ? "secondary" : "outline"}>
                        {valide ? "Validé" : dossier ? "À examiner" : "Dossier manquant"}
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
                </div>

                {dossier ? (
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 text-sm">
                    <p>
                      <span className="text-muted-foreground">Où : </span>
                      {dossier.city}
                      {dossier.neighborhood ? `, ${dossier.neighborhood}` : ""}
                      {dossier.occupation ? (
                        <>
                          <span className="mx-1.5">·</span>
                          {dossier.occupation}
                        </>
                      ) : null}
                    </p>
                    {dossier.motivation ? (
                      <p className="whitespace-pre-line">{dossier.motivation}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Dossier envoyé le {formatDate(dossier.submitted_at)}
                    </p>
                    {lien?.piece ? (
                      <Button asChild variant="outline" size="sm" className="self-start">
                        <a href={lien.piece} target="_blank" rel="noopener noreferrer">
                          <ExternalLink />
                          Voir la pièce d&apos;identité
                        </a>
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Aucune pièce d&apos;identité fournie.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                    Ce compte a demandé le rôle agent sans envoyer de dossier. Rien ne permet de
                    le valider en l&apos;état.
                  </p>
                )}

                {/* Un seul formulaire, deux boutons : le nom "decision" est
                    porté par le bouton cliqué, la raison n'est lue qu'en cas de
                    refus. */}
                <form action={reviewAgent} className="flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="agentId" value={agent.id} />
                  <Input
                    name="reason"
                    className="h-10 flex-1"
                    placeholder="Motif du refus (visible par le candidat)"
                    defaultValue={dossier?.rejection_reason ?? ""}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      name="decision"
                      value="approve"
                      size="sm"
                      disabled={valide || !dossier}
                    >
                      <BadgeCheck />
                      Valider
                    </Button>
                    <Button
                      type="submit"
                      name="decision"
                      value="reject"
                      variant="outline"
                      size="sm"
                    >
                      <ShieldX />
                      {valide ? "Retirer" : "Refuser"}
                    </Button>
                  </div>
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
