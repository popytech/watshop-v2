import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { requireRole } from "@/lib/dal";

// Espace réservé aux livreurs partenaires. Le rôle est vérifié côté serveur ;
// la RLS limite en plus la vue aux seules commandes qui leur sont confiées.
export default async function LivreurLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("delivery", "admin");

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader profile={profile} home="/livreur" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
