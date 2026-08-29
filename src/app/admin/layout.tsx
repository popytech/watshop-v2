import type { ReactNode } from "react";

import { AdminSidebar, type AdminBadges } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

// Le back-office est protégé par le rôle stocké en base, vérifié côté serveur.
// Plus de ADMIN_SECRET partagé (et embarqué dans le bundle client) comme dans
// le legacy : il n'existe plus du tout dans le projet.
//
// La navigation passe d'un simple en-tête à une barre latérale repliable : les
// quatre écrans du back-office se répondent, et sauter de l'un à l'autre ne
// devrait pas demander de revenir au tableau de bord.

/**
 * Ce qui attend une décision, compté à chaque affichage.
 *
 * Deux comptes seuls, sans ramener de ligne. Les lectures passent par le client
 * de l'administrateur connecté : c'est la policy `*_admin_all`
 * (`public.is_admin()`) qui autorise l'accès global, pas la clé service_role. Si
 * le rôle change en base, l'accès change immédiatement.
 */
async function getBadges(): Promise<AdminBadges> {
  const supabase = await createClient();

  const [paiements, agents] = await Promise.all([
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("agent_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return { paiements: paiements.count ?? 0, agents: agents.count ?? 0 };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("admin");
  const badges = await getBadges();

  return (
    <SidebarProvider>
      <AdminSidebar profile={profile} badges={badges} />

      <SidebarInset>
        {/* En-tête collant : sur téléphone la barre latérale devient un tiroir,
            et sans ce bouton il n'y aurait aucun moyen de l'ouvrir. */}
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium">Administration</span>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
