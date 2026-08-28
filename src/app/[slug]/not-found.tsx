import Link from "next/link";
import { Store } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ShopNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Store className="size-5" />
      </span>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Boutique introuvable</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Cette adresse ne correspond à aucune boutique publiée. Vérifiez le lien qu&apos;on vous
          a envoyé.
        </p>
      </div>
      <Button asChild size="lg" className="h-11">
        <Link href="/">Découvrir Watshop</Link>
      </Button>
    </div>
  );
}
