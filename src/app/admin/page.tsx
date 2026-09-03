import Link from "next/link";
import {
  BadgeCheck,
  Megaphone,
  Package,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Administration — Watshop" };

const TUILES = [
  { table: "profiles" as const, label: "Comptes", icon: Users, href: "/admin/comptes" },
  { table: "shops" as const, label: "Boutiques", icon: Store, href: "/admin/comptes" },
  { table: "products" as const, label: "Produits", icon: Package, href: null },
  { table: "orders" as const, label: "Commandes", icon: ShoppingCart, href: null },
];

export default async function AdminPage() {
  // Lecture avec le client de l'administrateur connecté : c'est la policy
  // "*_admin_all" (public.is_admin()) qui autorise l'accès global, pas la clé
  // service_role. Si le rôle change en base, l'accès change immédiatement.
  const supabase = await createClient();

  const [comptes, paiements, agents] = await Promise.all([
    Promise.all(
      TUILES.map(async (tuile) => {
        const { count } = await supabase
          .from(tuile.table)
          .select("*", { count: "exact", head: true });
        return count ?? 0;
      }),
    ),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("agent_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const enAttente = [
    {
      compte: paiements.count ?? 0,
      href: "/admin/paiements",
      icon: Wallet,
      singulier: "virement Mobile Money déclaré, à confirmer",
      pluriel: "virements Mobile Money déclarés, à confirmer",
      action: "Ouvrir les paiements",
    },
    {
      compte: agents.count ?? 0,
      href: "/admin/agents",
      icon: BadgeCheck,
      singulier: "candidature d'agent commercial à examiner",
      pluriel: "candidatures d'agent commercial à examiner",
      action: "Valider les agents",
    },
  ].filter((item) => item.compte > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Accès réservé au rôle administrateur, vérifié à chaque requête.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TUILES.map((tuile, index) => {
          const carte = (
            <Card
              size="sm"
              className={
                tuile.href ? "h-full transition-colors hover:border-primary/40 hover:bg-accent/40" : undefined
              }
            >
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <tuile.icon className="size-4" />
                  {tuile.label}
                </CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatNumber(comptes[index])}
                </CardTitle>
              </CardHeader>
            </Card>
          );

          // Comptes et Boutiques mènent à l'écran de gestion ; les deux autres
          // ne sont pour l'instant que des compteurs.
          return tuile.href ? (
            <Link key={tuile.table} href={tuile.href}>
              {carte}
            </Link>
          ) : (
            <div key={tuile.table}>{carte}</div>
          );
        })}
      </div>

      {/* Les raccourcis de navigation qui étaient ici ont disparu : la barre de
          gauche les porte désormais, avec le compte en attente sur chacun. Ne
          reste donc que ce qui demande vraiment une décision — et rien quand il
          n'y a rien, une carte « À vérifier » toujours vide apprenant surtout à
          ne plus la regarder. */}
      {enAttente.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">À vérifier</CardTitle>
            <CardDescription>Ce qui attend une décision de votre part.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {enAttente.map((item) => (
              <div
                key={item.href}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <p className="flex items-center gap-2 text-sm">
                  <item.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="font-semibold tabular-nums">{formatNumber(item.compte)}</span>{" "}
                    {item.compte > 1 ? item.pluriel : item.singulier}
                  </span>
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={item.href}>{item.action}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rien en attente</CardTitle>
            <CardDescription>
              Aucun virement à confirmer, aucune candidature d&apos;agent à examiner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/diffusion">
                <Megaphone />
                Diffuser un message
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
