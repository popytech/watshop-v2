"use client";

import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/lib/shop/actions";

/**
 * La suppression est définitive et le produit peut être en ligne : on demande
 * confirmation plutôt que de la déclencher au premier clic.
 */
export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" size="lg" className="h-11">
          <Trash2 />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {productName} » ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le produit et ses photos disparaîtront de votre boutique. Cette action est
            définitive. Pour le retirer temporairement, préférez « Masquer ».
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <form action={deleteProduct}>
            <input type="hidden" name="productId" value={productId} />
            <AlertDialogAction type="submit">Supprimer</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
