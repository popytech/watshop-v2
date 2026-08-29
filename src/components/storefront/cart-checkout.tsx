"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { ImageOff, Loader2, Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrder } from "@/lib/order/actions";
import { initialCheckoutState } from "@/lib/order/state";
import { useCart } from "@/lib/cart/use-cart";
import { readAffiliateRef } from "@/lib/affiliate/ref";
import { formatMoney } from "@/lib/format";
import { getCountry } from "@/lib/phone";

type Zone = { id: string; zone_name: string; price: number; free_above: number | null };

type Props = {
  shopSlug: string;
  shopName: string;
  currency: string;
  countryCode: string;
  zones: Zone[];
  source: "storefront" | "whatsapp";
};

export function CartCheckout({
  shopSlug,
  shopName,
  currency,
  countryCode,
  zones,
  source,
}: Props) {
  const { items, subtotal, setQuantity, remove } = useCart(shopSlug);
  const [state, action, pending] = useActionState(createOrder, initialCheckoutState);
  const country = getCountry(countryCode);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="text-sm text-muted-foreground">
            Votre panier est vide.
          </p>
          <Button asChild size="lg" className="h-11">
            <Link href={`/${shopSlug}`}>Voir les produits</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votre panier</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {items.map((line) => (
              <li key={`${line.productId}-${line.size ?? ""}`} className="flex gap-3">
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt={line.name}
                      width={64}
                      height={64}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageOff className="size-4 text-muted-foreground" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.name}</p>
                  {line.size ? (
                    <p className="text-sm text-muted-foreground">Taille {line.size}</p>
                  ) : null}
                  <p className="text-sm tabular-nums">
                    {formatMoney(line.unitPrice * line.quantity, currency)}
                  </p>

                  <div className="mt-1.5 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Diminuer la quantité"
                      onClick={() =>
                        setQuantity(line.productId, line.size, line.quantity - 1)
                      }
                    >
                      <Minus />
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Augmenter la quantité"
                      onClick={() =>
                        setQuantity(line.productId, line.size, line.quantity + 1)
                      }
                    >
                      <Plus />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Retirer ${line.name}`}
                      onClick={() => remove(line.productId, line.size)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Separator />

          <div className="flex items-baseline justify-between font-medium">
            <span>Sous-total</span>
            <span className="tabular-nums">{formatMoney(subtotal, currency)}</span>
          </div>
          {zones.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Les frais de livraison s&apos;ajoutent selon la zone choisie ci-dessous.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vos coordonnées</CardTitle>
          <CardDescription>
            {shopName} vous contactera sur WhatsApp pour confirmer la commande.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <input type="hidden" name="shopSlug" value={shopSlug} />
            <input type="hidden" name="source" value={source} />
            {/* Code revendeur mémorisé à l'arrivée sur la boutique : il donne
                droit à sa commission si la commande aboutit. */}
            <input type="hidden" name="affiliateCode" value={readAffiliateRef(shopSlug) ?? ""} />
            <input type="hidden" name="countryCode" value={countryCode} />
            {/* Le panier part en JSON ; le serveur relit les prix en base et
                ignore ceux affichés ici. */}
            <input
              type="hidden"
              name="items"
              value={JSON.stringify(
                items.map((line) => ({
                  productId: line.productId,
                  quantity: line.quantity,
                  size: line.size,
                })),
              )}
            />

            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="customerName">Votre nom</FieldLabel>
                <Input
                  id="customerName"
                  name="customerName"
                  className="h-11"
                  autoComplete="name"
                  placeholder="Aissatou Diallo"
                  aria-invalid={Boolean(state.errors?.customerName)}
                  required
                />
                <FieldError>{state.errors?.customerName}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="customerPhone">Téléphone (WhatsApp)</FieldLabel>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  inputMode="tel"
                  className="h-11"
                  autoComplete="tel"
                  placeholder={country.example}
                  aria-invalid={Boolean(state.errors?.customerPhone)}
                  required
                />
                <FieldError>{state.errors?.customerPhone}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="customerAddress">Adresse de livraison</FieldLabel>
                <Input
                  id="customerAddress"
                  name="customerAddress"
                  className="h-11"
                  placeholder="Quartier, repère, rue"
                  aria-invalid={Boolean(state.errors?.customerAddress)}
                  required
                />
                <FieldError>{state.errors?.customerAddress}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="customerCity">Ville</FieldLabel>
                <Input
                  id="customerCity"
                  name="customerCity"
                  className="h-11"
                  placeholder="Conakry"
                  aria-invalid={Boolean(state.errors?.customerCity)}
                />
                <FieldError>{state.errors?.customerCity}</FieldError>
              </Field>

              {zones.length > 0 ? (
                <Field>
                  <FieldLabel htmlFor="deliveryZoneId">Zone de livraison</FieldLabel>
                  <Select name="deliveryZoneId">
                    <SelectTrigger id="deliveryZoneId" className="h-11 w-full">
                      <SelectValue placeholder="Choisir une zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.zone_name} — {formatMoney(zone.price, currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{state.errors?.deliveryZoneId}</FieldError>
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="note">Message pour le vendeur (facultatif)</FieldLabel>
                <Textarea id="note" name="note" rows={2} placeholder="Livrer après 17 h" />
                <FieldDescription>
                  Le vendeur reçoit votre commande sur WhatsApp dès l&apos;envoi.
                </FieldDescription>
              </Field>

              {state.message ? (
                <p role="alert" className="text-sm text-destructive">
                  {state.message}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="h-12 w-full" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Envoyer ma commande
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
