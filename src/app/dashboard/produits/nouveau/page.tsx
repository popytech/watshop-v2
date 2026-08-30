import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductForm } from "@/components/shop/product-form";
import { createProduct } from "@/lib/shop/actions";
import { requirePublishedShop } from "@/lib/shop/queries";
import { getAccesPro } from "@/lib/payment/access";
import { LIMITES_GRATUIT, PHOTOS_MAX_PRO } from "@/lib/payment/providers";

export const metadata = { title: "Nouveau produit — Watshop" };

export default async function NewProductPage() {
  const shop = await requirePublishedShop();
  const acces = await getAccesPro(shop.user_id);

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/dashboard/produits">
          <ArrowLeft />
          Produits
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Nouveau produit</CardTitle>
          <CardDescription>
            Il apparaîtra tout de suite dans votre boutique en ligne.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            action={createProduct}
            submitLabel="Ajouter le produit"
            currency={shop.currency_symbol}
            pro={acces.actif}
            maxImages={acces.actif ? PHOTOS_MAX_PRO : LIMITES_GRATUIT.photosParProduit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
