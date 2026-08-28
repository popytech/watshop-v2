import type { MetadataRoute } from "next";

import { getPublishedShops } from "@/lib/shop/public";
import { getSiteUrl } from "@/lib/site-url";
import { shopPath } from "@/lib/tenant";

// Seules les boutiques publiées ressortent : la RLS s'en charge, la requête
// n'a aucune condition à répéter.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [siteUrl, shops] = await Promise.all([getSiteUrl(), getPublishedShops()]);

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    ...shops.map((shop) => ({
      url: `${siteUrl}${shopPath(shop.slug)}`,
      lastModified: new Date(shop.created_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
