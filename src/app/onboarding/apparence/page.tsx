import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stepper } from "@/components/onboarding/stepper";
import { AppearanceForm } from "@/components/onboarding/appearance-form";
import { requireShop } from "@/lib/shop/queries";

export const metadata = { title: "Apparence — Watshop" };

export default async function OnboardingAppearancePage() {
  const shop = await requireShop();

  return (
    <div className="flex flex-col gap-6">
      <Stepper current={3} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Logo et couleur</CardTitle>
          <CardDescription>
            Ce que vos clients reconnaîtront en un coup d&apos;œil. Vous pourrez tout changer plus
            tard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceForm currentLogoUrl={shop.logo_url} defaultColor={shop.primary_color} />
        </CardContent>
      </Card>
    </div>
  );
}
