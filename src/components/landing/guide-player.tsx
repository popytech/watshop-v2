"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

import { Mockup, MockupFrame } from "@/components/landing/mockup";
import type { VideoSource } from "@/lib/landing/video";

/**
 * Lecteur du guide : démarre tout seul, en sourdine, à l'entrée dans la vue.
 *
 * Deux exigences qui semblent s'opposer, tenues ensemble :
 *  - la vidéo doit se lire automatiquement ;
 *  - sur la moitié des connexions du pays, on ne charge pas une iframe YouTube
 *    (plusieurs centaines de kilo-octets, et des traceurs) au chargement de la
 *    page, pour une section qui est plus bas.
 *
 * D'où le déclenchement à l'intersection : rien n'est chargé tant que la section
 * n'approche pas de l'écran ; dès qu'elle y entre, le lecteur se charge et part.
 * La lecture automatique n'est autorisée par les navigateurs qu'en sourdine —
 * `mute=1` est dans l'URL — et le visiteur rétablit le son d'un geste sur les
 * contrôles.
 *
 * Le bouton d'affiche reste comme secours : sans JavaScript, ou sur un
 * navigateur sans IntersectionObserver, un clic lance la lecture.
 */
export function GuidePlayer({ source }: { source: VideoSource }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [actif, setActif] = useState(false);

  useEffect(() => {
    if (actif) return;
    const cible = conteneur.current;
    if (!cible) return;

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((entree) => entree.isIntersecting)) setActif(true);
      },
      // Un peu de la section visible suffit à lancer.
      { threshold: 0.35 },
    );

    observateur.observe(cible);
    return () => observateur.disconnect();
  }, [actif]);

  return (
    <MockupFrame size="small" className="w-full">
      <div ref={conteneur} className="w-full">
        <Mockup type="responsive" className="aspect-video w-full bg-black">
          {actif ? (
            source.kind === "file" ? (
              <video src={source.embedUrl} controls autoPlay muted playsInline className="size-full">
                Votre navigateur ne peut pas lire cette vidéo.
              </video>
            ) : (
              <iframe
                src={source.embedUrl}
                title="Guide Watshop : créer sa boutique et ajouter ses produits"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full border-0"
              />
            )
          ) : (
            <button
              type="button"
              onClick={() => setActif(true)}
              aria-label="Lire la vidéo-guide"
              className="group relative size-full cursor-pointer"
            >
              {/* Base dégradée toujours peinte : si la miniature manque, l'affiche
                  reste soignée au lieu de virer au noir. La miniature, en fond CSS
                  — aucun <img>, aucun hôte à déclarer — se pose par-dessus. */}
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-br from-brand/30 to-brand-foreground/25"
              />
              {source.poster ? (
                <span
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url("${source.poster}")` }}
                />
              ) : null}

              <span
                aria-hidden
                className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20"
              />

              <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand shadow-lg transition-transform group-hover:scale-110 sm:size-20">
                <Play className="size-7 translate-x-0.5 fill-current sm:size-9" />
              </span>
            </button>
          )}
        </Mockup>
      </div>
    </MockupFrame>
  );
}
