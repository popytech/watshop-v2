"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FacebookIcon, InstagramIcon, TiktokIcon } from "@/components/brand/social-icons";
import { Input } from "@/components/ui/input";
import { shareLink, shopShareMessage } from "@/lib/whatsapp";

/**
 * Partage de la boutique. Instagram et TikTok n'ouvrent pas de fenêtre de
 * partage web : pour eux, la seule action utile est de copier le message tout
 * prêt, que le vendeur colle dans sa bio ou sa story.
 */
export function SharePanel({ shopName, url }: { shopName: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const message = shopShareMessage(shopName, url);

  async function copy(text: string, confirmation: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(confirmation);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible. Sélectionnez le lien à la main.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input readOnly value={url} className="h-11 font-mono text-xs" aria-label="Lien de la boutique" />
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 shrink-0"
          onClick={() => copy(url, "Lien copié")}
        >
          {copied ? <Check /> : <Copy />}
          Copier
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button asChild variant="outline" size="lg" className="h-11">
          <a
            href={shareLink("whatsapp", url, message)!}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            WhatsApp
          </a>
        </Button>

        <Button asChild variant="outline" size="lg" className="h-11">
          <a
            href={shareLink("facebook", url, message)!}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookIcon />
            Facebook
          </a>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          onClick={() => copy(message, "Message copié pour Instagram")}
        >
          <InstagramIcon />
          Instagram
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          onClick={() => copy(message, "Message copié pour TikTok")}
        >
          <TiktokIcon />
          TikTok
        </Button>
      </div>
    </div>
  );
}
