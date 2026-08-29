import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedPrefixes = [
  "/dashboard",
  "/admin",
  "/agent",
  "/livreur",
  "/onboarding",
  "/acces-refuse",
];
const authPages = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const path = request.nextUrl.pathname;

  // Porté depuis l'ancien src/middleware.ts (renommé proxy.ts en Next.js 16).
  if (host === "www.watshop.africa") {
    const url = request.nextUrl.clone();
    url.host = "watshop.africa";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // Pas de sous-domaine par boutique : une boutique est un segment de chemin
  // (watshop.africa/maboutique), résolu par le routeur de fichiers. Rien à
  // réécrire ici — voir src/lib/tenant.ts pour les slugs réservés.

  // Les hooks Supabase Auth sont appelés de serveur à serveur, sans cookie :
  // inutile d'y tenter un rafraîchissement de session (ils s'authentifient par
  // signature, voir api/auth/hooks/send-sms).
  if (path.startsWith("/api/auth/hooks")) {
    return NextResponse.next({ request });
  }

  const isProtected = protectedPrefixes.some((prefix) => path.startsWith(prefix));
  const isAuthPage = authPages.some((prefix) => path.startsWith(prefix));

  // La boutique publique est la page la plus vue du produit, et ses visiteurs
  // n'ont pas de compte. Sans cookie de session, il n'y a rien à rafraîchir ni
  // à protéger : on évite un aller-retour vers Supabase Auth à chaque affichage.
  const hasSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (!hasSessionCookie) {
    if (isProtected) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalide le token auprès de Supabase Auth (contrairement à
  // getSession()) — nécessaire ici pour rafraîchir le cookie de session à
  // chaque requête. Ce n'est qu'un contrôle optimiste : la vérification
  // sécurisée reste dans src/lib/dal.ts (verifySession), au plus près des
  // données. Le rôle, lui, n'est jamais vérifié ici : il vit en base et
  // pourrait avoir changé depuis l'émission du jeton.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const url = new URL("/login", request.url);
    // Mémorise la destination pour y revenir après connexion.
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)"],
};
