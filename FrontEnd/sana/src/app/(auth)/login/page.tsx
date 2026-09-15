import type { Metadata } from "next";
import LoginPage from "@/features/auth/pages/login-page";

export const metadata: Metadata = { title: "Iniciar sesión | SANA" };

export default function Login() {
  return <LoginPage />;
}
