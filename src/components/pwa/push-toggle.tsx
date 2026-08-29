"use client";

import { useState, useSyncExternalStore } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { removePushSubscription, savePushSubscription } from "@/lib/push/actions";

// Conversion de la clé VAPID (base64url) vers le format attendu par
// PushManager. Sans elle, le navigateur refuse l'abonnement.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const brut = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));

  // On alloue explicitement un ArrayBuffer : PushManager n'accepte pas une vue
  // sur un SharedArrayBuffer, que le type large de Uint8Array.from autorise.
  const octets = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i);
  return octets;
}

// La permission est un état du navigateur, pas de React : useSyncExternalStore
// évite un setState dans un effet au montage.
function souscrire(callback: () => void) {
  const minuteur = window.setInterval(callback, 2000);
  return () => window.clearInterval(minuteur);
}

function lirePermission(): string {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export function PushToggle() {
  const permission = useSyncExternalStore(souscrire, lirePermission, () => "default");
  const [pending, setPending] = useState(false);

  async function activer() {
    setPending(true);
    try {
      const cle = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!cle) {
        toast.error("Les notifications ne sont pas configurées sur ce serveur.");
        return;
      }

      const autorisation = await Notification.requestPermission();
      if (autorisation !== "granted") {
        toast.error("Notifications refusées. Vous pouvez les réautoriser dans votre navigateur.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const abonnement = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cle),
      });

      const json = abonnement.toJSON();
      const resultat = await savePushSubscription(
        abonnement.endpoint,
        json.keys?.p256dh ?? "",
        json.keys?.auth ?? "",
      );

      if (resultat.ok) toast.success("Notifications activées sur cet appareil.");
      else toast.error("Enregistrement impossible. Réessayez.");
    } catch {
      toast.error("Votre navigateur n'a pas accepté les notifications.");
    } finally {
      setPending(false);
    }
  }

  async function desactiver() {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const abonnement = await registration.pushManager.getSubscription();
      if (abonnement) {
        await removePushSubscription(abonnement.endpoint);
        await abonnement.unsubscribe();
      }
      toast.success("Notifications désactivées sur cet appareil.");
    } catch {
      toast.error("Désactivation impossible.");
    } finally {
      setPending(false);
    }
  }

  if (permission === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        Votre navigateur ne gère pas les notifications. Sur iPhone, installez
        d&apos;abord Watshop sur l&apos;écran d&apos;accueil.
      </p>
    );
  }

  if (permission === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        Les notifications ont été bloquées pour ce site. Réautorisez-les dans les réglages de
        votre navigateur, puis rechargez la page.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="lg" className="h-11" onClick={activer} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Bell />}
        {permission === "granted" ? "Réactiver sur cet appareil" : "Activer les notifications"}
      </Button>

      {permission === "granted" ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          onClick={desactiver}
          disabled={pending}
        >
          <BellOff />
          Désactiver
        </Button>
      ) : null}
    </div>
  );
}
