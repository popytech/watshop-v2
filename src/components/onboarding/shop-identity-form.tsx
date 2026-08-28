"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

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
import { saveShopIdentity } from "@/lib/shop/actions";
import { initialFormState } from "@/lib/shop/state";
import { COUNTRIES } from "@/lib/phone";
import { slugify } from "@/lib/tenant";

const CATEGORIES = [
  "Mode & vêtements",
  "Beauté & cosmétiques",
  "Alimentation",
  "Électronique",
  "Maison & décoration",
  "Enfants & bébé",
  "Services",
  "Autre",
];

type Props = {
  defaultValues: {
    name: string;
    slug: string;
    category: string;
    description: string;
    countryCode: string;
  };
  siteUrl: string;
};

export function ShopIdentityForm({ defaultValues, siteUrl }: Props) {
  const [state, action, pending] = useActionState(saveShopIdentity, initialFormState);
  const [name, setName] = useState(defaultValues.name);
  const [slug, setSlug] = useState(defaultValues.slug);
  // Le slug suit le nom tant que le vendeur ne l'a pas retouché lui-même.
  const [slugEdited, setSlugEdited] = useState(Boolean(defaultValues.slug));

  const effectiveSlug = slugEdited ? slug : slugify(name);

  return (
    <form action={action}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="name">Nom de la boutique</FieldLabel>
          <Input
            id="name"
            name="name"
            className="h-11"
            placeholder="Chez Mariama"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(state.errors?.name)}
            required
          />
          <FieldError>{state.errors?.name}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="slug">Adresse de la boutique</FieldLabel>
          <Input
            id="slug"
            name="slug"
            className="h-11"
            placeholder="chez-mariama"
            value={effectiveSlug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(slugify(event.target.value));
            }}
            aria-invalid={Boolean(state.errors?.slug)}
            required
          />
          <FieldDescription>
            Vos clients y accéderont via{" "}
            <span className="font-medium text-foreground">
              {siteUrl.replace(/^https?:\/\//, "")}/{effectiveSlug || "…"}
            </span>
          </FieldDescription>
          <FieldError>{state.errors?.slug}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="category">Catégorie</FieldLabel>
          <Select name="category" defaultValue={defaultValues.category || undefined}>
            <SelectTrigger id="category" className="h-11 w-full">
              <SelectValue placeholder="Que vendez-vous ?" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{state.errors?.category}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="countryCode">Pays</FieldLabel>
          <Select name="countryCode" defaultValue={defaultValues.countryCode}>
            <SelectTrigger id="countryCode" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description (facultatif)</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Vêtements africains faits main, livraison à Conakry."
            defaultValue={defaultValues.description}
            aria-invalid={Boolean(state.errors?.description)}
          />
          <FieldError>{state.errors?.description}</FieldError>
        </Field>

        {state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Continuer
          <ArrowRight />
        </Button>
      </FieldGroup>
    </form>
  );
}
