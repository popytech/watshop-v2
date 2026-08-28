import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { getCurrentUser } from "@/lib/dal";

// Page d'accueil volontairement minimale : la landing complète et la boutique
// publique arrivent en Phase 3. Elle sert surtout de point d'entrée vers
// l'authentification livrée en Phase 1.

const POINTS = [
  {
    icon: MessageCircle,
    title: "Connexion par WhatsApp",
    text: "Un code à 6 chiffres reçu sur WhatsApp. Pas de mot de passe à retenir.",
  },
  {
    icon: ShieldCheck,
    title: "Session vérifiée côté serveur",
    text: "Chaque page protégée revalide l'identité auprès de Supabase Auth.",
  },
  {
    icon: Smartphone,
    title: "Pensé pour le mobile",
    text: "Vos clients commandent depuis leur téléphone, en quelques secondes.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <Button asChild variant="ghost" size="sm">
          <Link href={user ? "/dashboard" : "/login"}>
            {user ? "Mon espace" : "Se connecter"}
          </Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-4 py-12">
        <div className="flex flex-col gap-5 sm:max-w-2xl">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Votre boutique WhatsApp,
            <span className="text-primary"> prête en quelques minutes.</span>
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Watshop transforme votre numéro WhatsApp en vraie boutique en ligne : catalogue,
            commandes et livraison, sans quitter l&apos;application que vos clients utilisent
            déjà.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11">
              <Link href={user ? "/dashboard" : "/register"}>
                {user ? "Ouvrir mon espace" : "Créer ma boutique"}
                <ArrowRight />
              </Link>
            </Button>
            {user ? null : (
              <Button asChild variant="outline" size="lg" className="h-11">
                <Link href="/login">J&apos;ai déjà un compte</Link>
              </Button>
            )}
          </div>
        </div>

        <ul className="grid gap-6 sm:grid-cols-3">
          {POINTS.map((point) => (
            <li key={point.title} className="flex flex-col gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <point.icon className="size-4" />
              </span>
              <h2 className="font-medium">{point.title}</h2>
              <p className="text-sm text-muted-foreground">{point.text}</p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-muted-foreground">
        Watshop — Guinée. Reconstruction en cours, phase 1 : authentification et rôles.
      </footer>
    </div>
  );
}
