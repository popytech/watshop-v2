import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Client "service_role" : contourne RLS, ne doit JAMAIS être importé depuis un
// Client Component. Le import "server-only" ci-dessus fait échouer le build
// si c'est le cas — c'est précisément le bug qui exposait ADMIN_SECRET côté
// client dans le projet legacy (src/app/admin/page.tsx).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
