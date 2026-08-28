import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { DashboardNav } from "@/components/dashboard/nav";
import { getProfile } from "@/lib/dal";
import { requirePublishedShop } from "@/lib/shop/queries";

// La vraie protection est ici, pas dans proxy.ts : getProfile() revalide la
// session auprès de Supabase Auth et redirige vers /login si elle est absente
// ou invalide. requirePublishedShop() renvoie dans l'onboarding tant que la
// boutique n'existe pas ou n'est pas publiée — le tableau de bord n'aurait rien
// à montrer avant.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const [profile] = await Promise.all([getProfile(), requirePublishedShop()]);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader profile={profile} home="/dashboard" />
      <DashboardNav />
      {/* pb-20 : la barre de navigation est fixée en bas sur téléphone, il
          faut lui laisser la place sous le contenu. */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-20 sm:pb-6">{children}</main>
    </div>
  );
}
