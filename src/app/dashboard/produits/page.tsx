import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductListItem } from "@/components/shop/product-list-item";
import { getProducts, requirePublishedShop } from "@/lib/shop/queries";
import { getAccesPro } from "@/lib/payment/access";
import { LIMITES_GRATUIT } from "@/lib/payment/providers";

export const metadata = { title: "Produits — Watshop" };

export default async function ProductsPage() {
  const shop = await requirePublishedShop();
  const products = await getProducts(shop.id);
  const pro = (await getAccesPro(shop.user_id)).actif;

  const plafond = LIMITES_GRATUIT.produits;
  const restants = plafond - products.length;
  // Le rappel n'apparaît que dans les trois derniers articles : plus tôt il
  // n'apprendrait rien, plus tard il arriverait après le refus.
  const bientotPlein = !pro && restants <= 3;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produits</h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {products.length} produit{products.length > 1 ? "s" : ""}
            {pro ? " dans votre boutique" : ` sur ${plafond}`}
          </p>
        </div>
        <Button asChild size="lg" className="h-11 shrink-0">
          <Link href="/dashboard/produits/nouveau">
            <Plus />
            <span className="hidden sm:inline">Ajouter</span>
          </Link>
        </Button>
      </div>

      {bientotPlein ? (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            {restants > 0 ? (
              <>
                Il vous reste <span className="font-medium">{restants}</span> produit
                {restants > 1 ? "s" : ""} sur l&apos;offre gratuite.
              </>
            ) : (
              <>
                Vous avez atteint les {plafond} produits de l&apos;offre gratuite. Vos produits
                restent en ligne.
              </>
            )}{" "}
            Passez en Pro pour en publier autant que vous voulez.
          </p>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/dashboard/abonnement">Passer en Pro</Link>
          </Button>
        </div>
      ) : null}

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
