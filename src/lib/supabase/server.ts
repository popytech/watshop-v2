import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Peut échouer si appelé depuis un Server Component (pas de Route
          // Handler/Server Action) : sans effet ici, la session est rafraîchie
          // dans proxy.ts qui, lui, peut écrire des cookies sur chaque requête.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // ignoré volontairement, voir commentaire ci-dessus
          }
        },
      },
    },
  );
}
