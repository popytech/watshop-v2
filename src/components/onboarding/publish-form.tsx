"use client";

import { useActionState } from "react";
import { Loader2, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { publishShop } from "@/lib/shop/actions";
import { initialFormState } from "@/lib/shop/state";

export function PublishForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(publishShop, initialFormState);

  return (
    <form action={action} className="flex flex-col gap-2">
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending || disabled}>
        {pending ? <Loader2 className="animate-spin" /> : <Rocket />}
        Publier ma boutique
      </Button>
      {state.message ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
