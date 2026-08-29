import type { ReactNode } from "react";

import { Iphone } from "@/components/ui/iphone";
import { Safari } from "@/components/ui/safari";
import { cn } from "@/lib/utils";

/**
 * Colle entre les cadres d'appareils de Magic UI et notre propre interface.
 *
 * `Iphone` et `Safari` sont prévus pour recevoir une capture d'écran (`src`).
 * Nous voulons y mettre du vrai HTML : une capture pèserait des centaines de
 * kilos, serait floue sur les écrans denses et périmée à la prochaine
 * modification du tableau de bord.
 *
 * Le mécanisme des deux composants le permet sans les modifier. Dès qu'une
 * source est fournie, ils appliquent à leur SVG un masque qui perce un trou à
 * l'emplacement exact de l'écran. Il suffit donc de leur passer un pixel
 * transparent pour activer ce masque, et de poser notre contenu derrière : il
 * apparaît dans le trou, encadré par le vrai dessin de l'appareil.
 */
const PIXEL_TRANSPARENT =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/*
 * Géométrie des écrans, recopiée de `iphone.tsx` et `safari.tsx`, qui la
 * calculent sans l'exporter. Si l'un de ces fichiers est réinstallé depuis le
 * registre et que ses constantes changent, ces valeurs sont à revoir.
 *
 * iPhone : écran 389,5 × 843,5 dans un cadre 433 × 882, coins de 55,75.
 * Safari : écran 1200 × 700 dans un cadre 1203 × 753, coins bas de 11.
 */
const ECRAN_IPHONE = {
  left: "4.9075%",
  top: "2.1825%",
  width: "89.9538%",
  height: "95.6349%",
  borderRadius: "14.313% / 6.6094%",
} as const;

const ECRAN_SAFARI = {
  left: "0.0831%",
  top: "6.9057%",
  width: "99.7506%",
  height: "92.9615%",
  borderRadius: "0 0 0.9153% 1.4286%",
} as const;

/**
 * Notre contenu est placé avant l'appareil dans le DOM : les deux étant
 * positionnés, le cadre se dessine par-dessus, et le trou du masque laisse voir
 * l'écran.
 */
export function PhoneScreen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-block w-full align-middle", className)}>
      <div className="absolute overflow-hidden" style={ECRAN_IPHONE}>
        {children}
      </div>
      <Iphone src={PIXEL_TRANSPARENT} className="relative" />
    </div>
  );
}

export function BrowserScreen({
  url,
  children,
  className,
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-block w-full align-middle", className)}>
      <div className="absolute overflow-hidden" style={ECRAN_SAFARI}>
        {children}
      </div>
      <Safari url={url} imageSrc={PIXEL_TRANSPARENT} className="relative" />
    </div>
  );
}
