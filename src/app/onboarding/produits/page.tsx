import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stepper } from "@/components/onboarding/stepper";
import { ProductForm } from "@/components/shop/product-form";
import { ProductListItem } from "@/components/shop/product-list-item";
import { createProduct, finishProductsStep } from "@/lib/shop/actions";
import { getProducts, requireShop } from "@/lib/shop/queries";

export const metadata = { title: "Vos produits — Watshop" };

export default async function OnboardingProductsPage() {
  const shop = await requireShop();
  const products = await getProducts(shop.id);

  return (
    <div className="flex flex-col gap-6">
      <Stepper current={4} />

      {products.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {products.length} produit{products.length > 1 ? "s" : ""} ajouté
              {products.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {products.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  currency={shop.currency_symbol}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {products.length > 0 ? "Ajouter un autre produit" : "Votre premier produit"}
          </CardTitle>
          <CardDescription>
            Un nom, un prix, une photo : c&apos;est tout ce qu&apos;il faut pour commencer à
            vendre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            action={createProduct}
            submitLabel="Ajouter le produit"
            currency={shop.currency_symbol}
          />
        </CardContent>
      </Card>

      <form action={finishProductsStep}>
        <Button
          type="submit"
          size="lg"
          variant={products.length > 0 ? "default" : "outline"}
          className="h-11 w-full"
          disabled={products.length === 0}
        >
          Continuer
          <ArrowRight />
        </Button>
        {products.length === 0 ? (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Ajoutez au moins un produit pour continuer.
          </p>
        ) : null}
      </form>
    </div>
  );
}
