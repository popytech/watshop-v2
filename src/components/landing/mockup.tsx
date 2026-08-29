import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// Cadre de maquette de Launch UI (MIT). Deux couches : un cadre épais et
// translucide, et l'écran à l'intérieur. C'est ce qui donne l'impression d'un
// vrai appareil posé sur la page, sans la moindre image.
const mockupVariants = cva(
  "relative z-10 flex overflow-hidden border border-border/70 shadow-2xl dark:border-border/5 dark:border-t-border/15",
  {
    variants: {
      type: {
        mobile: "max-w-[350px] rounded-[2.5rem]",
        responsive: "rounded-md",
      },
    },
    defaultVariants: { type: "responsive" },
  },
);

export function Mockup({
  className,
  type,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof mockupVariants>) {
  return <div className={cn(mockupVariants({ type }), className)} {...props} />;
}

const frameVariants = cva(
  "relative z-10 flex overflow-hidden rounded-2xl bg-border/50 dark:bg-border/10",
  {
    variants: {
      size: { small: "p-2", large: "p-4" },
    },
    defaultVariants: { size: "small" },
  },
);

export function MockupFrame({
  className,
  size,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof frameVariants>) {
  return <div className={cn(frameVariants({ size }), className)} {...props} />;
}
