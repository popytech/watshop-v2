import Link from "next/link";
import { Check, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stepper } from "@/components/onboarding/stepper";
import { PublishForm } from "@/components/onboarding/publish-form";
import { getProducts, requireShop } from "@/lib/shop/queries";
import { getSiteUrl } from "@/lib/site-url";
import { formatPhone } from "@/lib/phone";
import { shopPath } from "@/lib/tenant";

export const metadata = { title: "Publication — Watshop" };

export default async function OnboardingPublishPage() {
  const shop = await requireShop();
  const [products, siteUrl] = await Promise.all([getProducts(shop.id), getSiteUrl()]);

  // Ce qui manque encore, dit en français plutôt qu'en message d'erreur au
  // moment du clic.
  const checks = [
    { label: "Nom et adresse de la boutique", ok: Boolean(shop.name && shop.slug), href: "/onboarding/boutique" },
    { label: "Au moins un produit", ok: products.length > 0, href: "/onboarding/produits" },
    { label: "Numéro WhatsApp", ok: Boolean(shop.whatsapp_number), href: "/onboarding/whatsapp" },
  ];
  const pret = checks.every((check) => check.ok);

  return (
    <div className="flex flex-col gap-6">
      <Stepper current={6} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tout est prêt ?</CardTitle>
          <CardDescription>
            Une fois publiée, votre boutique sera visible par tous ceux à qui vous enverrez le
            lien.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <ul className="flex flex-col gap-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center gap-2 text-sm">
                {check.ok ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : (
                  <CircleAlert className="size-5 shrink-0 text-destructive" />
                )}
                <span className={check.ok ? "" : "text-destructive"}>{check.label}</span>
                {check.ok ? null : (
                  <Button asChild variant="link" size="sm" className="h-auto p-0">
                    <Link href={check.href}>Compléter</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>

          <dl className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Boutique</dt>
              <dd className="font-medium">{shop.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Adresse</dt>
              <dd className="font-medium break-all">
                {siteUrl.replace(/^https?:\/\//, "")}
                {shopPath(shop.slug)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Produits</dt>
              <dd className="font-medium">{products.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">WhatsApp</dt>
              <dd className="font-medium">
                {shop.whatsapp_number ? formatPhone(shop.whatsapp_number) : "—"}
              </dd>
            </div>
          </dl>

          <PublishForm disabled={!pret} />
        </CardContent>
      </Card>
    </div>
  );
}
