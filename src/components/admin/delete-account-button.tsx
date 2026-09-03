"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/lib/admin/actions";

/**
 * Le bouton de confirmation vit dans le <form>, seul endroit d'où `useFormStatus`
 * voit l'envoi en cours. On n'utilise pas AlertDialogAction ici : il ferme la
 * boîte au clic, ce qui démonterait le formulaire au milieu de l'action. La
 * réussite comme l'échec redirigent — la boîte disparaît avec la navigation, pas
 * avant que le serveur ait fini.
 */
function BoutonConfirmer() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
      Supprimer définitivement
    </Button>
  );
}

export function DeleteAccountButton({
  userId,
  label,
  boutique,
}: {
  userId: string;
  label: string;
  boutique: string | null;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 />
          Supprimer
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form action={deleteAccount}>
          <input type="hidden" name="userId" value={userId} />

          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le compte de {label} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce compte sera supprimé définitivement
              {boutique ? (
                <>
                  , avec la boutique <strong>{boutique}</strong>
                </>
              ) : null}
              , ses produits, ses commandes, ses abonnements et ses images. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel type="button">Annuler</AlertDialogCancel>
            <BoutonConfirmer />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
