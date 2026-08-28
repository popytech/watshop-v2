import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/auth/roles";

// Retour de la connexion Google (PKCE) : Supabase renvoie un ?code, qu'on
// échange ici contre une session posée en cookie httpOnly.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    const reason = searchParams.get("error_description") ?? "code_absent";
    return NextResponse.redirect(`${origin}/auth/erreur?raison=${encodeURIComponent(reason)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/auth/erreur?raison=${encodeURIComponent(error?.message ?? "échange impossible")}`,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  // On n'accepte que des destinations internes : un ?next=https://… serait une
  // redirection ouverte.
  const destination =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : homePathForRole(profile?.role ?? "user");

  // Derrière le proxy de Vercel, l'origine vue par le serveur n'est pas celle
  // du navigateur : on reconstruit l'URL à partir des en-têtes transmis.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `${forwardedProto}://${forwardedHost}`;

  return NextResponse.redirect(`${base}${destination}`);
}
