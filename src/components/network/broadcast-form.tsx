"use client";

import { useActionState, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { broadcast } from "@/lib/push/broadcast";
import { initialFormState } from "@/lib/shop/state";

type Props = { counts: { all: number; pro: number; published: number } };

export function BroadcastForm({ counts }: Props) {
  const [state, action, pending] = useActionState(broadcast, initialFormState);
  const [audience, setAudience] = useState<"published" | "pro" | "all">("published");

  const cibles = { published: counts.published, pro: counts.pro, all: counts.all };

  return (
    <form action={action}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="audience">À qui</FieldLabel>
          <Select
            name="audience"
            value={audience}
            onValueChange={(v) => setAudience(v as typeof audience)}
          >
            <SelectTrigger id="audience" className="h-11 w-full sm:max-w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="published">
                Boutiques publiées ({counts.published})
              </SelectItem>
              <SelectItem value="pro">Vendeurs Pro ({counts.pro})</SelectItem>
              <SelectItem value="all">Tous les vendeurs ({counts.all})</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>
            {cibles[audience]} destinataire{cibles[audience] > 1 ? "s" : ""}.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Par quel canal</FieldLabel>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="channels" value="push" defaultChecked />
              Notification dans l&apos;application
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="channels" value="whatsapp" />
              WhatsApp (consomme le quota Fonnte)
            </label>
          </div>
          <FieldError>{state.errors?.channels}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="title">Titre</FieldLabel>
          <Input
            id="title"
            name="title"
            className="h-11"
            placeholder="Nouveauté sur Watshop"
            aria-invalid={Boolean(state.errors?.title)}
            required
          />
          <FieldError>{state.errors?.title}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="message">Message</FieldLabel>
          <Textarea
            id="message"
            name="message"
            rows={5}
            placeholder="Vous pouvez maintenant confier vos commandes à un livreur depuis votre tableau de bord."
            aria-invalid={Boolean(state.errors?.message)}
            required
          />
          <FieldDescription>600 caractères maximum.</FieldDescription>
          <FieldError>{state.errors?.message}</FieldError>
        </Field>

        {state.message ? (
          <p
            role="alert"
            className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}
          >
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 sm:self-start" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          Envoyer à {cibles[audience]} vendeur{cibles[audience] > 1 ? "s" : ""}
        </Button>
      </FieldGroup>
    </form>
  );
}
