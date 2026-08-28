import "server-only";
import { headers } from "next/headers";

/**
 * URL publique de l'app, utilisée pour construire les redirections OAuth.
 * NEXT_PUBLIC_SITE_URL fait autorité (indispensable derrière un proxy ou sur
 * un domaine personnalisé) ; sinon on retombe sur les en-têtes de la requête.
 */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}
