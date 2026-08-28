import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stepper } from "@/components/onboarding/stepper";
import { WhatsappForm } from "@/components/onboarding/whatsapp-form";
import { requireShop } from "@/lib/shop/queries";
import { verifySession } from "@/lib/dal";

export const metadata = { title: "WhatsApp — Watshop" };

export default async function OnboardingWhatsappPage() {
  const [shop, session] = await Promise.all([requireShop(), verifySession()]);

  // Le plus souvent, le vendeur s'est justement inscrit avec son numéro
  // WhatsApp : autant le pré-remplir plutôt que de le lui redemander.
  const defaultPhone = shop.whatsapp_number ?? session.phone ?? "";

  return (
    <div className="flex flex-col gap-6">
      <Stepper current={5} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recevoir vos commandes</CardTitle>
          <CardDescription>
            Chaque commande vous arrivera sur WhatsApp, avec le détail et le contact du client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WhatsappForm
            defaultValues={{
              phone: defaultPhone,
              mobileMoney: shop.mobile_money_number ?? "",
              countryCode: shop.country_code,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
