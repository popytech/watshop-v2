import type { Metadata, Viewport } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Watshop",
  description: "Créez votre boutique WhatsApp en quelques minutes.",
  appleWebApp: { capable: true, title: "Watshop", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // La couleur de la barre système suit le thème : sur un téléphone en mode
  // sombre, une barre blanche trancherait avec le reste de l'écran.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#128c4a" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : next-themes pose la classe de thème sur <html>
    // avant l'hydratation, ce que React signalerait sinon comme une différence.
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
