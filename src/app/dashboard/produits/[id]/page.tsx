import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductForm } from "@/components/shop/product-form";
import { DeleteProductButton } from "@/components/shop/delete-product-button";
import { toggleProduct, updateProduct } from "@/lib/shop/actions";
import { getProduct, requirePublishedShop } from "@/lib/shop/queries";
import { getAccesPro } from "@/lib/payment/access";
import { LIMITES_GRATUIT, PHOTOS_MAX_PRO } from "@/lib/payment/providers";

export const metadata = { title: "Modifier un produit — Watshop" };

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const shop = await requirePublishedShop();
  const acces = await getAccesPro(shop.user_id);
  const product = await getProduct(shop.id, id);

  if (!product) notFound();

  const images = [...(product.product_images ?? [])];

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/dashboard/produits">
          <ArrowLeft />
          Produits
        </Link>
      </Button>

      {images.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos actuelles</CardTitle>
            <CardDescription>
              Les nouvelles photos s&apos;ajoutent à celles-ci.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {images.map((image) => (
                <li
                  key={image.url}
                  className="size-20 overflow-hidden rounded-lg border bg-muted"
                >
                  <Image
                    src={image.url}
                    alt={image.alt_text || product.name}
                    width={80}
                    height={80}
                    className="size-full object-cover"
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            action={updateProduct}
            productId={product.id}
            submitLabel="Enregistrer"
            currency={shop.currency_symbol}
            pro={acces.actif}
            maxImages={acces.actif ? PHOTOS_MAX_PRO : LIMITES_GRATUIT.photosParProduit}
            defaultValues={{
              name: product.name,
              price: String(product.price),
              promoPrice: product.promo_price ? String(product.promo_price) : "",
              quantity: String(product.quantity),
              sizes: (product.sizes ?? []).join(", "),
              description: product.description ?? "",
              resellerCommissionPct: String(product.reseller_commission_pct),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visibilité</CardTitle>
          <CardDescription>
            Un produit masqué reste dans votre catalogue mais disparaît de la boutique publique.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <form action={toggleProduct}>
            <input type="hidden" name="productId" value={product.id} />
            <Button type="submit" variant="outline" size="lg" className="h-11">
              {product.is_active ? <EyeOff /> : <Eye />}
              {product.is_active ? "Masquer" : "Remettre en ligne"}
            </Button>
          </form>

          <DeleteProductButton productId={product.id} productName={product.name} />
        </CardContent>
      </Card>
    </div>
  );
}
