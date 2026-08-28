import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { signOut } from "@/lib/auth/actions";
import { roleLabel } from "@/lib/auth/roles";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

function initials(profile: Profile): string {
  const source = profile.name ?? profile.email ?? profile.phone ?? "?";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppHeader({ profile, home }: { profile: Profile; home: string }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Logo href={home} />

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {roleLabel(profile.role)}
          </Badge>

          <Avatar className="size-8">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="" />
            ) : null}
            <AvatarFallback>{initials(profile)}</AvatarFallback>
          </Avatar>

          <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">
            {profile.name ?? profile.email ?? profile.phone}
          </span>

          {/* La déconnexion est une Server Action : elle invalide la session
              Supabase côté serveur, pas seulement un token en localStorage. */}
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Se déconnecter">
              <LogOut />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
