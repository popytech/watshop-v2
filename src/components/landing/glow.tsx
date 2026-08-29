import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// Lueur d'arrière-plan, adaptée de Launch UI (MIT) et recalée sur le vert
// Watshop. Deux dégradés radiaux superposés, aucun JavaScript : c'est ce qui
// permet d'avoir un rendu premium sans peser sur une connexion 3G.
const glowVariants = cva("pointer-events-none absolute w-full", {
  variants: {
    variant: {
      top: "top-0",
      above: "-top-32",
      bottom: "bottom-0",
      below: "-bottom-32",
      center: "top-1/2",
    },
  },
  defaultVariants: { variant: "top" },
});

export function Glow({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof glowVariants>) {
  return (
    <div aria-hidden className={cn(glowVariants({ variant }), className)} {...props}>
      <div
        className={cn(
          "absolute left-1/2 h-64 w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-radial from-brand-foreground/40 from-10% to-brand-foreground/0 to-60% opacity-25 sm:h-[32rem] dark:opacity-100",
          variant === "center" && "-translate-y-1/2",
        )}
      />
      <div
        className={cn(
          "absolute left-1/2 h-32 w-[40%] -translate-x-1/2 scale-[2] rounded-[50%] bg-radial from-brand/30 from-10% to-brand/0 to-60% opacity-25 sm:h-64 dark:opacity-100",
          variant === "center" && "-translate-y-1/2",
        )}
      />
    </div>
  );
}
