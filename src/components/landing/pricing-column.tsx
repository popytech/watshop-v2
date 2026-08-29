import { cva, type VariantProps } from "class-variance-authority";
import { CircleCheckBig, Clock } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Colonne de tarif de Launch UI (MIT), portée telle quelle.
 *
 * Ce qui fait son allure et que je n'avais pas su reproduire à la main :
 *   - un trait dégradé en haut de la carte, transparent aux extrémités ;
 *   - une lueur floutée en pseudo-élément, posée au-dessus de la carte et
 *     rognée par overflow-hidden, qui éclaire son bord supérieur ;
 *   - les surfaces de verre glass-1 à glass-4, différentes en clair et en
 *     sombre.
 *
 * Adaptations : le prix est en francs guinéens et suffixé, pas en dollars
 * préfixés ; la variante « glow » du bouton d'origine n'existe pas dans nos
 * primitives, on utilise les nôtres.
 */
const pricingColumnVariants = cva(
  "relative flex flex-col gap-6 overflow-hidden rounded-2xl p-8 shadow-xl",
  {
    variants: {
      variant: {
        default: "glass-1 to-transparent dark:glass-3",
        glow: "glass-2 to-transparent dark:glass-3 after:absolute after:-top-32 after:left-1/2 after:h-32 after:w-full after:max-w-[60rem] after:-translate-x-1/2 after:rounded-[50%] after:blur-[72px] after:content-[''] dark:after:bg-foreground/30",
        "glow-brand":
          "glass-3 from-card to-card dark:glass-4 after:absolute after:-top-32 after:left-1/2 after:h-32 after:w-full after:max-w-[60rem] after:-translate-x-1/2 after:rounded-[50%] after:bg-brand-foreground/70 after:blur-[72px] after:content-['']",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type PricingColumnProps = ComponentProps<"div"> &
  VariantProps<typeof pricingColumnVariants> & {
    name: string;
    icon?: ReactNode;
    description: string;
    /** Déjà formaté, devise comprise. */
    price: string;
    priceNote: string;
    cta: { label: string; href: string };
    features: string[];
    /** Sous-ensemble de `features` annoncé comme pas encore disponible. */
    upcoming?: string[];
  };

export function PricingColumn({
  name,
  icon,
  description,
  price,
  priceNote,
  cta,
  features,
  upcoming = [],
  variant,
  className,
  ...props
}: PricingColumnProps) {
  return (
    <div className={cn(pricingColumnVariants({ variant }), className)} {...props}>
      <hr
        className={cn(
          "absolute top-0 left-[10%] h-px w-[80%] border-0 bg-linear-to-r from-transparent via-foreground/60 to-transparent",
          variant === "glow-brand" && "via-brand",
        )}
      />

      <div className="flex flex-col gap-7">
        <header className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 font-bold">
            {icon ? <span className="flex items-center text-muted-foreground">{icon}</span> : null}
            {name}
          </h3>
          <p className="max-w-56 text-sm text-muted-foreground">{description}</p>
        </header>

        <section className="flex flex-col gap-3">
          <p className="text-4xl font-bold tracking-tight">{price}</p>
          <p className="min-h-10 text-sm text-muted-foreground">{priceNote}</p>
        </section>

        <Button asChild size="lg" variant={variant === "default" ? "outline" : "default"}>
          <Link href={cta.href}>{cta.label}</Link>
        </Button>

        <hr className="border-input" />
      </div>

      <ul className="flex flex-col gap-2">
        {features.map((feature) => {
          const aVenir = upcoming.includes(feature);

          return (
            <li key={feature} className="flex items-center gap-2 text-sm">
              {aVenir ? (
                <Clock className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <CircleCheckBig className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className={aVenir ? "text-muted-foreground" : undefined}>
                {feature}
                {aVenir ? " (bientôt)" : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
