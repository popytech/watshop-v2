import type { UserRole } from "@/lib/supabase/types";

// Un seul endroit décrit ce que chaque rôle veut dire et où il atterrit après
// connexion. Le rôle vit en base (profiles.role) : il n'est jamais lu depuis le
// client ni déduit d'un secret partagé comme dans le legacy.
export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Vendeur",
  agent: "Agent commercial",
  delivery: "Livreur",
  admin: "Administrateur",
};

// Chaque rôle a son espace : un agent et un livreur n'ont rien à faire dans le
// tableau de bord d'un vendeur, et n'y auraient de toute façon aucune boutique.
export const ROLE_HOME: Record<UserRole, string> = {
  user: "/dashboard",
  agent: "/agent",
  delivery: "/livreur",
  admin: "/admin",
};

export function homePathForRole(role: UserRole): string {
  return ROLE_HOME[role] ?? "/dashboard";
}

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? ROLE_LABELS.user;
}
