import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { requireRole } from "@/lib/dal";

// Espace réservé aux revendeurs : ils poussent les produits des boutiques et
// touchent une commission à la vente. Distinct du programme Agents, qui
// rémunère le recrutement de vendeurs.
export default async function RevendeurLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("reseller", "admin");

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader profile={profile} home="/revendeur" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
