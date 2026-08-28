import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";

// Le vert de marque passe par le token --primary (globals.css) : plus aucun
// #25d366 codé en dur comme dans le legacy (87 occurrences rien que dans
// admin/page.tsx).
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShoppingBag className="size-4" />
      </span>
      <span className="text-lg">Watshop</span>
    </Link>
  );
}
