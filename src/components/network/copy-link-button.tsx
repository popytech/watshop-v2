"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Copie un lien dans le presse-papier, avec un retour visuel bref. */
export function CopyLinkButton({ url, label = "Copier" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          toast.success("Lien copié");
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Copie impossible. Sélectionnez le lien à la main.");
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
      {label}
    </Button>
  );
}
