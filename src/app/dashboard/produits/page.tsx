import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductListItem } from "@/components/shop/product-list-item";
import { getProducts, requirePublishedShop } from "@/lib/shop/queries";

export const metadata = { title: "Produits — Watshop" };

export default async function ProductsPage() {
  const shop = await requirePublishedShop();
  const products = await getProducts(shop.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produits</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} produit{products.length > 1 ? "s" : ""} dans votre boutique
          </p>
        </div>
        <Button asChild size="lg" className="h-11 shrink-0">
          <Link href="/dashboard/produits/nouveau">
            <Plus />
            <span className="hidden sm:inline">Ajouter</span>
          </Link>
        </Button>
      </div>

      {products.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {products.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              currency={shop.currency_symbol}
              href={`/dashboard/produits/${product.id}`}
            />
          ))}
        </ul>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-6">
            <p className="text-sm text-muted-foreground">
              Votre catalogue est vide. Ajoutez un premier produit pour que vos clients aient
              quelque chose à commander.
            </p>
            <Button asChild size="lg" className="h-11">
              <Link href="/dashboard/produits/nouveau">
                <Plus />
                Ajouter un produit
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
