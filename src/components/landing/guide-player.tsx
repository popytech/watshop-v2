"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { Mockup, MockupFrame } from "@/components/landing/mockup";
import type { VideoSource } from "@/lib/landing/video";

/**
 * Lecteur du guide, en façade, démarré au clic — avec le son.
 *
 * On ne lance pas la vidéo toute seule : une lecture automatique ne peut, par
 * décision des navigateurs, partir qu'en sourdine, et une vidéo-guide muette n'a
 * pas d'intérêt. Le visiteur touche le bouton une fois, ce geste autorise le son,
 * et la vidéo part avec.
 *
 * Rien du lecteur — ni l'iframe YouTube, ni le fichier — n'est chargé avant ce
 * clic : sur la moitié des connexions du pays, une iframe YouTube au chargement,
 * c'est plusieurs centaines de kilo-octets et des traceurs posés pour une vidéo
 * que personne n'a demandée. On ne montre d'abord qu'une affiche et un bouton.
 */
export function GuidePlayer({ source }: { source: VideoSource }) {
  const [actif, setActif] = useState(false);

  return (
    <MockupFrame size="small" className="w-full">
      <Mockup type="responsive" className="aspect-video w-full bg-black">
        {actif ? (
          source.kind === "file" ? (
            <video src={source.embedUrl} controls autoPlay playsInline className="size-full">
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
    </MockupFrame>
  );
}
