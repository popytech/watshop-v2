import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/dal";
import { signOut } from "@/lib/auth/actions";

// Parcours de création de boutique. Protégé comme le reste : getProfile()
// revalide la session côté serveur et renvoie vers /login si elle manque.
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile();

  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
          <Logo href="/dashboard" />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Quitter
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <p className="sr-only">Connecté en tant que {profile.name ?? profile.email ?? profile.phone}</p>
        {children}
      </main>
    </div>
  );
}
