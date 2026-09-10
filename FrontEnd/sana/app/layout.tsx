import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const cuerpo = Plus_Jakarta_Sans({
  variable: "--fuente-cuerpo",
  subsets: ["latin"],
});

const titulo = Playfair_Display({
  variable: "--fuente-titulo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SANA — Fundación Dejando Huellas Felices",
  description: "Plataforma de gestión de la fundación",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${cuerpo.variable} ${titulo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-fondo text-texto">
        {children}
      </body>
    </html>
  );
}