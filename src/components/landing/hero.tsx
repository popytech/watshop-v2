import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Glow } from "@/components/landing/glow";
import { FacebookIcon, InstagramIcon, TiktokIcon } from "@/components/brand/social-icons";
import { formatMoney } from "@/lib/format";

/**
 * Hero.
 *
 * La maquette de boutique n'est pas une image : c'est du HTML, avec les mêmes
 * composants que la vraie vitrine. Elle reste nette sur tous les écrans, pèse
 * quelques octets au lieu de plusieurs centaines de kilos, et ne pourra jamais
 * montrer une interface que le produit n'a plus.
 */
export function Hero({ connecte }: { connecte: boolean }) {
  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
      <Glow variant="above" className="opacity-70" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-5">
          <Badge variant="outline" className="animate-appear opacity-0">
            <MessageCircle className="size-3" />
            Vendre là où vos clients sont déjà
          </Badge>

          <h1 className="animate-appear text-balance text-4xl font-semibold leading-[1.1] tracking-tight opacity-0 [animation-delay:100ms] sm:text-6xl">
            Transformez vos abonnés
            <br />
            en <span className="text-brand dark:text-brand-foreground">clients</span>.
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
        </div>

        {/* Maquette : la carte produit telle qu'un client la voit, et les
            réseaux depuis lesquels il arrive. */}
        <div className="animate-appear-zoom relative w-full max-w-sm opacity-0 [animation-delay:400ms]">
          <div className="rounded-2xl border bg-card p-4 shadow-2xl shadow-brand/10">
            <div className="flex items-center gap-2 pb-3">
              <span className="size-8 rounded-lg bg-brand" />
              <span className="text-sm font-semibold">Fatima Fashion</span>
            </div>

            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-brand/15 to-brand/5">
              <span className="text-5xl">👗</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="text-left">
                <p className="text-sm font-medium">Robe wax</p>
                <p className="text-lg font-semibold">{formatMoney(350_000)}</p>
              </div>
              <span className="flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
                Commander
              </span>
            </div>
          </div>

          <ul className="mt-6 flex items-center justify-center gap-6 text-muted-foreground">
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
      </div>
    </section>
  );
}
