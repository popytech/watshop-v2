"use client";

import { useActionState, useId } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { initialNewsletterState, subscribeToNewsletter } from "@/lib/newsletter/actions";

/**
 * Inscription à l'infolettre, au pied de page.
 *
 * Le consentement est une case à cocher non pré-remplie : c'est ce qui le rend
 * valable, et le serveur le revérifie plutôt que de faire confiance au
 * navigateur.
 *
 * Le champ « website » est un leurre. Invisible à l'écran et retiré du parcours
 * clavier, un humain ne le remplit jamais ; un robot remplit tout ce qu'il
 * trouve. C'est un filtre sans captcha, donc sans dépendance externe et sans
 * charge pour l'utilisateur.
 */
export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initialNewsletterState);
  const emailId = useId();
  const consentId = useId();

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex gap-2">
        <Input
          id={emailId}
          type="email"
          name="email"
          required
          placeholder="Votre adresse e-mail"
          aria-label="Votre adresse e-mail"
          className="h-10"
        />
        <Button type="submit" disabled={pending} className="h-10 shrink-0">
          {pending ? <Loader2 className="animate-spin" /> : null}
          S&apos;inscrire
        </Button>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id={consentId} name="consent" className="mt-0.5" />
        <label htmlFor={consentId} className="text-xs text-muted-foreground">
          J&apos;accepte de recevoir les nouveautés de Watshop. Désinscription à tout moment.
        </label>
      </div>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {state.message ? (
        <p
          role="status"
          className={`text-xs ${state.ok ? "text-primary" : "text-destructive"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
