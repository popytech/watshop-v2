import type { ReactNode } from "react";

import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { LandingFooter } from "@/components/landing/footer";
import { getCurrentUser } from "@/lib/dal";

/**
 * Enveloppe commune aux pages du marketplace.
 *
 * Groupe de routes : `(marketplace)` n'apparaît pas dans l'URL, les pages
 * restent `/boutiques` et `/produits`. Ces deux segments sont réservés depuis
 * la Phase 0 dans `RESERVED_SLUGS`, aucune boutique ne peut donc les avoir pris.
 */
export default async function MarketplaceLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <MarketplaceHeader connecte={Boolean(user)} />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
