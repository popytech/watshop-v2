import type { Metadata } from "next";

import { LandingNav } from "@/components/landing/landing-nav";
import { LayoutLines } from "@/components/landing/layout-lines";
import { Hero } from "@/components/landing/hero";
import { Steps } from "@/components/landing/steps";
import { Shops } from "@/components/landing/shops";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { Cta } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";
import { getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Watshop — vendez sur WhatsApp, sans commission",
  description:
    "Créez votre boutique en ligne, partagez vos produits sur WhatsApp et recevez vos commandes. Gratuit, sans commission sur vos ventes.",
  openGraph: {
    title: "Watshop — vendez sur WhatsApp",
    description:
      "La boutique en ligne des commerçants africains. Créez la vôtre en quelques minutes.",
    type: "website",
  },
};

/**
 * Page d'accueil publique.
 *
 * Structure et effets visuels adaptés de Launch UI (MIT) : lueurs, apparitions
 * en fondu, rythme des sections. Deux différences volontaires :
 *   - les composants de base restent les nôtres (shadcn v4), sinon le reste de
 *     l'application casserait ;
 *   - aucune librairie d'animation JavaScript. Tout est en CSS, parce que la
 *     moitié des visiteurs arrivera sur un Android en 3G avec un forfait data
 *     compté.
 */
export default async function Home() {
  const user = await getCurrentUser();
  const connecte = Boolean(user);

  return (
    <div className="relative flex flex-1 flex-col">
      <LayoutLines />
      <LandingNav connecte={connecte} />

      <main className="relative flex-1">
        <Hero connecte={connecte} />

        <div id="fonctionnement">
          <Steps />
        </div>

        <div id="boutiques">
          <Shops />
        </div>

        <div id="tarifs">
          <Pricing />
        </div>

        <div id="questions">
          <Faq />
        </div>

        <Cta connecte={connecte} />
      </main>

      <LandingFooter />
    </div>
  );
}
