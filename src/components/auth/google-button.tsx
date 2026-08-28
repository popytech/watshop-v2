"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/state";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84a10.13 10.13 0 0 1-4.4 6.65v5.52h7.12c4.16-3.83 6.56-9.47 6.56-16.18Z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.32l-7.12-5.52c-1.97 1.32-4.49 2.1-7.44 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7A22 22 0 0 0 24 46Z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.19a13.2 13.2 0 0 1 0-8.38v-5.7H4.34a22 22 0 0 0 0 19.78l7.35-5.7Z"
      />
      <path
        fill="#EA4335"
        d="M24 9.55c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 2.99 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.11l7.35 5.7C13.42 13.42 18.27 9.55 24 9.55Z"
      />
    </svg>
  );
}

export function GoogleButton({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInWithGoogle, initialAuthState);

  return (
    <form action={action} className="flex flex-col gap-2">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Button type="submit" variant="outline" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <GoogleLogo />}
        Continuer avec Google
      </Button>
      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
