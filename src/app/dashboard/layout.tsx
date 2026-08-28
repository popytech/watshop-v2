import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { getProfile } from "@/lib/dal";

// La vraie protection est ici, pas dans proxy.ts : getProfile() revalide la
// session auprès de Supabase Auth et redirige vers /login si elle est absente
// ou invalide. Chaque page enfant hérite donc d'une identité vérifiée.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader profile={profile} home="/dashboard" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
