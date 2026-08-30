"use client";

import { useActionState, useId } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { subscribeToNewsletter } from "@/lib/newsletter/actions";
import { initialNewsletterState } from "@/lib/newsletter/state";

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
    <form action={action} className="flex w-full max-w-sm flex-col gap-2">
      {/* Le champ sur sa ligne, le bouton sous lui. Côte à côte, dans une
          colonne de pied de page, c'est toujours le champ qui rétrécit — le
          bouton, lui, ne peut pas passer sous la largeur de son texte.

          La `key` change une fois l'inscription acceptée : React remonte alors
          le champ, qui repart vide. Sans cela l'adresse resterait affichée sous
          le message de confirmation, et on ne saurait pas si l'envoi a eu
          lieu. */}
      <Input
        key={state.ok ? "envoye" : "saisie"}
        id={emailId}
        type="email"
        name="email"
        required
        placeholder="Votre adresse e-mail"
        aria-label="Votre adresse e-mail"
        className="h-10 w-full"
      />
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? <Loader2 className="animate-spin" /> : null}
        S&apos;inscrire
      </Button>

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
