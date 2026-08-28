"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/use-cart";

export function CartButton({ shopSlug }: { shopSlug: string }) {
  const { count } = useCart(shopSlug);

  return (
    <Button asChild variant="outline" size="lg" className="relative h-11">
      <Link href={`/${shopSlug}/panier`}>
        <ShoppingBag />
        <span className="hidden sm:inline">Panier</span>
        {count > 0 ? (
          <span
            className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground"
            aria-label={`${count} article${count > 1 ? "s" : ""} dans le panier`}
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
