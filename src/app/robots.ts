import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Espaces privés et pages sans intérêt pour un moteur de recherche.
      disallow: ["/dashboard", "/admin", "/onboarding", "/api/", "/login", "/register"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
