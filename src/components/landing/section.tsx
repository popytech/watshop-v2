import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Rythme vertical commun à toutes les sections de la page d'accueil. */
export function Section({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("px-4 py-16 sm:py-24", className)} {...props} />;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex max-w-2xl flex-col gap-3 text-center", className)}>
      {eyebrow ? (
        <span className="text-sm font-medium text-brand dark:text-brand-foreground">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {description ? (
        <p className="text-pretty text-muted-foreground sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
