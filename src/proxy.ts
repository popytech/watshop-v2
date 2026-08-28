import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedPrefixes = ["/dashboard", "/admin"];
const authPages = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Porté depuis l'ancien src/middleware.ts (renommé proxy.ts en Next.js 16).
  if (host === "www.watshop.africa") {
    const url = request.nextUrl.clone();
    url.host = "watshop.africa";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // Phase 6 (reportée) : quand *.watshop.africa sera actif, c'est ici qu'on
  // détectera le sous-domaine et qu'on réécrira l'URL en interne vers
  // /shop/[slug], sans toucher au reste de l'app — voir src/lib/tenant.ts.

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
  // données.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));
  const isAuthPage = authPages.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)"],
};
