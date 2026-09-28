import type { Metadata } from "next";
import UserCreatePage from "@/features/users/pages/user-create-page";

export const metadata: Metadata = { title: "Crear usuario | SANA" };

export default function NewUser() {
  return <UserCreatePage />;
}