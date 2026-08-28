import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Data Access Layer : tout accès à l'identité de l'utilisateur passe par ici.
// C'est le point où l'autorisation est *réellement* vérifiée — proxy.ts ne fait
// qu'un contrôle optimiste sur le cookie pour éviter un rendu inutile.
// (Dans le legacy, la protection n'existait qu'au niveau des routes API, et
// plusieurs d'entre elles ne vérifiaient rien du tout.)

/**
 * Utilisateur courant, ou null. Ne redirige pas : pour les pages publiques qui
 * s'adaptent selon qu'on est connecté ou non.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

/**
 * Exige une session valide. getUser() revalide le JWT auprès de Supabase Auth
 * (contrairement à getSession(), qui fait confiance au cookie tel quel).
 * cache() évite de refaire la vérification plusieurs fois dans un même rendu.
 */
export const verifySession = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return { userId: user.id, email: user.email ?? null, phone: user.phone ?? null };
});

export const getProfile = cache(async (): Promise<Profile> => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.userId)
    .single();

  if (error || !profile) {
    // Session valide mais profil introuvable : compte incohérent, on repart
    // d'une page propre plutôt que de rendre un écran à moitié cassé.
    redirect("/login");
  }

  return profile;
});

/**
 * Exige un des rôles donnés. Renvoie le profil pour éviter une seconde requête
 * dans la page appelante.
 */
export async function requireRole(...roles: UserRole[]): Promise<Profile> {
  const profile = await getProfile();

  if (!roles.includes(profile.role)) {
    redirect("/acces-refuse");
  }

  return profile;
}
