"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// next-themes était installé depuis le début sans être branché — l'audit du
// legacy le relevait déjà. Il l'est maintenant : la palette sombre existe dans
// globals.css, autant qu'elle serve.
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
