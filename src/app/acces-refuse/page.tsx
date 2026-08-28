import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/dal";
import { homePathForRole, roleLabel } from "@/lib/auth/roles";

export const metadata = { title: "Accès refusé — Watshop" };

export default async function AccessDeniedPage() {
  const profile = await getProfile();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-6" />
      </span>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Accès refusé</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Cette page est réservée à un autre rôle. Vous êtes connecté en tant que{" "}
          <span className="font-medium text-foreground">{roleLabel(profile.role)}</span>.
        </p>
      </div>
      <Button asChild size="lg" className="h-11">
        <Link href={homePathForRole(profile.role)}>Retour à mon espace</Link>
      </Button>
    </div>
  );
}
