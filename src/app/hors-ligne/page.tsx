import { WifiOff } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ReloadWhenOnline } from "@/components/pwa/reload-when-online";

export const metadata = { title: "Hors ligne — Watshop" };

// Page servie par le service worker quand le réseau manque. Volontairement
// autonome : aucune donnée à charger, sinon elle échouerait elle aussi.
export default function HorsLignePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <ReloadWhenOnline />
      <Logo />
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WifiOff className="size-5" />
      </span>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Pas de connexion</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Watshop a besoin d&apos;Internet pour afficher vos commandes et vos produits. Vérifiez
          votre connexion : la page se rechargera toute seule dès qu&apos;elle reviendra.
        </p>
      </div>
    </div>
  );
}
