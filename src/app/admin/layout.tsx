import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { requireRole } from "@/lib/dal";

// Le back-office est protégé par le rôle stocké en base, vérifié côté serveur.
// Plus de ADMIN_SECRET partagé (et embarqué dans le bundle client) comme dans
// le legacy : il n'existe plus du tout dans le projet.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("admin");

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader profile={profile} home="/admin" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
