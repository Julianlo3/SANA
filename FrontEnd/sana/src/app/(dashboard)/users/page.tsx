import type { Metadata } from "next";
import UsersListPage from "@/features/users/pages/users-list-page";

export const metadata: Metadata = { title: "Usuarios | SANA" };

export default function Users() {
  return <UsersListPage />;
}