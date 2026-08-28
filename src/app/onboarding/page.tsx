import { redirect } from "next/navigation";

import { getMyShop, onboardingPath } from "@/lib/shop/queries";

// Point d'entrée : renvoie chacun là où il s'est arrêté.
export default async function OnboardingIndex() {
  const shop = await getMyShop();

  if (!shop) redirect("/onboarding/boutique");
  if (shop.published_at) redirect("/dashboard");

  redirect(onboardingPath(shop.onboarding_step));
}
