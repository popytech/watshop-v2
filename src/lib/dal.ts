import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// verifySession() revalide toujours le JWT auprès de Supabase Auth (getUser(),
// pas getSession()) plutôt que de faire confiance au cookie tel quel — c'est
// la vérification "sécurisée", pas seulement optimiste. cache() évite de la
// répéter plusieurs fois dans un même rendu.
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { userId: user.id, email: user.email ?? null };
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
    redirect("/login");
  }

  return profile;
});

export async function requireRole(...roles: Profile["role"][]) {
  const profile = await getProfile();
  if (!roles.includes(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}
