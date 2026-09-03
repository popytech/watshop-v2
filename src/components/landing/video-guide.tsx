import { Section, SectionHeader } from "@/components/landing/section";
import { Glow } from "@/components/landing/glow";
import { GuidePlayer } from "@/components/landing/guide-player";
import { parseVideoSource } from "@/lib/landing/video";

/*
 * Section vidéo-guide : « comment créer sa boutique, jusqu'à l'ajout des
 * produits ». Placée juste après les étapes, dont elle est la démonstration.
 *
 * Le lien tient dans une seule variable, NEXT_PUBLIC_GUIDE_VIDEO_URL, pour
 * pouvoir être posé (ou changé) sans toucher au code. Tant qu'il est vide, la
 * section ne s'affiche pas en production : on ne montre pas un bouton de lecture
 * qui ne mène nulle part à un client. En développement, un repère prend sa place
 * pour qu'on vérifie son emplacement avant d'avoir la vidéo.
 */

// Par défaut, la vidéo-guide fournie ; NEXT_PUBLIC_GUIDE_VIDEO_URL la remplace
// sans redéploiement si un jour elle change.
const VIDEO_URL =
  process.env.NEXT_PUBLIC_GUIDE_VIDEO_URL?.trim() || "https://youtu.be/UKzQyKISEx4";

export function VideoGuide() {
  const source = VIDEO_URL ? parseVideoSource(VIDEO_URL) : null;

  if (!source) {
    // Rien en production ; un simple repère en développement.
    if (process.env.NODE_ENV !== "development") return null;

    return (
      <Section className="line-b">
        <div className="mx-auto flex aspect-video max-w-4xl items-center justify-center rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Emplacement de la vidéo-guide — renseignez{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_GUIDE_VIDEO_URL</code> pour
          l&apos;afficher.
        </div>
      </Section>
    );
  }

  return (
    <Section className="line-b relative overflow-hidden">
      <Glow variant="center" className="opacity-60" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-10 sm:gap-12">
        <SectionHeader
          eyebrow="En vidéo"
          title="Regardez une boutique se créer, de A à Z"
          description="De l'inscription à votre premier produit en ligne. Suivez la vidéo, faites pareil de votre côté."
        />

        <GuidePlayer source={source} />
      </div>
    </Section>
  );
}
