import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Connexion impossible — Watshop" };

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ raison?: string }>;
}) {
  const { raison } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Connexion impossible</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Le lien de connexion n&apos;a pas pu être validé. Il a peut-être déjà été utilisé ou a
          expiré.
        </p>
        {raison ? (
          <p className="text-xs text-muted-foreground/80">Détail technique : {raison}</p>
        ) : null}
      </div>
      <Button asChild size="lg" className="h-11">
        <Link href="/login">Réessayer</Link>
      </Button>
    </div>
  );
}
