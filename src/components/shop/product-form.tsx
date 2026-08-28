"use client";

import { useActionState, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState, type FormState } from "@/lib/shop/state";

export type ProductFormValues = {
  name: string;
  price: string;
  promoPrice: string;
  quantity: string;
  sizes: string;
  description: string;
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<ProductFormValues>;
  productId?: string;
  submitLabel: string;
  currency: string;
};

const MAX_IMAGES = 4;

export function ProductForm({
  action,
  defaultValues = {},
  productId,
  submitLabel,
  currency,
}: Props) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [previews, setPreviews] = useState<string[]>([]);

  return (
    <form action={formAction}>
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="name">Nom du produit</FieldLabel>
          <Input
            id="name"
            name="name"
            className="h-11"
            placeholder="Robe africaine"
            defaultValue={defaultValues.name}
            aria-invalid={Boolean(state.errors?.name)}
            required
          />
          <FieldError>{state.errors?.name}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="price">Prix ({currency})</FieldLabel>
            <Input
              id="price"
              name="price"
              inputMode="numeric"
              className="h-11"
              placeholder="350000"
              defaultValue={defaultValues.price}
              aria-invalid={Boolean(state.errors?.price)}
              required
            />
            <FieldError>{state.errors?.price}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="promoPrice">Prix promo (facultatif)</FieldLabel>
            <Input
              id="promoPrice"
              name="promoPrice"
              inputMode="numeric"
              className="h-11"
              placeholder="299000"
              defaultValue={defaultValues.promoPrice}
              aria-invalid={Boolean(state.errors?.promoPrice)}
            />
            <FieldError>{state.errors?.promoPrice}</FieldError>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="quantity">Quantité en stock</FieldLabel>
            <Input
              id="quantity"
              name="quantity"
              inputMode="numeric"
              className="h-11"
              placeholder="10"
              defaultValue={defaultValues.quantity ?? "0"}
              aria-invalid={Boolean(state.errors?.quantity)}
            />
            <FieldError>{state.errors?.quantity}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="sizes">Tailles (facultatif)</FieldLabel>
            <Input
              id="sizes"
              name="sizes"
              className="h-11"
              placeholder="S, M, L, XL"
              defaultValue={defaultValues.sizes}
            />
            <FieldDescription>Séparez par des virgules.</FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="images">Photos</FieldLabel>
          <Input
            id="images"
            name="images"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="h-11 py-2"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []).slice(0, MAX_IMAGES);
              setPreviews(files.map((file) => URL.createObjectURL(file)));
            }}
          />
          <FieldDescription>
            Jusqu&apos;à {MAX_IMAGES} photos, 5 Mo chacune. La première sera la photo principale.
          </FieldDescription>
          {previews.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {previews.map((src, index) => (
                <li
                  key={src}
                  className="flex size-16 items-center justify-center overflow-hidden rounded-lg border bg-muted"
                >
                  {/* Aperçu local avant envoi : next/image ne sait pas
                      optimiser une URL blob. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Aperçu ${index + 1}`}
                    className="size-full object-cover"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ImagePlus className="size-4" />
              Aucune photo sélectionnée
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description (facultatif)</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Tissu wax, coupe ajustée, fabriqué à Conakry."
            defaultValue={defaultValues.description}
            aria-invalid={Boolean(state.errors?.description)}
          />
          <FieldError>{state.errors?.description}</FieldError>
        </Field>

        {state.message ? (
          <p
            role="alert"
            className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}
          >
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
