import type { UserRole } from "@/lib/supabase/types";

// Un seul endroit décrit ce que chaque rôle veut dire et où il atterrit après
// connexion. Le rôle vit en base (profiles.role) : il n'est jamais lu depuis le
// client ni déduit d'un secret partagé comme dans le legacy.
export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Vendeur",
  agent: "Agent commercial",
  delivery: "Livreur",
  reseller: "Revendeur",
  admin: "Administrateur",
};

// Chaque rôle a son espace : un agent et un livreur n'ont rien à faire dans le
// tableau de bord d'un vendeur, et n'y auraient de toute façon aucune boutique.
export const ROLE_HOME: Record<UserRole, string> = {
  user: "/dashboard",
  agent: "/agent",
  delivery: "/livreur",
  reseller: "/revendeur",
  admin: "/admin",
};

export function homePathForRole(role: UserRole): string {
  return ROLE_HOME[role] ?? "/dashboard";
}

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? ROLE_LABELS.user;
}

/**
 * Les rôles qu'on peut choisir en créant son compte. 'admin' n'y figure pas et
 * ne doit jamais y figurer : le trigger d'inscription applique la même liste
 * blanche côté base, parce que ce choix vient du navigateur.
 */
export const SIGNUP_ROLES = [
  {
    value: "user",
    label: "Vendeur",
    description: "J'ai des produits à vendre et je veux ma boutique.",
  },
  {
    value: "reseller",
    label: "Revendeur",
    description: "Je fais connaître les produits des autres et je touche une commission.",
  },
  {
    value: "agent",
    label: "Agent",
    description: "Je fais inscrire des commerçants sur Watshop.",
  },
  {
    value: "delivery",
    label: "Livreur",
    description: "Je livre les commandes des boutiques.",
  },
] as const satisfies readonly { value: UserRole; label: string; description: string }[];

export type SignupRole = (typeof SIGNUP_ROLES)[number]["value"];
