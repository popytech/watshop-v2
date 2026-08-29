import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// Faisceau lumineux de Launch UI (MIT) : un dégradé radial appliqué en
// pseudo-élément et agrandi, qui éclaire ce qui se trouve derrière.
const beamVariants = cva(
  "pointer-events-none relative after:absolute after:inset-0 after:scale-[2] after:rounded-full after:content-['']",
  {
    variants: {
      tone: {
        neutral:
          "after:bg-radial after:from-foreground/25 after:from-10% after:to-foreground/0 after:to-60%",
        brand:
          "after:bg-radial after:from-brand/10 after:from-10% after:to-brand/0 after:to-60% dark:after:from-brand/30",
        light:
          "after:bg-radial after:from-brand-foreground/10 after:from-10% after:to-brand-foreground/0 after:to-60% dark:after:from-brand-foreground/30",
      },
    },
    defaultVariants: { tone: "brand" },
  },
);

export function Beam({
  className,
  tone,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof beamVariants>) {
  return <div aria-hidden className={cn(beamVariants({ tone }), className)} {...props} />;
}
