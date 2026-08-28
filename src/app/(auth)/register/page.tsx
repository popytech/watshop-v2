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
  title: "Créer un compte — Watshop",
  description: "Créez votre boutique WhatsApp en quelques minutes.",
};

export default async function RegisterPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return (
    <Card className="p-2">
      <CardHeader>
        <CardTitle className="text-xl">Créer votre compte</CardTitle>
        <CardDescription>
          Votre boutique WhatsApp en quelques minutes. On vous envoie un code pour confirmer que
          le numéro est bien le vôtre.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="register" next={next} />
      </CardContent>
    </Card>
  );
}
