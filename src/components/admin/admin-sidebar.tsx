"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, LayoutDashboard, LogOut, Megaphone, Store, Users, Wallet } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { signOut } from "@/lib/auth/actions";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Ce qui attend une décision de l'administrateur, compté en base. */
export type AdminBadges = {
  paiements: number;
  agents: number;
};

const LIENS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, badge: null },
  { href: "/admin/comptes", label: "Comptes", icon: Users, badge: null },
  { href: "/admin/paiements", label: "Paiements", icon: Wallet, badge: "paiements" },
  { href: "/admin/agents", label: "Agents", icon: BadgeCheck, badge: "agents" },
  { href: "/admin/diffusion", label: "Diffusion", icon: Megaphone, badge: null },
] as const;

function initiales(profile: Profile): string {
  const source = profile.name ?? profile.email ?? profile.phone ?? "?";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Barre latérale de l'administration, repliable en colonne d'icônes.
 *
 * Bâtie sur le composant `sidebar` de shadcn, déjà installé : il gère le repli,
 * le raccourci clavier, le passage en tiroir sur téléphone, et retient l'état
 * dans un cookie — donc d'une visite à l'autre.
 *
 * Les pastilles ne sont pas décoratives : elles comptent ce qui attend
 * réellement une décision, un virement déclaré et une candidature d'agent. Un
 * administrateur voit ce qu'il a à faire sans ouvrir les quatre écrans.
 */
export function AdminSidebar({
  profile,
  badges,
}: {
  profile: Profile;
  badges: AdminBadges;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Watshop">
              <Link href="/admin">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Store className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Watshop</span>
                  <span className="text-xs text-muted-foreground">Administration</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Back-office</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {LIENS.map((lien) => {
                // Comparaison exacte : sans elle, /admin serait actif sur les
                // quatre écrans, puisqu'il préfixe tous les autres.
                const actif = pathname === lien.href;
                const compte = lien.badge ? badges[lien.badge] : 0;

                return (
                  <SidebarMenuItem key={lien.href}>
                    <SidebarMenuButton asChild isActive={actif} tooltip={lien.label}>
                      <Link href={lien.href}>
                        <lien.icon />
                        <span>{lien.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {compte > 0 ? <SidebarMenuBadge>{compte}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Le site</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Voir les boutiques">
                  <Link href="/boutiques">
                    <Store />
                    <span>Voir les boutiques</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={profile.name ?? "Mon compte"}>
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={profile.avatar_url ?? undefined} alt="" />
                <AvatarFallback className="rounded-lg">{initiales(profile)}</AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-col gap-0.5 leading-none">
                <span className="truncate font-medium">{profile.name ?? "Administrateur"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {profile.email ?? profile.phone}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Masqué en mode icônes : deux boutons côte à côte n'y tiendraient
            pas, et le repli sert justement à récupérer cette largeur. */}
        <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
          <ThemeToggle />
          <form action={signOut} className="flex-1">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              <LogOut />
              Déconnexion
            </Button>
          </form>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
