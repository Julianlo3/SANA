import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { auth0 } from "@/lib/auth0";
import "@/styles/globals.css";

/*
  Montserrat en toda la aplicación, como indica el manual de marca:
  ExtraBold (800) para títulos y destacados, Regular (400) para el cuerpo.
*/
const montserrat = Montserrat({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SANA — Fundación Dejando Huellas Felices",
  description: "Plataforma de gestión de la fundación",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth0.getSession();

  return (
    <html lang="es" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-text">
        <Auth0Provider user={session?.user}>{children}</Auth0Provider>
      </body>
    </html>
  );
}