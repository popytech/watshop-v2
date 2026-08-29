"use client";

import { useActionState, useState } from "react";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitAgentApplication } from "@/lib/network/agent-application";
import { initialFormState } from "@/lib/shop/state";

type Props = {
  defaultValues: {
    city: string;
    neighborhood: string;
    occupation: string;
    motivation: string;
  };
  /** Un dossier déjà envoyé : les pièces restent en place si on n'en renvoie pas. */
  hasPhoto: boolean;
  hasIdDocument: boolean;
};

export function AgentApplicationForm({ defaultValues, hasPhoto, hasIdDocument }: Props) {
  const [state, action, pending] = useActionState(submitAgentApplication, initialFormState);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  return (
    <form action={action}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="photo">Votre photo</FieldLabel>
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
              {photoPreview ? (
                // Aperçu local avant envoi : next/image ne sait pas optimiser
                // une URL blob.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Aperçu" className="size-full object-cover" />
              ) : (
                <UserRound className="size-6 text-muted-foreground" />
              )}
            </span>
            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="h-11 py-2"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPhotoPreview(file ? URL.createObjectURL(file) : null);
              }}
              aria-invalid={Boolean(state.errors?.photo)}
              required={!hasPhoto}
            />
          </div>
          <FieldDescription>
            Une photo de vous, visage dégagé. {hasPhoto ? "Laissez vide pour garder l'actuelle." : ""}
          </FieldDescription>
          <FieldError>{state.errors?.photo}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="idDocument">Pièce d&apos;identité (facultatif)</FieldLabel>
          <Input
            id="idDocument"
            name="idDocument"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="h-11 py-2"
            aria-invalid={Boolean(state.errors?.idDocument)}
          />
          <FieldDescription>
            Carte d&apos;identité, passeport ou permis. {hasIdDocument ? "Déjà fournie. " : ""}
            Accélère la validation.
          </FieldDescription>
          <FieldError>{state.errors?.idDocument}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="city">Ville</FieldLabel>
            <Input
              id="city"
              name="city"
              className="h-11"
              placeholder="Conakry"
              defaultValue={defaultValues.city}
              aria-invalid={Boolean(state.errors?.city)}
              required
            />
            <FieldError>{state.errors?.city}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="neighborhood">Quartier (facultatif)</FieldLabel>
            <Input
              id="neighborhood"
              name="neighborhood"
              className="h-11"
              placeholder="Kaloum"
              defaultValue={defaultValues.neighborhood}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="occupation">Votre activité (facultatif)</FieldLabel>
          <Input
            id="occupation"
            name="occupation"
            className="h-11"
            placeholder="Commerçant au marché Madina"
            defaultValue={defaultValues.occupation}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="motivation">Pourquoi devenir agent Watshop ?</FieldLabel>
          <Textarea
            id="motivation"
            name="motivation"
            rows={4}
            placeholder="Je connais beaucoup de commerçants au marché et je peux les accompagner pour créer leur boutique."
            defaultValue={defaultValues.motivation}
            aria-invalid={Boolean(state.errors?.motivation)}
            required
          />
          <FieldDescription>
            Dites qui vous êtes et comment vous comptez faire inscrire des commerçants.
          </FieldDescription>
          <FieldError>{state.errors?.motivation}</FieldError>
        </Field>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          Vos pièces sont stockées dans un espace privé. Seuls vous et
          l&apos;équipe Watshop pouvez les consulter — elles ne sont jamais accessibles par un
          lien public.
        </p>

        {state.message ? (
          <p
            role="alert"
            className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}
          >
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full sm:w-auto sm:self-start" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Envoyer mon dossier
        </Button>
      </FieldGroup>
    </form>
  );
}
