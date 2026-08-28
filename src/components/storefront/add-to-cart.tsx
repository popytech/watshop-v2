"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { useCart, type CartItem } from "@/lib/cart/use-cart";
import { cn } from "@/lib/utils";

type Props = {
  shopSlug: string;
  item: Omit<CartItem, "quantity" | "size">;
  sizes: string[];
  inStock: boolean;
};

/**
 * Ajout au panier, avec le choix de la taille et de la quantité.
 * « Commander sur WhatsApp » ajoute puis emmène directement au panier : c'est
 * le chemin court, celui qu'utiliseront la plupart des acheteurs.
 */
export function AddToCart({ shopSlug, item, sizes, inStock }: Props) {
  const router = useRouter();
  const { add } = useCart(shopSlug);
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [quantity, setQuantity] = useState(1);

  function ajouter(): boolean {
    if (sizes.length > 0 && !size) {
      toast.error("Choisissez une taille.");
      return false;
    }

    add({ ...item, quantity, size });
    return true;
  }

  if (!inStock) {
    return (
      <Button size="lg" className="h-12 w-full" disabled>
        Rupture de stock
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sizes.length > 0 ? (
        <Field>
          <FieldLabel htmlFor="taille">Taille</FieldLabel>
          <div id="taille" className="flex flex-wrap gap-2">
            {sizes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSize(option)}
                aria-pressed={size === option}
                className={cn(
                  "min-w-12 rounded-lg border px-3 py-2 text-sm transition-colors",
                  size === option
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "hover:bg-muted",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </Field>
      ) : null}

      <Field>
        <FieldLabel htmlFor="quantite">Quantité</FieldLabel>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            aria-label="Diminuer la quantité"
          >
            <Minus />
          </Button>
          <span id="quantite" aria-live="polite" className="w-8 text-center text-lg tabular-nums">
            {quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => setQuantity((value) => Math.min(99, value + 1))}
            aria-label="Augmenter la quantité"
          >
            <Plus />
          </Button>
        </div>
      </Field>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          size="lg"
          className="h-12 flex-1"
          onClick={() => {
            if (ajouter()) router.push(`/${shopSlug}/panier?source=whatsapp`);
          }}
        >
          Commander sur WhatsApp
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 flex-1"
          onClick={() => {
            if (ajouter()) toast.success("Ajouté au panier");
          }}
        >
          <ShoppingBag />
          Ajouter au panier
        </Button>
      </div>
    </div>
  );
}
