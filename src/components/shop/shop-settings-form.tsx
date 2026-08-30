"use client";

import { useActionState, useState } from "react";
import { Check, ImagePlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { updateShopSettings } from "@/lib/shop/actions";
import { initialFormState } from "@/lib/shop/state";
import { COUNTRIES, getCountry } from "@/lib/phone";
import { slugify } from "@/lib/tenant";
import { cn } from "@/lib/utils";

const PRESETS = ["#128c4a", "#0f766e", "#1d4ed8", "#7c3aed", "#be123c", "#c2410c", "#a16207", "#1f2937"];

type Props = {
  defaultValues: {
    name: string;
    slug: string;
    category: string;
    description: string;
    countryCode: string;
    primaryColor: string;
    phone: string;
    mobileMoney: string;
    logoUrl: string | null;
    coverUrl: string | null;
  };
  siteUrl: string;
};

export function ShopSettingsForm({ defaultValues, siteUrl }: Props) {
  const [state, action, pending] = useActionState(updateShopSettings, initialFormState);
  const [slug, setSlug] = useState(defaultValues.slug);
  const [color, setColor] = useState(defaultValues.primaryColor);
  const [countryCode, setCountryCode] = useState(defaultValues.countryCode);
  const [apercuBanniere, setApercuBanniere] = useState(defaultValues.coverUrl);
  const [preview, setPreview] = useState<string | null>(defaultValues.logoUrl);

  const country = getCountry(countryCode);

  return (
    <form action={action}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="name">Nom de la boutique</FieldLabel>
          <Input
            id="name"
            name="name"
            className="h-11"
            defaultValue={defaultValues.name}
            aria-invalid={Boolean(state.errors?.name)}
            required
          />
          <FieldError>{state.errors?.name}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="slug">Adresse</FieldLabel>
          <Input
            id="slug"
            name="slug"
            className="h-11"
            value={slug}
            onChange={(event) => setSlug(slugify(event.target.value))}
            aria-invalid={Boolean(state.errors?.slug)}
            required
          />
          <FieldDescription>
            Attention : changer l&apos;adresse casse les liens déjà partagés.{" "}
            <span className="font-medium text-foreground">
              {siteUrl.replace(/^https?:\/\//, "")}/{slug || "…"}
            </span>
          </FieldDescription>
          <FieldError>{state.errors?.slug}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="category">Catégorie</FieldLabel>
            <Input
              id="category"
              name="category"
              className="h-11"
              defaultValue={defaultValues.category}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="countryCode">Pays</FieldLabel>
            <Select name="countryCode" value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger id="countryCode" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaultValues.description}
            aria-invalid={Boolean(state.errors?.description)}
          />
          <FieldError>{state.errors?.description}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="logo">Logo</FieldLabel>
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
              {preview ? (
                // Aperçu local avant envoi : next/image ne sait pas optimiser
                // une URL blob.
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
                setPreview(file ? URL.createObjectURL(file) : defaultValues.logoUrl);
              }}
              aria-invalid={Boolean(state.errors?.logo)}
            />
          </div>
          <FieldError>{state.errors?.logo}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="cover">Bannière (facultatif)</FieldLabel>
          {/* Large plutôt que carrée : c'est le fond du bandeau de la vitrine,
              là où le visiteur arrive. Sans elle, le bandeau retombe sur la
              première photo du catalogue, puis sur votre couleur seule. */}
          <div className="flex flex-col gap-3">
            <span className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border bg-muted">
              {apercuBanniere ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={apercuBanniere} alt="Aperçu de la bannière" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-5 text-muted-foreground" />
              )}
            </span>
            <Input
              id="cover"
              name="cover"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="h-11 py-2"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setApercuBanniere(file ? URL.createObjectURL(file) : defaultValues.coverUrl);
              }}
              aria-invalid={Boolean(state.errors?.cover)}
            />
          </div>
          <FieldDescription>
            Une photo large de votre atelier, de votre étal ou d&apos;une pièce phare.
          </FieldDescription>
          <FieldError>{state.errors?.cover}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="primaryColor">Couleur</FieldLabel>
          <input type="hidden" name="primaryColor" value={color} />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                aria-label={`Couleur ${preset}`}
                aria-pressed={color === preset}
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg ring-offset-2 ring-offset-background transition-all",
                  color === preset ? "ring-2 ring-foreground" : "hover:scale-105",
                )}
                style={{ backgroundColor: preset }}
              >
                {color === preset ? <Check className="size-4 text-white" /> : null}
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

        <Field>
          <FieldLabel htmlFor="phone">Numéro WhatsApp</FieldLabel>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            className="h-11"
            placeholder={country.example}
            defaultValue={defaultValues.phone}
            aria-invalid={Boolean(state.errors?.phone)}
            required
          />
          <FieldError>{state.errors?.phone}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="mobileMoney">Numéro Mobile Money (facultatif)</FieldLabel>
          <Input
            id="mobileMoney"
            name="mobileMoney"
            type="tel"
            inputMode="tel"
            className="h-11"
            placeholder={country.example}
            defaultValue={defaultValues.mobileMoney}
            aria-invalid={Boolean(state.errors?.mobileMoney)}
          />
          <FieldError>{state.errors?.mobileMoney}</FieldError>
        </Field>

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
          Enregistrer
        </Button>
      </FieldGroup>
    </form>
  );
}
