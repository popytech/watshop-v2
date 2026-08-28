"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Check, ImagePlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveAppearance } from "@/lib/shop/actions";
import { initialFormState } from "@/lib/shop/state";
import { cn } from "@/lib/utils";

// Palette proposée : le vert de marque en premier, puis des teintes qui
// fonctionnent en aplat sur un bouton avec du texte blanc.
const PRESETS = [
  { value: "#128c4a", label: "Vert Watshop" },
  { value: "#0f766e", label: "Sarcelle" },
  { value: "#1d4ed8", label: "Bleu" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#be123c", label: "Rouge" },
  { value: "#c2410c", label: "Orange" },
  { value: "#a16207", label: "Ocre" },
  { value: "#1f2937", label: "Anthracite" },
];

type Props = {
  currentLogoUrl: string | null;
  defaultColor: string;
  submitLabel?: string;
};

export function AppearanceForm({ currentLogoUrl, defaultColor, submitLabel = "Continuer" }: Props) {
  const [state, action, pending] = useActionState(saveAppearance, initialFormState);
  const [color, setColor] = useState(defaultColor);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);

  return (
    <form action={action}>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="logo">Logo (facultatif)</FieldLabel>
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
              {preview ? (
                // Aperçu local avant envoi : une balise img suffit, next/image
                // ne sait pas optimiser une URL blob.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Aperçu du logo" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-5 text-muted-foreground" />
              )}
            </span>
            <Input
              id="logo"
              name="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="h-11 py-2"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : currentLogoUrl);
              }}
              aria-invalid={Boolean(state.errors?.logo)}
            />
          </div>
          <FieldDescription>JPG, PNG ou WebP, 5 Mo maximum.</FieldDescription>
          <FieldError>{state.errors?.logo}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="primaryColor">Couleur de la boutique</FieldLabel>
          <input type="hidden" name="primaryColor" value={color} />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setColor(preset.value)}
                aria-label={preset.label}
                aria-pressed={color === preset.value}
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg ring-offset-2 ring-offset-background transition-all",
                  color === preset.value ? "ring-2 ring-foreground" : "hover:scale-105",
                )}
                style={{ backgroundColor: preset.value }}
              >
                {color === preset.value ? <Check className="size-4 text-white" /> : null}
              </button>
            ))}
            <Input
              id="primaryColor"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              aria-label="Couleur personnalisée"
              className="size-10 cursor-pointer p-1"
            />
          </div>
          <FieldError>{state.errors?.primaryColor}</FieldError>
        </Field>

        {state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {submitLabel}
          <ArrowRight />
        </Button>
      </FieldGroup>
    </form>
  );
}
