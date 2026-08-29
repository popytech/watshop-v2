import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Glow } from "@/components/landing/glow";
import { Section } from "@/components/landing/section";

export function Cta({ connecte }: { connecte: boolean }) {
  return (
    <Section className="relative overflow-hidden border-t">
      <Glow variant="center" className="opacity-60" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Votre boutique peut être en ligne
          <br />
          <span className="text-brand dark:text-brand-foreground">avant ce soir.</span>
        </h2>
        <p className="text-pretty text-muted-foreground sm:text-lg">
          Six étapes, votre téléphone, et le lien à partager à vos clients.
        </p>
        <Button asChild size="lg" className="h-12 px-6 text-base">
          <Link href={connecte ? "/dashboard" : "/register"}>
            {connecte ? "Ouvrir mon espace" : "Créer ma boutique gratuitement"}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
