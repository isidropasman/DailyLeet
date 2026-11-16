import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";

export const metadata: Metadata = {
  title: "DailyLeet — Tu dosis diaria de lógica",
  description: "Un desafío de programación, cinco minutos y tu propio camino. Construí algoritmos sin pelearte con la sintaxis.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ClerkProvider localization={esES} signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" afterSignOutUrl="/"><html lang="es-AR"><body>{children}</body></html></ClerkProvider>;
}
