import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BroadcastForm } from "@/components/network/broadcast-form";
import { requireRole } from "@/lib/dal";
import { countAudience } from "@/lib/push/broadcast";

export const metadata = { title: "Diffusion — Watshop" };

export default async function AdminBroadcastPage() {
  await requireRole("admin");
  const counts = await countAudience();

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/admin">
          <ArrowLeft />
          Administration
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Diffusion</h1>
        <p className="text-sm text-muted-foreground">
          Prévenir les vendeurs d&apos;une nouveauté, d&apos;une opération, d&apos;une coupure.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TriangleAlert className="size-4 text-muted-foreground" />
            À lire avant d&apos;envoyer sur WhatsApp
          </CardTitle>
          <CardDescription>
            Un compte qui expédie des centaines de messages d&apos;un coup se fait bannir par Meta,
            et c&apos;est le numéro Watshop qui saute — pas seulement un quota. La diffusion
            WhatsApp est donc plafonnée à 200 messages, envoyés un par un. La notification dans
            l&apos;application, elle, est gratuite et illimitée : préférez-la quand le message
            n&apos;est pas urgent.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouveau message</CardTitle>
        </CardHeader>
        <CardContent>
          <BroadcastForm counts={counts} />
        </CardContent>
      </Card>
    </div>
  );
}
