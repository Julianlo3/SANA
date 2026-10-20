import type { Metadata } from "next";
import { requireAdministrator } from "@/lib/auth-guard";
import UsersListPage from "@/features/users/pages/users-list-page";

export const metadata: Metadata = { title: "Usuarios | SANA" };

/**
 * Page for listing all users.
 * @returns The users list page.
 */
export default async function Users() {
  await requireAdministrator();
  return <UsersListPage />;
}