import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfile, verifySession } from "@/lib/dal";
import { roleLabel } from "@/lib/auth/roles";
import { formatPhone, getCountry } from "@/lib/phone";

export const metadata = { title: "Tableau de bord — Watshop" };

export default async function DashboardPage() {
  const [profile, session] = await Promise.all([getProfile(), verifySession()]);

  const identity = profile.phone
    ? formatPhone(profile.phone.startsWith("+") ? profile.phone : `+${profile.phone}`)
    : (profile.email ?? session.email ?? "—");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {profile.name ?? "👋"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre compte est actif. Le tableau de bord vendeur arrive en Phase 2.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Session vérifiée côté serveur
          </CardTitle>
          <CardDescription>
            Identité confirmée par Supabase Auth à chaque rendu — pas de jeton lisible dans le
            navigateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Identifiant</dt>
              <dd className="font-medium">{identity}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rôle</dt>
              <dd>
                <Badge variant="secondary">{roleLabel(profile.role)}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pays</dt>
              <dd className="font-medium">{getCountry(profile.country_code).name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Formule</dt>
              <dd className="font-medium">{profile.is_pro ? "Pro" : "Gratuite"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prochaine étape — Phase 2</CardTitle>
          <CardDescription>
            Onboarding en 6 étapes (compte → boutique → logo/couleur → produits → WhatsApp →
            publication), gestion des produits et des commandes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/">
              Voir la page d&apos;accueil
              <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
