import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Glow } from "@/components/landing/glow";
import { HeroShowcase } from "@/components/landing/hero-showcase";
import { FacebookIcon, InstagramIcon, TiktokIcon } from "@/components/brand/social-icons";

/**
 * Hero.
 *
 * Reprend la composition de Launch UI : titre en dégradé, maquettes dans leurs
 * cadres translucides, lueur qui déborde par le bas, et fondu du bord inférieur
 * pour que la section se fonde dans la suivante.
 *
 * Les deux écrans montrent les deux faces du produit : le vendeur qui suit ses
 * commandes, le client qui achète. C'est ce que Watshop fait, dit en une image.
 */
export function Hero({ connecte }: { connecte: boolean }) {
  return (
    <section className="fade-bottom relative overflow-hidden px-4 pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 pt-12 sm:gap-20 sm:pt-20">
        <div className="flex flex-col items-center gap-6 text-center">
          <Badge variant="outline" className="animate-appear opacity-0">
            <MessageCircle className="size-3" />
            Vendre là où vos clients sont déjà
          </Badge>

          <h1 className="animate-appear relative z-10 inline-block bg-linear-to-r from-foreground to-foreground bg-clip-text text-4xl leading-tight font-semibold text-balance text-transparent drop-shadow-2xl opacity-0 [animation-delay:100ms] sm:text-6xl sm:leading-tight md:text-7xl md:leading-tight dark:to-muted-foreground">
            Transformez vos abonnés
            <br />
            en clients.
          </h1>

          <p className="animate-appear max-w-xl text-pretty text-muted-foreground opacity-0 [animation-delay:200ms] sm:text-lg">
            Créez votre boutique en ligne, partagez vos produits sur WhatsApp et commencez à
            vendre. Sans site à construire, sans commission sur vos ventes.
          </p>

          <div className="animate-appear flex flex-col gap-3 opacity-0 [animation-delay:300ms] sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link href={connecte ? "/dashboard" : "/register"}>
                {connecte ? "Ouvrir mon espace" : "Créer ma boutique gratuitement"}
                <ArrowRight />
              </Link>
            </Button>
            {connecte ? null : (
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                <Link href="/login">J&apos;ai déjà un compte</Link>
              </Button>
            )}
          </div>

          <ul className="animate-appear flex items-center gap-6 pt-2 text-muted-foreground opacity-0 [animation-delay:400ms]">
            <li className="flex flex-col items-center gap-1.5">
              <MessageCircle className="size-5" />
              <span className="text-xs">WhatsApp</span>
            </li>
            <li className="flex flex-col items-center gap-1.5">
              <InstagramIcon className="size-5" />
              <span className="text-xs">Instagram</span>
            </li>
            <li className="flex flex-col items-center gap-1.5">
              <FacebookIcon className="size-5" />
              <span className="text-xs">Facebook</span>
            </li>
            <li className="flex flex-col items-center gap-1.5">
              <TiktokIcon className="size-5" />
              <span className="text-xs">TikTok</span>
            </li>
          </ul>
        </div>

        <div className="relative w-full pb-12 sm:pb-20">
          <HeroShowcase />

          <Glow
            variant="below"
            className="animate-appear-zoom opacity-0 [animation-delay:800ms]"
          />
        </div>
      </div>
    </section>
  );
}
