import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stepper } from "@/components/onboarding/stepper";
import { ShopIdentityForm } from "@/components/onboarding/shop-identity-form";
import { getMyShop } from "@/lib/shop/queries";
import { getProfile } from "@/lib/dal";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = { title: "Votre boutique — Watshop" };

export default async function OnboardingShopPage() {
  const [shop, profile, siteUrl] = await Promise.all([getMyShop(), getProfile(), getSiteUrl()]);

  return (
    <div className="flex flex-col gap-6">
      <Stepper current={2} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Votre boutique</CardTitle>
          <CardDescription>
            Le nom que vos clients verront, et l&apos;adresse que vous partagerez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShopIdentityForm
            siteUrl={siteUrl}
            defaultValues={{
              name: shop?.name ?? "",
              slug: shop?.slug ?? "",
              category: shop?.category ?? "",
              description: shop?.description ?? "",
              countryCode: shop?.country_code ?? profile.country_code,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
