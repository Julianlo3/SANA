import type { Metadata } from "next";
import { Nunito, Fraunces } from "next/font/google";
import "@/styles/globals.css";

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
});

export const metadata: Metadata = {
  title: "SANA — Fundación Dejando Huellas Felices",
  description: "Plataforma de gestión de la fundación",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${body.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text">
        {children}
      </body>
    </html>
  );
}