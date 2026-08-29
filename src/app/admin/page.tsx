import Link from "next/link";
import { Store, Package, ShoppingCart, Users, Wallet, BadgeCheck, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Administration — Watshop" };

const TILES = [
  { table: "profiles" as const, label: "Comptes", icon: Users },
  { table: "shops" as const, label: "Boutiques", icon: Store },
  { table: "products" as const, label: "Produits", icon: Package },
  { table: "orders" as const, label: "Commandes", icon: ShoppingCart },
];

export default async function AdminPage() {
  // Lecture avec le client de l'administrateur connecté : c'est la policy
  // "*_admin_all" (public.is_admin()) qui autorise l'accès global, pas la clé
  // service_role. Si le rôle change en base, l'accès change immédiatement.
  const supabase = await createClient();

  const counts = await Promise.all(
    TILES.map(async (tile) => {
      const { count } = await supabase
        .from(tile.table)
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground">
          Accès réservé au rôle administrateur, vérifié à chaque requête.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((tile, index) => (
          <Card key={tile.table} size="sm">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <tile.icon className="size-4" />
                {tile.label}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">{counts[index]}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">À vérifier</CardTitle>
          <CardDescription>
            Les déclarations de virement Mobile Money des vendeurs qui passent en Pro, et les
            comptes qui demandent le rôle d&apos;agent commercial.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link href="/admin/paiements">
              <Wallet />
              Ouvrir les paiements
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link href="/admin/agents">
              <BadgeCheck />
              Valider les agents
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link href="/admin/diffusion">
              <Megaphone />
              Diffuser un message
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">À venir</CardTitle>
          <CardDescription>
            Gestion des comptes et des rôles, vérification des boutiques, diffusion WhatsApp
            (Phase 5). Les écrans se brancheront sur ces mêmes policies : aucune route
            d&apos;administration n&apos;utilise de secret partagé.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
