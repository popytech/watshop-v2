import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = { searchParams: Promise<{ next?: string }> };

export const metadata: Metadata = {
  title: "Connexion — Watshop",
  description: "Connectez-vous à votre boutique Watshop.",
};

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return (
    <Card className="p-2">
      <CardHeader>
        <CardTitle className="text-xl">Se connecter</CardTitle>
        <CardDescription>
          Recevez un code à 6 chiffres sur WhatsApp ou par email. Aucun mot de passe à retenir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="login" next={next} />
      </CardContent>
    </Card>
  );
}
