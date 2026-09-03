import Link from "next/link";
import { ArrowLeft, CheckCircle2, Search, ShieldCheck, Store } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DeleteAccountButton } from "@/components/admin/delete-account-button";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { roleLabel } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import type { UserRole } from "@/lib/supabase/types";

export const metadata = { title: "Comptes — Watshop" };

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  country_code: string | null;
  is_pro: boolean;
  created_at: string;
  shops: { id: string; name: string; slug: string; is_active: boolean }[] | null;
};

const MESSAGES_ERREUR: Record<string, string> = {
  soi: "Vous ne pouvez pas supprimer votre propre compte.",
  admin: "Un compte administrateur ne peut pas être supprimé ici.",
  introuvable: "Ce compte est introuvable — il a peut-être déjà été supprimé.",
  echec: "La suppression a échoué. Réessayez, ou consultez les journaux du serveur.",
};

/** Nom lisible d'un compte : le nom, sinon l'email, sinon le téléphone. */
function libelle(row: Row): string {
  return row.name ?? row.email ?? (row.phone ? formatPhone(row.phone) : "Compte sans nom");
}

/** Ce que la confirmation nomme : la boutique, ou leur nombre s'il y en a plusieurs. */
function libelleBoutique(shops: Row["shops"]): string | null {
  if (!shops || shops.length === 0) return null;
  return shops.length === 1 ? shops[0].name : `${shops.length} boutiques`;
}

export default async function AdminComptesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; erreur?: string; supprime?: string }>;
}) {
  await requireRole("admin");
  const { q, erreur, supprime } = await searchParams;
  const supabase = await createClient();

  // Lecture avec le client de l'administrateur connecté : c'est la policy
  // "*_admin_all" (public.is_admin()) qui autorise l'accès global, pas la clé
  // service_role — la suppression, elle, l'exige et vit dans l'action serveur.
  let requete = supabase
    .from("profiles")
    // `shops!user_id` lève l'ambiguïté : shops référence profiles deux fois
    // (le propriétaire user_id, et created_by_agent_id). Sans ce repère,
    // PostgREST refuse d'imbriquer, ne sachant par quelle relation.
    .select("id, name, email, phone, role, country_code, is_pro, created_at, shops!user_id(id, name, slug, is_active)")
    .order("created_at", { ascending: false })
    .limit(100);

  const recherche = q?.trim();
  if (recherche) {
    const motif = `%${recherche}%`;
    requete = requete.or(`name.ilike.${motif},email.ilike.${motif},phone.ilike.${motif}`);
  }

  const { data } = await requete;
  const comptes = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/admin">
          <ArrowLeft />
          Administration
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comptes</h1>
        <p className="text-sm text-muted-foreground">
          {recherche
            ? `${comptes.length} résultat${comptes.length > 1 ? "s" : ""} pour « ${recherche} »`
            : "Les 100 comptes les plus récents. Cherchez pour en trouver un plus ancien."}
        </p>
      </div>

      {supprime ? (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Compte supprimé</AlertTitle>
          <AlertDescription>
            Le compte, sa boutique et tout ce qui s&apos;y rattachait ont été effacés.
          </AlertDescription>
        </Alert>
      ) : null}

      {erreur ? (
        <Alert variant="destructive">
          <AlertTitle>Suppression impossible</AlertTitle>
          <AlertDescription>{MESSAGES_ERREUR[erreur] ?? "Action refusée."}</AlertDescription>
        </Alert>
      ) : null}

      <form method="get" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={recherche ?? ""}
            placeholder="Nom, email ou téléphone…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Chercher
        </Button>
      </form>

      {comptes.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {comptes.map((compte) => {
            const boutique = compte.shops?.[0] ?? null;
            const estAdmin = compte.role === "admin";

            return (
              <li
                key={compte.id}
                className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    <span className="truncate">{libelle(compte)}</span>
                    <Badge variant={estAdmin ? "default" : "outline"}>{roleLabel(compte.role)}</Badge>
                    {compte.is_pro ? <Badge variant="secondary">Pro</Badge> : null}
                  </p>

                  <p className="truncate text-sm text-muted-foreground">
                    {compte.email ?? (compte.phone ? formatPhone(compte.phone) : "—")}
                    {compte.country_code ? (
                      <>
                        <span className="mx-1.5">·</span>
                        {compte.country_code}
                      </>
                    ) : null}
                    <span className="mx-1.5">·</span>
                    inscrit le {formatDate(compte.created_at)}
                  </p>

                  {boutique ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm">
                      <Store className="size-3.5 shrink-0 text-muted-foreground" />
                      <Link href={`/${boutique.slug}`} className="truncate font-medium hover:underline">
                        {boutique.name}
                      </Link>
                      {!boutique.is_active ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          masquée
                        </Badge>
                      ) : null}
                      {compte.shops && compte.shops.length > 1 ? (
                        <span className="text-muted-foreground">
                          +{compte.shops.length - 1} autre{compte.shops.length > 2 ? "s" : ""}
                        </span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Aucune boutique</p>
                  )}
                </div>

                <div className="shrink-0">
                  {estAdmin ? (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ShieldCheck className="size-4" />
                      Protégé
                    </span>
                  ) : (
                    <DeleteAccountButton
                      userId={compte.id}
                      label={libelle(compte)}
                      boutique={libelleBoutique(compte.shops)}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              {recherche ? "Aucun compte ne correspond à cette recherche." : "Aucun compte."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
