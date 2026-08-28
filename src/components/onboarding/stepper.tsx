import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export const ONBOARDING_STEPS = [
  { step: 1, label: "Compte" },
  { step: 2, label: "Boutique" },
  { step: 3, label: "Apparence" },
  { step: 4, label: "Produits" },
  { step: 5, label: "WhatsApp" },
  { step: 6, label: "Publication" },
] as const;

/**
 * Six étapes, jamais plus. L'écran doit rester lisible sur un téléphone : les
 * libellés disparaissent sous `sm`, seuls les jalons restent.
 */
export function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Progression de la création">
      {ONBOARDING_STEPS.map(({ step, label }) => {
        const done = step < current;
        const active = step === current;

        return (
          <li key={step} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary/15 text-primary ring-2 ring-primary",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : step}
            </span>
            <span
              className={cn(
                "hidden text-center text-[0.7rem] leading-tight sm:block",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
