import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { requireRole } from "@/lib/dal";

// Espace réservé aux agents commerciaux. Le rôle est vérifié côté serveur à
// chaque rendu ; un vendeur qui tape l'URL est renvoyé vers /acces-refuse.
export default async function AgentLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("agent", "admin");

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader profile={profile} home="/agent" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
